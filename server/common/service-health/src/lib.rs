//! Shared, side-effect-free readiness and explicit schema administration.
use anyhow::{Context, Result, anyhow, bail};
use std::{net::SocketAddr, time::Duration};
use tokio::{
    io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader},
    net::TcpStream,
};
pub mod budget;

#[cfg(feature = "auth")]
mod auth;
#[cfg(feature = "database")]
pub mod database;
#[cfg(feature = "auth")]
pub use auth::{auth_ready, local_auth_ready};

pub enum Mode {
    Serve,
    CheckReady,
    Migrate,
    Help,
}
pub fn mode(allow_migrate: bool) -> Result<Mode> {
    let args: Vec<_> = std::env::args_os().skip(1).collect();
    match args.as_slice() {
        [] => Ok(Mode::Serve),
        [arg] if arg == "--check-ready" => Ok(Mode::CheckReady),
        [arg] if arg == "--migrate" && allow_migrate => Ok(Mode::Migrate),
        [arg] if arg == "--help" || arg == "-h" => Ok(Mode::Help),
        _ => bail!("unsupported arguments; use --help"),
    }
}
pub fn help(allow_migrate: bool) {
    println!(
        "No arguments: start service\n--check-ready: check the running local service (no writes)"
    );
    if allow_migrate {
        println!("--migrate: explicitly apply embedded database migrations, then exit");
    }
}

/// Covers DNS, connection, request, and response with one deadline. No redirects,
/// proxy environment, cookies, or response body are used by this internal probe.
pub async fn probe_http(address: &str) -> Result<()> {
    probe_http_with_budget(address, budget::HTTP).await
}

async fn probe_http_with_budget(address: &str, duration: Duration) -> Result<()> {
    tokio::time::timeout(duration, async {
        let mut stream = TcpStream::connect(address)
            .await
            .context("health connection unavailable")?;
        stream
            .write_all(
                b"GET /health/ready HTTP/1.1\r\nHost: health.internal\r\nConnection: close\r\n\r\n",
            )
            .await?;
        // A bounded status line plus an absolute deadline prevents a slow or
        // malformed peer from resetting the timeout with each received byte.
        let mut reader = BufReader::new(stream.take(256));
        let mut line = String::new();
        reader.read_line(&mut line).await?;
        if !line.ends_with("\r\n") || line.split_whitespace().nth(1) != Some("204") {
            bail!("service is not ready");
        }
        Ok(())
    })
    .await
    .context("health deadline exceeded")?
}

pub async fn http_ready(address: String) -> bool {
    probe_http(&address).await.is_ok()
}

fn local_address(address: &str) -> Result<SocketAddr> {
    let address: SocketAddr = address
        .parse()
        .map_err(|_| anyhow!("invalid listener address"))?;
    let ip = if address.ip().is_unspecified() {
        if address.is_ipv4() {
            std::net::IpAddr::V4(std::net::Ipv4Addr::LOCALHOST)
        } else {
            std::net::IpAddr::V6(std::net::Ipv6Addr::LOCALHOST)
        }
    } else {
        address.ip()
    };
    Ok(SocketAddr::new(ip, address.port()))
}

