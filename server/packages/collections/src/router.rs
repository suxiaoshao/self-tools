mod graphql;
use self::graphql::{graphql_handler, graphql_playground};
use crate::graphql::get_schema;
use axum::{
    Router,
    routing::{get, post},
};

pub(crate) fn get_router() -> anyhow::Result<Router> {
    let pool = crate::model::get_pool()
        .map_err(|_| anyhow::anyhow!("collections database unavailable"))?;
    service_health::database::check(
        &mut *pool
            .get()
            .map_err(|_| anyhow::anyhow!("database unavailable"))?,
        crate::MIGRATIONS,
    )?;
    let schema = get_schema(pool.clone());

    let router = Router::new()
        .route(
            "/health/ready",
            get(move || {
                let pool = pool.clone();
                async move {
                    let (database, auth) = tokio::join!(
                        service_health::database::ready(pool, crate::MIGRATIONS),
                        service_health::auth_ready()
                    );
                    if database && auth {
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
        .with_state(schema);
    Ok(router)
}

pub(crate) use self::graphql::Auth;
