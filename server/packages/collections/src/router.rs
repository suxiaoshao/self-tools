mod graphql;
use self::graphql::{graphql_handler, graphql_playground};
use crate::graphql::get_schema;
use axum::{
    Router,
    routing::{get, post},
};

pub(crate) fn get_router(
    application: std::sync::Arc<crate::application::Application>,
) -> anyhow::Result<Router> {
    let schema = get_schema(application.clone());
    let origin = middleware::auth_http::configured_origin()
        .map_err(|_| anyhow::anyhow!("invalid AUTH_ORIGIN"))?;
    let router = Router::new()
        .route(
            "/health/ready",
            get(move || {
                let application = application.clone();
                async move {
                    if application.ready().await {
                        axum::http::StatusCode::NO_CONTENT
                    } else {
                        axum::http::StatusCode::SERVICE_UNAVAILABLE
                    }
                }
            }),
        )
        .route(
            "/api/collections/graphql",
            post(graphql_handler).get(graphql_playground),
        )
        .with_state(schema)
        .layer(axum::Extension(origin));
    Ok(router)
}

pub(crate) use self::graphql::Auth;
