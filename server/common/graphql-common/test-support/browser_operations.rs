// Included by the two service test modules; validates the real hand-written operations
// against their production schema/limits without a database, auth, or crawler execution.
use async_graphql::{
    async_trait,
    extensions::*,
    registry::{MetaType, Registry},
    *,
};
use std::{path::Path, sync::Arc};
struct ValidateOnly;
impl ExtensionFactory for ValidateOnly {
    fn create(&self) -> Arc<dyn Extension> {
        Arc::new(Self)
    }
}
fn sample(ty: &str, registry: &Registry) -> Value {
    let ty = ty.trim_end_matches('!');
    if ty.starts_with('[') {
        return Value::List(vec![sample(&ty[1..ty.len() - 1], registry)]);
    }
    if ty == "Pagination" {
        return value!({"page":1,"pageSize":100});
    }
    match registry.types.get(ty).unwrap() {
        MetaType::InputObject { input_fields, .. } => Value::Object(
            input_fields
                .iter()
                .filter(|(_, f)| f.ty.ends_with('!'))
                .map(|(n, f)| (Name::new(n), sample(&f.ty, registry)))
                .collect(),
        ),
        MetaType::Enum { enum_values, .. } => {
            Value::Enum(Name::new(enum_values.keys().next().unwrap()))
        }
        _ => match ty {
            "Int" => Value::from(1),
            "Boolean" => Value::Boolean(true),
            "Float" => Value::from(1.0),
            "DateTime" => Value::from("2026-09-09T00:00:00Z"),
            _ => Value::from("fixture"),
        },
    }
}
#[async_trait::async_trait]
impl Extension for ValidateOnly {
    async fn prepare_request(
        &self,
        ctx: &ExtensionContext<'_>,
        mut request: Request,
        next: NextPrepareRequest<'_>,
    ) -> ServerResult<Request> {
        let doc = request.parsed_query()?.clone();
        for (_, op) in doc.operations.iter() {
            for var in &op.node.variable_definitions {
                if !var.node.var_type.node.nullable {
                    request.variables.insert(
                        var.node.name.node.clone(),
                        sample(
                            &var.node.var_type.node.to_string(),
                            &ctx.schema_env.registry,
                        ),
                    );
                }
            }
        }
        next.run(ctx, request).await
    }
    async fn execute(
        &self,
        _: &ExtensionContext<'_>,
        _: Option<&str>,
        _: NextExecute<'_>,
    ) -> Response {
        Response::new(value!({"validated":true}))
    }
}
fn operations(dir: &Path, out: &mut Vec<String>) {
    for entry in std::fs::read_dir(dir).unwrap() {
        let path = entry.unwrap().path();
        if path.is_dir() {
            if path.file_name().unwrap() != "gql" {
                operations(&path, out);
            }
        } else if path.extension().is_some_and(|e| e == "ts" || e == "tsx")
            && !path.to_string_lossy().contains(".test.")
        {
            let source = std::fs::read_to_string(path).unwrap();
            for segment in source.split("graphql(`").skip(1) {
                out.push(segment.split("`)").next().unwrap().into());
            }
        }
    }
}
#[tokio::test]
async fn handwritten_browser_operations_fit_production_schema_and_limits() {
    let schema = crate::graphql::schema_builder()
        .extension(ValidateOnly)
        .finish();
    let dir = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../../web/packages")
        .join(env!("CARGO_PKG_NAME"))
        .join("src");
    let mut queries = vec![];
    operations(&dir, &mut queries);
    assert!(queries.len() > 10);
    for query in queries {
        let response = schema.execute(&query).await;
        assert!(response.errors.is_empty(), "{query}: {:?}", response.errors);
        assert_eq!(response.data, value!({"validated":true}));
    }
}
#[tokio::test]
async fn oversized_operations_stop_before_execution_with_safe_errors() {
    let schema = crate::graphql::schema_builder()
        .extension(ValidateOnly)
        .finish();
    let wide = format!(
        "{{{}}}",
        (0..21)
            .map(|i| format!("a{i}:allCollections{{id}}"))
            .collect::<String>()
    );
    let fragments = "query { ...A } fragment A on QueryRoot { ...B ...B ...B ...B ...B ...B ...B ...B } fragment B on QueryRoot { ...C ...C ...C ...C ...C ...C ...C ...C } fragment C on QueryRoot { allCollections {id name path createTime updateTime} }";
    let recursive = "query { ...A } fragment A on QueryRoot { allCollections { id } ...A }";
    for query in [
        wide.as_str(),
        fragments,
        recursive,
        "{allCollections{ancestors{ancestors{id}}}}",
    ] {
        let response = schema.execute(query).await;
        assert_eq!(response.data, Value::Null);
        assert!(!response.errors.is_empty());
        for error in response.errors {
            assert_eq!(error.message, "INVALID_REQUEST");
            assert!(error.extensions.unwrap().get("requestId").is_some());
        }
    }
}
