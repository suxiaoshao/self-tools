/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-16 23:36:58
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-22 23:56:45
 * @FilePath: /self-tools/server/common/thrift/src/lib.rs
 */
mod gen {
    include!(concat!(env!("OUT_DIR"), "/volo_gen.rs"));
}

use std::{net::SocketAddr, sync::LazyLock};

use dns_lookup::lookup_host;
pub use gen::volo_gen::*;

#[derive(Debug, thiserror::Error, serde::Serialize, Clone)]
pub enum ClientError {
    #[error("auth ip not find")]
    NotFindIp,
    #[error("auth ip parse error:{}",.0)]
    LookupError(String),
}

pub static CLIENT: LazyLock<Result<self::auth::ItemServiceClient, ClientError>> =
    LazyLock::new(|| {
        let addr: SocketAddr = get_ip()?;
        Ok(auth::ItemServiceClientBuilder::new("auth")
            .address(addr)
            .build())
    });

pub fn get_client() -> Result<&'static self::auth::ItemServiceClient, &'static ClientError> {
    match CLIENT.as_ref() {
        Ok(client) => Ok(client),
        Err(e) => Err(e),
    }
}

fn get_ip() -> Result<SocketAddr, ClientError> {
    let hostname = "auth";
    let ips: Vec<std::net::IpAddr> =
        lookup_host(hostname).map_err(|e| ClientError::LookupError(e.to_string()))?;
    let ip = ips.first().ok_or(ClientError::NotFindIp)?;
    Ok(SocketAddr::new(*ip, 80))
}
