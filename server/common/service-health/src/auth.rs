use crate::budget;
use std::net::SocketAddr;

pub async fn auth_ready() -> bool {
    let client = tokio::time::timeout(
        budget::AUTH_DNS,
        tokio::task::spawn_blocking(thrift::get_client),
    )
    .await;
    match client {
        Ok(Ok(Ok(client))) => matches!(
            tokio::time::timeout(budget::AUTH_RPC, client.ready()).await,
            Ok(Ok(true))
        ),
        _ => false,
    }
}

pub async fn local_auth_ready() -> bool {
    let client = thrift::auth::AuthServiceClientBuilder::new("auth-health")
        .address(SocketAddr::from(([127, 0, 0, 1], 80)))
        .build();
    matches!(
        tokio::time::timeout(budget::AUTH_RPC, client.ready()).await,
        Ok(Ok(true))
    )
}
