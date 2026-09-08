/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-16 23:36:58
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-22 23:56:45
 * @FilePath: /self-tools/server/common/thrift/src/lib.rs
 */
mod gen_thrift {
    include!(concat!(env!("OUT_DIR"), "/volo_gen.rs"));
}

use std::net::SocketAddr;

use dns_lookup::lookup_host;
pub use gen_thrift::volo_gen::*;

mod client;
pub use client::{AuthClient, RpcError, context};

pub fn get_client() -> Result<AuthClient, service_errors::Fault> {
    Ok(client_at(get_ip()?))
}
/// Build the same bounded, non-replaying client for an explicitly owned internal address.
pub fn client_at(addr: SocketAddr) -> AuthClient {
    AuthClient(
        auth::AuthServiceClientBuilder::new("auth")
            .address(addr)
            .retry_count(0)
            .rpc_timeout(None)
            .build(),
    )
}
fn get_ip() -> Result<SocketAddr, service_errors::Fault> {
    let mut ips = lookup_host("auth").map_err(|source| {
        service_errors::Fault::new(service_errors::FaultKind::Network, "auth_dns", source)
    })?;
    let ip = ips.next().ok_or_else(|| {
        service_errors::Fault::new(service_errors::FaultKind::Network, "auth_dns", NoAddress)
    })?;
    Ok(SocketAddr::new(ip, 80))
}
#[derive(Debug, thiserror::Error)]
#[error("authentication service address unavailable")]
struct NoAddress;
