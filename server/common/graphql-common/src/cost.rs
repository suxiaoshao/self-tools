//! Request-shape limits. List weights are cost estimates, not result truncation.
use async_graphql::{
    Request, ServerResult, Variables, async_trait,
    extensions::{
        Extension, ExtensionContext, ExtensionFactory, NextParseQuery, NextPrepareRequest,
    },
    parser::types::{ExecutableDocument, Selection, SelectionSet},
};
use std::{
    collections::HashSet,
    sync::{Arc, Mutex},
};

pub const MAX_DEPTH: usize = 8;
pub const MAX_COMPLEXITY: usize = 200_000;
const MAX_FIELDS: usize = 256;
const MAX_ROOTS: usize = 20;

pub fn list_cost(child: usize) -> usize {
    page_cost(100, child)
}
pub fn page_cost(size: i64, child: usize) -> usize {
    1usize
        .saturating_add((size.clamp(5, 100) as usize).saturating_mul(child))
        .min(MAX_COMPLEXITY + 1)
}
pub fn fetch_cost(child: usize) -> usize {
    child.saturating_add(1_001).min(MAX_COMPLEXITY + 1)
}

pub struct RequestLimits;
impl ExtensionFactory for RequestLimits {
    fn create(&self) -> Arc<dyn Extension> {
        Arc::new(Limits {
            operation: Mutex::new(None),
        })
    }
}
struct Limits {
    operation: Mutex<Option<String>>,
}
#[async_trait::async_trait]
impl Extension for Limits {
    async fn prepare_request(
        &self,
        ctx: &ExtensionContext<'_>,
        request: Request,
        next: NextPrepareRequest<'_>,
    ) -> ServerResult<Request> {
        *self.operation.lock().unwrap() = request.operation_name.clone();
        next.run(ctx, request).await
    }
    async fn parse_query(
        &self,
        ctx: &ExtensionContext<'_>,
        query: &str,
        variables: &Variables,
        next: NextParseQuery<'_>,
    ) -> ServerResult<ExecutableDocument> {
        let doc = next.run(ctx, query, variables).await?;
        let name = self.operation.lock().unwrap().clone();
        if !within_shape(&doc, name.as_deref()) {
            return Err(
                crate::code_error(service_errors::PublicCode::InvalidRequest)
                    .into_server_error(Default::default()),
            );
        }
        Ok(doc)
    }
}
fn within_shape(doc: &ExecutableDocument, name: Option<&str>) -> bool {
    // Guard expansion before framework complexity traversal. Never materialize expanded fragments.
    let operation = if let Some(name) = name {
        doc.operations
            .iter()
            .find(|(n, _)| n.is_some_and(|n| n.as_str() == name))
    } else if doc.operations.iter().len() == 1 {
        doc.operations.iter().next()
    } else {
        None
    };
    let Some((_, operation)) = operation else {
        return false;
    };
    let mut fields = 0;
    let mut roots = 0;
    fn visit(
        doc: &ExecutableDocument,
        set: &SelectionSet,
        depth: usize,
        fields: &mut usize,
        roots: &mut usize,
        path: &mut HashSet<String>,
    ) -> bool {
        for selection in &set.items {
            match &selection.node {
                Selection::Field(field) => {
                    *fields += 1;
                    if depth == 0 {
                        *roots += 1;
                    }
                    if *fields > MAX_FIELDS || *roots > MAX_ROOTS || depth >= MAX_DEPTH {
                        return false;
                    }
                    if !visit(
                        doc,
                        &field.node.selection_set.node,
                        depth + 1,
                        fields,
                        roots,
                        path,
                    ) {
                        return false;
                    }
                }
                Selection::InlineFragment(fragment) => {
                    if !visit(
                        doc,
                        &fragment.node.selection_set.node,
                        depth,
                        fields,
                        roots,
                        path,
                    ) {
                        return false;
                    }
                }
                Selection::FragmentSpread(spread) => {
                    let name = spread.node.fragment_name.node.to_string();
                    if !path.insert(name.clone()) {
                        return false;
                    }
                    let Some(fragment) = doc.fragments.get(name.as_str()) else {
                        return false;
                    };
                    if !visit(
                        doc,
                        &fragment.node.selection_set.node,
                        depth,
                        fields,
                        roots,
                        path,
                    ) {
                        return false;
                    }
                    path.remove(&name);
                }
            }
        }
        true
    }
    visit(
        doc,
        &operation.node.selection_set.node,
        0,
        &mut fields,
        &mut roots,
        &mut HashSet::new(),
    )
}
