//! Uses the production gateway context, HTTP/GraphQL middleware and real Thrift client/server.
#[path = "../../../gateway/src/trace.rs"]
mod gateway_trace;
use super::*;
use axum::{
    body::{Body, to_bytes},
    http::{Request, Response},
    response::IntoResponse,
};
use opentelemetry_sdk::trace::{InMemorySpanExporter, SdkTracerProvider};
use telemetry::{
    OpenTelemetrySpanExt,
    opentelemetry::trace::{TraceContextExt, TracerProvider},
};
use tower::{Layer, ServiceExt, service_fn};
use tracing_subscriber::prelude::*;

struct Query(Arc<std::sync::atomic::AtomicUsize>);
#[async_graphql::Object]
impl Query {
    async fn value(&self) -> i32 {
        self.0.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        7
    }
    async fn broken(&self) -> async_graphql::Result<Option<i32>> {
        Err(graphql_common::fault_error(Fault::new(
            FaultKind::Database,
            "test_query",
            std::io::Error::other("private-db-secret"),
        )))
    }
}
#[derive(Clone, Default)]
struct Events(Arc<Mutex<Vec<(String, String, String)>>>);
impl<S: tracing::Subscriber> tracing_subscriber::Layer<S> for Events {
    fn on_event(&self, event: &tracing::Event<'_>, _: tracing_subscriber::layer::Context<'_, S>) {
        if event.metadata().target() != "telemetry" {
            return;
        }
        #[derive(Default)]
        struct Fields {
            event: String,
            outcome: String,
        }
        impl tracing::field::Visit for Fields {
            fn record_str(&mut self, field: &tracing::field::Field, value: &str) {
                match field.name() {
                    "event" => self.event = value.into(),
                    "outcome" => self.outcome = value.into(),
                    _ => {}
                }
            }
            fn record_debug(&mut self, _: &tracing::field::Field, _: &dyn std::fmt::Debug) {}
        }
        let mut fields = Fields::default();
        event.record(&mut fields);
        let correlation = telemetry::current_correlation()
            .map(|c| c.request_id)
            .unwrap_or_default();
        self.0
            .lock()
            .unwrap()
            .push((fields.event, fields.outcome, correlation));
    }
}
#[tokio::test(flavor = "multi_thread", worker_threads = 2)]
#[ignore = "requires migrated dedicated AUTH_TEST_PG and loopback RPC listener; run in isolation"]
async fn gateway_http_graphql_and_real_auth_rpc_share_trace() {
    let exporter = InMemorySpanExporter::default();
    let provider = SdkTracerProvider::builder()
        .with_simple_exporter(exporter.clone())
        .build();
    let events = Events::default();
    tracing_subscriber::registry()
        .with(
            tracing_opentelemetry::layer()
                .with_tracer(provider.tracer("integration"))
                .with_filter(tracing_subscriber::filter::filter_fn(|m| {
                    m.is_span() && m.target() == "telemetry"
                })),
        )
        .with(events.clone())
        .try_init()
        .unwrap();
    let pool = DbPool::builder()
        .build(ConnectionManager::<PgConnection>::new(
            std::env::var("AUTH_TEST_PG").expect("dedicated AUTH_TEST_PG"),
        ))
        .unwrap();
    let application = super::tests::app(pool, "trace-test-password");
    let login = application
        .run(|app, db| {
            app.login_password(
                db,
                &Context {
                    session_token: None,
                },
                "test-admin",
                "trace-test-password",
            )
        })
        .await
        .unwrap();
    let token = login.session_token;
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    let server_app = application.clone();
    let server = tokio::spawn(async move {
        thrift::auth::AuthServiceServer::new(crate::service::AuthImpl(server_app))
            .run(volo::net::incoming::DefaultIncoming::from(listener))
            .await
            .unwrap();
    });
    let client = Arc::new(thrift::AuthEndpoint::new(
        addr.to_string(),
        service_health::budget::AUTH_DNS,
        service_health::budget::AUTH_RPC,
    ));
    assert!(client.ready().await);
    assert_eq!(
        client
            .authenticate("invalid-session".into())
            .await
            .unwrap_err()
            .code,
        service_errors::PublicCode::Unauthenticated
    );
    let unavailable = thrift::AuthEndpoint::new(
        "invalid address".into(),
        service_health::budget::AUTH_DNS,
        service_health::budget::AUTH_RPC,
    );
    assert!(!unavailable.ready().await);
    assert_eq!(
        unavailable
            .authenticate("private-token".into())
            .await
            .unwrap_err()
            .code,
        service_errors::PublicCode::Unavailable
    );
    let resolutions = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let schema = async_graphql::Schema::build(
        Query(resolutions.clone()),
        async_graphql::EmptyMutation,
        async_graphql::EmptySubscription,
    )
    .extension(middleware::Logger)
    .extension(graphql_common::cost::RequestLimits)
    .limit_depth(graphql_common::cost::MAX_DEPTH)
    .limit_complexity(graphql_common::cost::MAX_COMPLEXITY)
    .finish();
    let mut ids = Vec::new();
    let mut traces = Vec::new();
    for (fault, denied) in [(false, false), (false, true), (true, false)] {
        resolutions.store(0, std::sync::atomic::Ordering::SeqCst);
        if fault {
            application.slots.close();
        }
        let mut gateway = gateway_trace::RequestTrace::new();
        gateway.method = gateway_trace::method("POST");
        gateway.route = "/api/bookmarks/graphql";
        gateway.start_upstream();
        let fields = gateway.outgoing();
        let trace_id = gateway.server.context().span().span_context().trace_id();
        let server_id = gateway.server.context().span().span_context().span_id();
        let request_id = fields.request_id.clone();
        ids.push(request_id.clone());
        traces.push((trace_id, server_id));
        let client = client.clone();
        let token = token.clone();
        let schema = schema.clone();
        let service = middleware::trace_layer().layer(service_fn(move |_: Request<Body>| {
            let client = client.clone();
            let token = token.clone();
            let schema = schema.clone();
            async move {
                let response = match client.authenticate(token).await {
                    Ok(_) => axum::Json(
                        schema
                            .execute(if denied {
                                format!(
                                    "{{{}}}",
                                    (0..21).map(|i| format!("a{i}:value ")).collect::<String>()
                                )
                            } else {
                                "query getNovel { value other:value broken }".into()
                            })
                            .await,
                    )
                    .into_response(),
                    Err(error) => middleware::HttpError(error).into_response(),
                };
                Ok::<Response<Body>, std::convert::Infallible>(response)
            }
        }));
        let response = service
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri("/api/bookmarks/graphql?secret=private")
                    .header("traceparent", fields.traceparent)
                    .header("x-request-id", request_id.clone())
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        let status = response.status().as_u16();
        assert_eq!(response.headers()["x-request-id"], request_id);
        assert!(!response.headers().contains_key("traceparent"));
        let body = to_bytes(Body::new(response.into_body()), 4096)
            .await
            .unwrap();
        let json: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert!(!String::from_utf8_lossy(&body).contains("private"));
        if fault {
            assert_eq!(status, 500);
            assert_eq!(json["error"]["requestId"], request_id);
        } else if denied {
            assert_eq!(status, 200);
            assert_eq!(json["errors"][0]["extensions"]["code"], "INVALID_REQUEST");
            assert_eq!(resolutions.load(std::sync::atomic::Ordering::SeqCst), 0);
        } else {
            assert_eq!(json["data"]["other"], 7);
            assert_eq!(resolutions.load(std::sync::atomic::Ordering::SeqCst), 2);
            assert_eq!(json["data"]["value"], 7);
            assert_eq!(json["errors"][0]["extensions"]["requestId"], request_id);
        }
        gateway.upstream_status = Some(status);
        gateway.upstream_eof = true;
        gateway.finish(Some(status), true, true);
        drop(gateway);
    }
    provider.force_flush().unwrap();
    let spans = exporter.get_finished_spans().unwrap();
    for (index, (trace_id, gateway_id)) in traces.iter().enumerate() {
        let spans: Vec<_> = spans
            .iter()
            .filter(|s| s.span_context.trace_id() == *trace_id)
            .collect();
        let gateway_client = spans.iter().find(|s| s.name == "http.client").unwrap();
        assert_eq!(gateway_client.parent_span_id, *gateway_id);
        let http = spans
            .iter()
            .find(|s| {
                s.name == "http.server" && s.parent_span_id == gateway_client.span_context.span_id()
            })
            .unwrap();
        assert_eq!(
            spans.iter().filter(|s| s.name == "auth.rpc.client").count(),
            1
        );
        assert_eq!(
            spans.iter().filter(|s| s.name == "auth.rpc.server").count(),
            1
        );
        let rpc_client = spans.iter().find(|s| s.name == "auth.rpc.client").unwrap();
        assert_eq!(rpc_client.parent_span_id, http.span_context.span_id());
        let rpc_server = spans.iter().find(|s| s.name == "auth.rpc.server").unwrap();
        assert_eq!(rpc_server.parent_span_id, rpc_client.span_context.span_id());
        if index < 2 {
            let graphql = spans.iter().find(|s| s.name == "graphql").unwrap();
            assert_eq!(graphql.parent_span_id, http.span_context.span_id());
        }
        assert_eq!(spans.len(), if index < 2 { 6 } else { 5 });
    }
    let records = events.0.lock().unwrap();
    assert!(
        records
            .iter()
            .any(|(event, outcome, id)| event == "graphql.completed"
                && outcome == "partial"
                && id == &ids[0])
    );
    assert_eq!(
        records
            .iter()
            .filter(|(event, outcome, id)| event == "rpc.completed"
                && outcome == "fault"
                && id == &ids[2])
            .count(),
        2
    );
    drop(records);
    drop(client);
    server.abort();
    let _ = server.await;
    provider.shutdown().unwrap();
}
