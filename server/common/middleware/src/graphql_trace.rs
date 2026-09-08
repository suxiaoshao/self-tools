use async_graphql::{
    Request, Response, ServerError, ServerResult, ValidationResult, Variables, async_trait,
    extensions::{
        Extension, ExtensionContext, ExtensionFactory, NextParseQuery, NextPrepareRequest,
        NextRequest, NextValidation,
    },
    parser::types::ExecutableDocument,
};
use graphql_common::OperationState;
use service_errors::{PublicCode, PublicError};
use std::{
    sync::{Arc, Mutex},
    time::Instant,
};
use tracing::Instrument;

pub struct Logger;
impl ExtensionFactory for Logger {
    fn create(&self) -> Arc<dyn Extension> {
        Arc::new(TracingExtension {
            state: Arc::new(OperationState::default()),
            metadata: Mutex::new(Metadata::default()),
        })
    }
}
struct TracingExtension {
    state: Arc<OperationState>,
    metadata: Mutex<Metadata>,
}
struct Metadata {
    requested: Option<String>,
    operation_type: &'static str,
    operation_name: &'static str,
}
impl Default for Metadata {
    fn default() -> Self {
        Self {
            requested: None,
            operation_type: "other",
            operation_name: "anonymous",
        }
    }
}

/// Never forward framework messages: they can embed literals, variable values and source errors.
fn sanitize(error: &mut ServerError, fallback: PublicCode) {
    // async-graphql erases InputValueError<T> when converting it to ServerError.
    // These fixed framework prefixes distinguish coercion failures after validation;
    // database/domain errors always arrive through the typed adapters with a code.
    let fallback = if error.source.is_none()
        && error.extensions.is_none()
        && (error.message.starts_with("Expected input type ")
            || error.message.starts_with("Failed to parse "))
    {
        PublicCode::InvalidRequest
    } else {
        fallback
    };
    let code = error
        .extensions
        .as_ref()
        .and_then(|e| e.get("code"))
        .and_then(|v| v.clone().into_json().ok())
        .and_then(|v| serde_json::from_value::<PublicCode>(v).ok())
        .filter(|c| {
            matches!(
                c,
                PublicCode::InvalidRequest
                    | PublicCode::NotFound
                    | PublicCode::RateLimited
                    | PublicCode::Unauthenticated
                    | PublicCode::Internal
                    | PublicCode::Unavailable
                    | PublicCode::UpstreamFailure
                    | PublicCode::UpstreamTimeout
            )
        })
        .unwrap_or(fallback);
    let mut public = PublicError::new(
        code,
        telemetry::current_correlation()
            .unwrap_or_default()
            .request_id,
    );
    if code == PublicCode::InvalidRequest {
        public.field_errors = error
            .extensions
            .as_ref()
            .and_then(|e| e.get("fieldErrors"))
            .and_then(|v| v.clone().into_json().ok())
            .and_then(|v| serde_json::from_value(v).ok());
    }
    if code == PublicCode::RateLimited {
        public.retry_after_seconds = error
            .extensions
            .as_ref()
            .and_then(|e| e.get("retryAfterSeconds"))
            .and_then(|v| v.clone().into_json().ok())
            .and_then(|v| v.as_u64())
            .and_then(|v| u32::try_from(v).ok());
    }
    let mut safe = graphql_common::public_error(public);
    // Only adapters construct the resource projection; reconstruct the exact permitted keys.
    if code == PublicCode::NotFound
        && let Some(async_graphql::Value::List(resources)) =
            error.extensions.as_ref().and_then(|e| e.get("resources"))
    {
        let resources: Vec<_> = resources
            .iter()
            .filter_map(|r| {
                if let async_graphql::Value::Object(fields) = r {
                    let kind = fields.get("kind")?;
                    let id = fields.get("id")?;
                    if let (async_graphql::Value::String(kind), async_graphql::Value::String(id)) =
                        (kind, id)
                        && matches!(
                            kind.as_str(),
                            "COLLECTION"
                                | "ITEM"
                                | "AUTHOR"
                                | "TAG"
                                | "NOVEL"
                                | "CHAPTER"
                                | "COMMENT"
                        )
                        && id.parse::<i64>().is_ok_and(|v| v > 0)
                    {
                        return Some(async_graphql::value!({"kind":kind,"id":id}));
                    }
                }
                None
            })
            .collect();
        if !resources.is_empty() {
            safe.extensions
                .as_mut()
                .unwrap()
                .set("resources", resources);
        }
    }
    error.message = safe.message;
    error.extensions = safe.extensions;
    // Original typed cause remains internal, never serialized by async-graphql.
}
struct Completion {
    span: tracing::Span,
    started: Instant,
    done: bool,
}
impl Drop for Completion {
    fn drop(&mut self) {
        if !self.done {
            self.span.in_scope(||tracing::warn!(target:"telemetry",event="graphql.interrupted",stage="execution",duration_ms=self.started.elapsed().as_millis() as u64));
        }
    }
}
#[async_trait::async_trait]
impl Extension for TracingExtension {
    async fn prepare_request(
        &self,
        ctx: &ExtensionContext<'_>,
        request: Request,
        next: NextPrepareRequest<'_>,
    ) -> ServerResult<Request> {
        if let Ok(mut metadata) = self.metadata.lock() {
            metadata.operation_name = safe_operation_name(request.operation_name.as_deref());
            metadata.requested = request.operation_name.clone();
        }
        next.run(ctx, request.data(self.state.clone())).await
    }
    async fn request(&self, ctx: &ExtensionContext<'_>, next: NextRequest<'_>) -> Response {
        let span = tracing::info_span!(target:"telemetry","graphql",otel.kind="internal");
        let mut completion = Completion {
            span: span.clone(),
            started: Instant::now(),
            done: false,
        };
        let mut response = next.run(ctx).instrument(span.clone()).await;
        span.in_scope(|| {
   for error in &mut response.errors {sanitize(error,PublicCode::Internal);}
   let outcome=if !response.errors.is_empty(){if matches!(&response.data,async_graphql::Value::Object(fields) if fields.values().any(|v| !matches!(v,async_graphql::Value::Null))) {"partial"} else {"fault"}}else if self.state.rejected(){"rejected"}else{"success"};
   let (operation_name,operation_type)=self.metadata.lock().map(|m|(m.operation_name,m.operation_type)).unwrap_or(("other","other"));
   tracing::info!(target:"telemetry",event="graphql.completed",operation_name,operation_type,outcome,error_count=response.errors.len() as u64,duration_ms=completion.started.elapsed().as_millis() as u64);
  });
        completion.done = true;
        response
    }
    async fn parse_query(
        &self,
        ctx: &ExtensionContext<'_>,
        query: &str,
        variables: &Variables,
        next: NextParseQuery<'_>,
    ) -> ServerResult<ExecutableDocument> {
        let document = next.run(ctx, query, variables).await.map_err(|mut e| {
            sanitize(&mut e, PublicCode::InvalidRequest);
            e
        })?;
        if let Ok(mut metadata) = self.metadata.lock() {
            let operation = if let Some(requested) = &metadata.requested {
                document
                    .operations
                    .iter()
                    .find(|(name, _)| name.is_some_and(|name| name.as_str() == requested))
            } else if document.operations.iter().len() == 1 {
                document.operations.iter().next()
            } else {
                None
            };
            if let Some((name, operation)) = operation {
                metadata.operation_name = safe_operation_name(name.map(|n| n.as_str()));
                metadata.operation_type = match operation.node.ty {
                    async_graphql::parser::types::OperationType::Query => "query",
                    async_graphql::parser::types::OperationType::Mutation => "mutation",
                    async_graphql::parser::types::OperationType::Subscription => "subscription",
                };
            }
        }
        Ok(document)
    }
    async fn validation(
        &self,
        ctx: &ExtensionContext<'_>,
        next: NextValidation<'_>,
    ) -> Result<ValidationResult, Vec<ServerError>> {
        next.run(ctx).await.map_err(|mut errors| {
            for e in &mut errors {
                sanitize(e, PublicCode::InvalidRequest);
            }
            errors
        })
    }
}