/// The gateway CLI has a synchronous entrypoint. Its local HTTP check includes
/// the upstream HTTP probes, followed by a separate bounded TLS listener check.
pub fn probe_gateway(http: &str, https: &str) -> Result<()> {
    let http = local_address(http)?.to_string();
    let https = local_address(https)?;
    tokio::runtime::Builder::new_current_thread()
        .enable_all()
        .build()?
        .block_on(async {
            tokio::time::timeout(budget::GATEWAY, async {
                probe_http_with_budget(&http, budget::GATEWAY_HTTP).await?;
                tokio::time::timeout(budget::TLS_CONNECT, TcpStream::connect(https))
                    .await
                    .context("TLS listener deadline exceeded")?
                    .context("TLS listener unavailable")?;
                Ok(())
            })
            .await
            .context("gateway health deadline exceeded")?
        })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::{Read, Write};

    async fn delayed_response(delay: Duration) -> (String, tokio::task::JoinHandle<()>) {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap().to_string();
        let worker = tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut request = [0; 1024];
            assert!(socket.read(&mut request).await.unwrap() > 0);
            tokio::time::sleep(delay).await;
            socket
                .write_all(b"HTTP/1.1 204 No Content\r\nContent-Length: 0\r\n\r\n")
                .await
                .unwrap();
        });
        (address, worker)
    }

    #[tokio::test]
    async fn http_probe_allows_healthy_response_beyond_old_read_timeout() {
        let (address, worker) = delayed_response(Duration::from_millis(3500)).await;
        probe_http(&address).await.unwrap();
        worker.await.unwrap();
    }

    #[tokio::test]
    async fn gateway_probe_includes_nested_http_and_tls_checks() {
        let (upstream, upstream_worker) = delayed_response(Duration::from_millis(7500)).await;
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let http = listener.local_addr().unwrap().to_string();
        let tls = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let https = tls.local_addr().unwrap().to_string();
        let worker = tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut request = [0; 1024];
            assert!(socket.read(&mut request).await.unwrap() > 0);
            // Simulate gateway transport/scheduling overhead before its upstream
            // probe. The full chain exceeds HTTP's budget but fits GATEWAY_HTTP.
            tokio::time::sleep(Duration::from_secs(2)).await;
            assert!(http_ready(upstream).await);
            socket
                .write_all(b"HTTP/1.1 204 No Content\r\n\r\n")
                .await
                .unwrap();
        });
        tokio::task::spawn_blocking(move || probe_gateway(&http, &https))
            .await
            .unwrap()
            .unwrap();
        tls.accept().await.unwrap();
        worker.await.unwrap();
        upstream_worker.await.unwrap();
    }

    #[tokio::test]
    async fn http_deadline_is_not_extended_by_slow_response_bytes() {
        let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
        let address = listener.local_addr().unwrap().to_string();
        let worker = tokio::spawn(async move {
            let (mut socket, _) = listener.accept().await.unwrap();
            let mut request = [0; 1024];
            assert!(socket.read(&mut request).await.unwrap() > 0);
            loop {
                if socket.write_all(b"H").await.is_err() {
                    break;
                }
                tokio::time::sleep(Duration::from_millis(20)).await;
            }
        });
        let error = probe_http_with_budget(&address, Duration::from_millis(150))
            .await
            .unwrap_err();
        assert_eq!(error.to_string(), "health deadline exceeded");
        worker.abort();
        let _ = worker.await;
    }

    #[test]
    fn compose_healthchecks_allow_the_full_cli_budget() {
        let compose: serde_yaml::Value = serde_yaml::from_str(include_str!(
            "../../../../docker/compose/docker-compose.yml"
        ))
        .unwrap();
        for (service, duration) in [
            ("auth", budget::AUTH_RPC),
            ("login", budget::HTTP),
            ("bookmarks", budget::HTTP),
            ("collections", budget::HTTP),
            ("web", budget::GATEWAY),
        ] {
            let configured = compose["services"][service]["healthcheck"]["timeout"]
                .as_str()
                .unwrap();
            let seconds = configured
                .strip_suffix('s')
                .unwrap()
                .parse::<u64>()
                .unwrap();
            assert!(
                Duration::from_secs(seconds) > duration,
                "{service} kills its readiness CLI too early"
            );
        }
    }

    #[tokio::test]
    async fn http_probe_requires_ready_status() {
        for (status, success) in [
            ("204 No Content", true),
            ("503 Service Unavailable", false),
            ("302 Found", false),
        ] {
            let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
            let address = listener.local_addr().unwrap();
            let worker = std::thread::spawn(move || {
                let (mut socket, _) = listener.accept().unwrap();
                let mut request = [0; 1024];
                let _ = socket.read(&mut request);
                write!(socket, "HTTP/1.1 {status}\r\nContent-Length: 0\r\n\r\n").unwrap();
            });
            assert_eq!(probe_http(&address.to_string()).await.is_ok(), success);
            worker.join().unwrap();
        }
    }
}
