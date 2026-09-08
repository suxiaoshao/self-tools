//! Budgets follow the dependency graph; outer probes include transport margin.
use std::time::Duration;

pub const DATABASE: Duration = Duration::from_secs(5);
pub const AUTH_RPC: Duration = DATABASE.saturating_add(Duration::from_secs(1));
pub const AUTH_DNS: Duration = Duration::from_secs(1);
pub const AUTH: Duration = AUTH_DNS.saturating_add(AUTH_RPC);
pub const HTTP: Duration = AUTH.saturating_add(Duration::from_secs(2));
pub const GATEWAY_HTTP: Duration = HTTP.saturating_add(Duration::from_secs(2));
pub const TLS_CONNECT: Duration = Duration::from_secs(2);
pub const GATEWAY: Duration = GATEWAY_HTTP.saturating_add(TLS_CONNECT);
