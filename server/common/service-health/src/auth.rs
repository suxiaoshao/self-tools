use std::{net::SocketAddr, time::Duration};

pub async fn auth_ready() -> bool {
    let client = tokio::time::timeout(
        Duration::from_secs(1),
        tokio::task::spawn_blocking(thrift::get_client),
    )
    .await;
    match client {
        Ok(Ok(Ok(client))) => matches!(
            tokio::time::timeout(Duration::from_secs(3), client.ready()).await,
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
        tokio::time::timeout(Duration::from_secs(4), client.ready()).await,
        Ok(Ok(true))
    )
}
