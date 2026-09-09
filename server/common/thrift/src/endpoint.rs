//! An owned endpoint for transport adapters; resolves each call so container replacement is safe.
use crate::{AuthClient, client_at, context};
use service_errors::{Fault, FaultKind, PublicError};
use std::time::Duration;

#[derive(Clone)]
pub struct AuthEndpoint {
    address: String,
    dns_timeout: Duration,
    ready_timeout: Duration,
}
impl AuthEndpoint {
    pub fn new(address: String, dns_timeout: Duration, ready_timeout: Duration) -> Self {
        Self {
            address,
            dns_timeout,
            ready_timeout,
        }
    }
    async fn client(&self) -> Result<AuthClient, Fault> {
        let addresses =
            tokio::time::timeout(self.dns_timeout, tokio::net::lookup_host(&self.address))
                .await
                .map_err(|e| Fault::new(FaultKind::Timeout, "auth_dns", e))?
                .map_err(|e| Fault::new(FaultKind::Network, "auth_dns", e))?;
        let address = addresses
            .into_iter()
            .next()
            .ok_or_else(|| Fault::internal("auth_dns_empty"))?;
        Ok(client_at(address))
    }
    pub async fn authenticate(&self, token: String) -> Result<(), PublicError> {
        let client = self
            .client()
            .await
            .map_err(|e| crate::RpcError::Local(e).public_error())?;
        client
            .check(context(Some(token)))
            .await
            .map(|_| ())
            .map_err(crate::RpcError::public_error)
    }
    pub async fn ready(&self) -> bool {
        let Ok(client) = self.client().await else {
            return false;
        };
        matches!(
            tokio::time::timeout(self.ready_timeout, client.ready()).await,
            Ok(Ok(true))
        )
    }
}
