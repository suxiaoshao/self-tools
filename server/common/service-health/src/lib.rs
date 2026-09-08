//! Shared, side-effect-free readiness and explicit schema administration.
use anyhow::{Context, Result, anyhow, bail};
use std::{
    io::{BufRead, BufReader, Write},
    net::{SocketAddr, TcpStream, ToSocketAddrs},
    time::Duration,
};

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

/// A local probe has no cookies, redirects, proxies, or public response body.
pub fn probe_http(address: &str) -> Result<()> {
    let addr = address
        .to_socket_addrs()
        .ok()
        .and_then(|mut a| a.next())
        .context("health address unavailable")?;
    let mut stream = TcpStream::connect_timeout(&addr, Duration::from_secs(2))
        .context("health connection unavailable")?;
    stream.set_read_timeout(Some(Duration::from_secs(3)))?;
    stream.set_write_timeout(Some(Duration::from_secs(2)))?;
    stream.write_all(
        b"GET /health/ready HTTP/1.1\r\nHost: health.internal\r\nConnection: close\r\n\r\n",
    )?;
    // Bound the response header even if the configured upstream is incorrect.
    let mut reader = BufReader::new(stream.take(256));
    let mut line = String::new();
    reader.read_line(&mut line)?;
    if line.split_whitespace().nth(1) != Some("204") {
        bail!("service is not ready");
    }
    Ok(())
}
use std::io::Read;

pub async fn http_ready(address: String) -> bool {
    matches!(
        tokio::time::timeout(
            Duration::from_secs(6),
            tokio::task::spawn_blocking(move || probe_http(&address))
        )
        .await,
        Ok(Ok(Ok(())))
    )
}

pub fn probe_listener(address: &str) -> Result<()> {
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
    TcpStream::connect_timeout(&SocketAddr::new(ip, address.port()), Duration::from_secs(2))
        .context("listener unavailable")?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn http_probe_requires_ready_status() {
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
            assert_eq!(probe_http(&address.to_string()).is_ok(), success);
            worker.join().unwrap();
        }
    }
}