fn safe_operation_name(name: Option<&str>) -> &'static str {
    match name {
        None => "anonymous",
        Some("CreateComment") => "CreateComment",
        Some("ReadBookmarkAuthorState") => "ReadBookmarkAuthorState",
        Some("ReadBookmarkCollectionState") => "ReadBookmarkCollectionState",
        Some("ReadBookmarkNovelState") => "ReadBookmarkNovelState",
        Some("ReadBookmarkTagsState") => "ReadBookmarkTagsState",
        Some("ReadCollectionState") => "ReadCollectionState",
        Some("ReadItemState") => "ReadItemState",
        Some("UpdateComment") => "UpdateComment",
        Some("addCollectionForItem") => "addCollectionForItem",
        Some("addCollectionForNovel") => "addCollectionForNovel",
        Some("addReadRecord") => "addReadRecord",
        Some("allCollections") => "allCollections",
        Some("allTags") => "allTags",
        Some("collectionAndItems") => "collectionAndItems",
        Some("createAuthor") => "createAuthor",
        Some("createCollection") => "createCollection",
        Some("createItem") => "createItem",
        Some("createNovel") => "createNovel",
        Some("createTag") => "createTag",
        Some("deleteAuthor") => "deleteAuthor",
        Some("deleteCollection") => "deleteCollection",
        Some("deleteCollectionForItem") => "deleteCollectionForItem",
        Some("deleteCollectionForNovel") => "deleteCollectionForNovel",
        Some("deleteCommentForNovel") => "deleteCommentForNovel",
        Some("deleteItem") => "deleteItem",
        Some("deleteNovel") => "deleteNovel",
        Some("deleteReadRecord") => "deleteReadRecord",
        Some("deleteTag") => "deleteTag",
        Some("fetchAuthor") => "fetchAuthor",
        Some("fetchNovel") => "fetchNovel",
        Some("getAuthor") => "getAuthor",
        Some("getAuthors") => "getAuthors",
        Some("getCollectionAncestors") => "getCollectionAncestors",
        Some("getCollections") => "getCollections",
        Some("getEditItem") => "getEditItem",
        Some("getItem") => "getItem",
        Some("getItems") => "getItems",
        Some("getNovel") => "getNovel",
        Some("getNovels") => "getNovels",
        Some("getTags") => "getTags",
        Some("saveDraftAuthor") => "saveDraftAuthor",
        Some("saveDraftNovel") => "saveDraftNovel",
        Some("searchAuthor") => "searchAuthor",
        Some("updateAuthorByCrawler") => "updateAuthorByCrawler",
        Some("updateCollection") => "updateCollection",
        Some("updateItem") => "updateItem",
        Some("updateNovelByCrawler") => "updateNovelByCrawler",
        _ => "other",
    }
}
