use std::{fmt::Write, sync::Arc};

use async_graphql::{
    PathSegment, Response, ServerError, ServerResult, ValidationResult, Variables, async_trait,
    extensions::{
        Extension, ExtensionContext, ExtensionFactory, NextExecute, NextParseQuery, NextRequest,
        NextValidation,
    },
    parser::types::{ExecutableDocument, OperationType, Selection},
};
use tracing::{Instrument, Level, event};

pub struct Logger;

impl ExtensionFactory for Logger {
    fn create(&self) -> Arc<dyn Extension> {
        Arc::new(TracingExtension)
    }
}

struct TracingExtension;

#[async_trait::async_trait]
impl Extension for TracingExtension {
    async fn request(&self, ctx: &ExtensionContext<'_>, next: NextRequest<'_>) -> Response {
        let span = tracing::info_span!("graphql");
        next.run(ctx).instrument(span).await
    }
    async fn parse_query(
        &self,
        ctx: &ExtensionContext<'_>,
        query: &str,
        variables: &Variables,
        next: NextParseQuery<'_>,
    ) -> ServerResult<ExecutableDocument> {
        let document = next.run(ctx, query, variables).await?;
        let is_schema = document
            .operations
            .iter()
            .filter(|(_, operation)| operation.node.ty == OperationType::Query)
            .any(|(_, operation)| operation.node.selection_set.node.items.iter().any(|selection| matches!(&selection.node, Selection::Field(field) if field.node.name.node == "__schema")));
        if !is_schema {
            event!(
                Level::INFO,
                "execute:{}",
                ctx.stringify_execute_doc(&document, variables)
            );
        }
        Ok(document)
    }
    async fn validation(
        &self,
        ctx: &ExtensionContext<'_>,
        next: NextValidation<'_>,
    ) -> Result<ValidationResult, Vec<ServerError>> {
        let resp = next.run(ctx).await;
        if let Err(errors) = &resp {
            for err in errors {
                event!(Level::WARN, "validation error: {}", err.message);
            }
        }
        resp
    }

    async fn execute(
        &self,
        ctx: &ExtensionContext<'_>,
        operation_name: Option<&str>,
        next: NextExecute<'_>,
    ) -> Response {
        let resp = next.run(ctx, operation_name).await;
        if resp.is_err() {
            for err in &resp.errors {
                if !err.path.is_empty() {
                    let mut path = String::new();
                    for (idx, s) in err.path.iter().enumerate() {
                        if idx > 0 {
                            path.push('.');
                        }
                        match s {
                            PathSegment::Index(idx) => {
                                let _ = write!(&mut path, "{idx}");
                            }
                            PathSegment::Field(name) => {
                                let _ = write!(&mut path, "{name}");
                            }
                        }
                    }

                    event!(Level::WARN, "error: path={} message={}", path, err.message,);
                } else {
                    event!(Level::WARN, "error: message={}", err.message,);
                }
            }
        } else {
            let data = &resp.data;
            event!(Level::INFO, "response: {}", data);
        }
        resp
    }
}
