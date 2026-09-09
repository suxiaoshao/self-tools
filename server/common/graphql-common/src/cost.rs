//! Request-shape limits. List weights are cost estimates, not result truncation.
use async_graphql::{
    Request, ServerResult, Variables, async_trait,
    extensions::{
        Extension, ExtensionContext, ExtensionFactory, NextParseQuery, NextPrepareRequest,
    },
    parser::types::{ExecutableDocument, OperationType, Selection, SelectionSet},
};
use std::{
    collections::HashSet,
    sync::{Arc, Mutex},
};

pub const MAX_DEPTH: usize = 8;
// Standard schema discovery follows __Type.ofType chains beyond the business limit.
// Keep introspection bounded too; the framework uses this as its global ceiling.
pub const MAX_INTROSPECTION_DEPTH: usize = 16;
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
    ShapeBudget {
        doc,
        introspection_allowed: operation.node.ty == OperationType::Query,
        fields: 0,
        roots: 0,
        path: HashSet::new(),
    }
    .visit(&operation.node.selection_set.node, 0, MAX_DEPTH)
}

struct ShapeBudget<'a> {
    doc: &'a ExecutableDocument,
    introspection_allowed: bool,
    fields: usize,
    roots: usize,
    path: HashSet<String>,
}

impl ShapeBudget<'_> {
    fn visit(&mut self, set: &SelectionSet, depth: usize, max_depth: usize) -> bool {
        for selection in &set.items {
            match &selection.node {
                Selection::Field(field) => {
                    self.fields += 1;
                    if depth == 0 {
                        self.roots += 1;
                    }
                    // Only the actual query root field changes its own subtree's
                    // depth budget. Aliases, operation names and sibling roots do not.
                    let max_depth = if depth == 0
                        && self.introspection_allowed
                        && matches!(field.node.name.node.as_str(), "__schema" | "__type")
                    {
                        MAX_INTROSPECTION_DEPTH
                    } else {
                        max_depth
                    };
                    if self.fields > MAX_FIELDS || self.roots > MAX_ROOTS || depth >= max_depth {
                        return false;
                    }
                    if !self.visit(&field.node.selection_set.node, depth + 1, max_depth) {
                        return false;
                    }
                }
                Selection::InlineFragment(fragment) => {
                    if !self.visit(&fragment.node.selection_set.node, depth, max_depth) {
                        return false;
                    }
                }
                Selection::FragmentSpread(spread) => {
                    let name = spread.node.fragment_name.node.to_string();
                    if !self.path.insert(name.clone()) {
                        return false;
                    }
                    let Some(fragment) = self.doc.fragments.get(name.as_str()) else {
                        return false;
                    };
                    if !self.visit(&fragment.node.selection_set.node, depth, max_depth) {
                        return false;
                    }
                    self.path.remove(&name);
                }
            }
        }
        true
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_graphql::parser::parse_query;

    fn allowed(query: &str) -> bool {
        within_shape(&parse_query(query).unwrap(), None)
    }

    fn chain(root: &str, child: &str, depth: usize) -> String {
        format!(
            "{root} {{ {}name {} }}",
            format!("{child} {{ ").repeat(depth - 2),
            "}".repeat(depth - 2)
        )
    }

    #[test]
    fn depth_policy_follows_actual_query_roots_through_fragments() {
        let business = chain("allCollections", "ancestors", MAX_DEPTH);
        let too_deep = chain("allCollections", "ancestors", MAX_DEPTH + 1);
        let introspection = chain(
            "metadata: __type(name: \"QueryRoot\")",
            "ofType",
            MAX_INTROSPECTION_DEPTH,
        );
        assert!(allowed(&format!("{{ {business} }}")));
        assert!(allowed(&format!(
            "query SchemaDocs {{ ...Root }} fragment Root on QueryRoot {{ ... on QueryRoot {{ {introspection} {business} }} }}"
        )));
        // Neither the operation name, alias nor an introspection sibling can
        // raise the depth limit for a business subtree, in either root order.
        for selections in [
            too_deep.clone(),
            format!("__schema: {too_deep}"),
            format!("{introspection} {too_deep}"),
            format!("{too_deep} {introspection}"),
        ] {
            assert!(!allowed(&format!(
                "query IntrospectionQuery {{ ...Root }} fragment Root on QueryRoot {{ {selections} }}"
            )));
        }
        assert!(!allowed(&format!("mutation {{ {introspection} }}")));
        assert!(!allowed(&format!(
            "{{ {} }}",
            chain(
                "__type(name: \"QueryRoot\")",
                "ofType",
                MAX_INTROSPECTION_DEPTH + 1
            )
        )));
    }

    #[test]
    fn introspection_shares_shape_budgets_and_fragment_cycle_protection() {
        let introspection = include_str!("../test-support/introspection.graphql");
        assert!(allowed(introspection));
        let roots = (0..MAX_ROOTS)
            .map(|i| format!("a{i}:__type(name:\"QueryRoot\"){{name}}"))
            .collect::<String>();
        assert!(allowed(&format!("{{{roots}}}")));
        assert!(!allowed(&format!("{{{roots} allCollections{{id}}}}")));
        let fields = (0..MAX_FIELDS - 1)
            .map(|i| format!("a{i}:name "))
            .collect::<String>();
        assert!(allowed(&format!(
            "{{__type(name:\"QueryRoot\"){{{fields}}}}}"
        )));
        assert!(!allowed(&format!(
            "{{__type(name:\"QueryRoot\"){{{fields}}} allCollections{{id}}}}"
        )));
        assert!(!allowed(
            "{__type(name:\"QueryRoot\"){...Type}} fragment Type on __Type {ofType{...Type}}"
        ));
    }
}
