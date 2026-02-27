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

#[derive(Debug, thiserror::Error, serde::Serialize, Clone)]
pub enum ClientError {
    #[error("auth ip not find")]
    NotFindIp,
    #[error("auth ip parse error:{}",.0)]
    LookupError(String),
}

pub fn get_client() -> Result<self::auth::ItemServiceClient, ClientError> {
    let addr: SocketAddr = get_ip()?;
    Ok(auth::ItemServiceClientBuilder::new("auth")
        .address(addr)
        .build())
}

fn get_ip() -> Result<SocketAddr, ClientError> {
    let hostname = "auth";
    let mut ips = lookup_host(hostname).map_err(|e| ClientError::LookupError(e.to_string()))?;
    let ip = ips.next().ok_or(ClientError::NotFindIp)?;
    Ok(SocketAddr::new(ip, 80))
}
