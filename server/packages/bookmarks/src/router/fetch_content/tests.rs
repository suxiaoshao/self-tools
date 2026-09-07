use super::client::{MAX_IMAGE_BYTES, image_type, read_image, validated_addresses};
use super::*;
use axum::{
    body::{Body, to_bytes},
    http::Request,
};
use std::net::SocketAddr;
use tower::ServiceExt;

const COVER: &str = "https://bookcover.yuewen.com/qdbimg/349573/1026909178/180";
const PNG: &[u8] = b"\x89PNG\r\n\x1a\nfixture";

#[test]
fn target_policy_and_query_validation() {
    for url in [
        COVER,
        "//bookcover.yuewen.com/qdbimg/349573/1/180",
        "http://bookcover.yuewen.com:80/qdbimg/349573/1/180",
        "https://ccportrait.yuewen.com/apimg/349573/p_3626960803214301/100",
        "https://i4-static.jjwxc.net/tmp/backend/authorspace/s1/19/18294/1829338/20230316185201_300_420.jpg",
        "http://i5-static.jjwxc.net/tmp/backend/authorspace/s1/14/13227/1322620/20240326161418.png",
        "https://i9-static.jjwxc.net/novelimage.php?ver=6c95f52cd5e5d1c46c1df1da8abaa2d4&novelid=951169&coverid=21",
        "http://static.jjwxc.net/tmp/guanli/authordefaultcover/20230411155238_643511c6e50a1_350.png",
    ] {
        let target = ImageTarget::parse(url).unwrap_or_else(|_| panic!("{url}"));
        assert_eq!(target.url().scheme(), "https");
        assert_eq!(target.url().port(), None);
    }
    for url in [
        "https://bookcover.yuewen.com.evil.test/qdbimg/349573/1/180",
        "https://user@bookcover.yuewen.com/qdbimg/349573/1/180",
        "https://@bookcover.yuewen.com/qdbimg/349573/1/180",
        "https://bookcover.yuewen.com:444/qdbimg/349573/1/180",
        "https://127.0.0.1/a",
        "https://[::1]/a",
        "https://bookcover.yuewen.com./qdbimg/349573/1/180",
        "https://bookcover.yuewen.com/x/../qdbimg/349573/1/180",
        "https://bookcover.yuewen.com/%2e%2e/qdbimg/349573/1/180",
        "https://bookcover.yuewen.com/qdbimg/349573/1/180#x",
        "https://bookcover.yuewen.com/qdbimg/349573/1/180?x=1",
        "https://i6-static.jjwxc.net/tmp/backend/authorspace/s1/1/1/1/a.png",
        "https://i9-static.jjwxc.net/novelimage.php?novelid=1&novelid=2&coverid=1&ver=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        "https://i9-static.jjwxc.net/novelimage.php?novelid=1&coverid=1",
        " https://bookcover.yuewen.com/qdbimg/349573/1/180",
        "https://bookcover.yuewen.com\\@evil.test/a",
    ] {
        assert!(ImageTarget::parse(url).is_err(), "{url}");
    }
    for query in [
        None,
        Some(""),
        Some("url=%GG"),
        Some("url=%FF"),
        Some("x=1"),
        Some("url=a&url=b"),
        Some("url=a&other=b"),
    ] {
        assert!(parse_query(query).is_err());
    }
    let query = url::form_urlencoded::Serializer::new(String::new())
        .append_pair("url", COVER)
        .finish();
    assert!(parse_query(Some(&query)).is_ok());
}
#[test]
fn address_ranges_and_dns_answers() {
    for ip in [
        "0.0.0.0",
        "10.255.255.255",
        "100.64.0.0",
        "100.127.255.255",
        "127.0.0.1",
        "169.254.169.254",
        "172.16.0.0",
        "172.31.255.255",
        "192.0.0.255",
        "192.0.2.1",
        "192.88.99.1",
        "192.168.255.255",
        "198.18.0.0",
        "198.19.255.255",
        "198.51.100.1",
        "203.0.113.1",
        "224.0.0.0",
        "255.255.255.255",
        "::1",
        "::ffff:8.8.8.8",
        "64:ff9b::808:808",
        "fe80::1",
        "fc00::1",
        "ff02::1",
        "2001::1",
        "2001:1ff:ffff::1",
        "2001:db8::1",
        "2002::1",
        "3fff:fff::1",
    ] {
        assert!(!policy::is_allowed_ip(ip.parse().unwrap()), "{ip}");
    }
    for ip in [
        "8.8.8.8",
        "100.63.255.255",
        "100.128.0.0",
        "172.15.255.255",
        "172.32.0.0",
        "198.17.255.255",
        "198.20.0.0",
        "2001:4860:4860::8888",
        "2606:4700::1111",
        "3fff:1000::1",
    ] {
        assert!(policy::is_allowed_ip(ip.parse().unwrap()), "{ip}");
    }
    assert!(validated_addresses(vec![]).is_err());
    assert!(
        validated_addresses(vec![
            "8.8.8.8:443".parse().unwrap(),
            "127.0.0.1:443".parse().unwrap()
        ])
        .is_err()
    );
    let addresses = vec![
        "8.8.8.8:443".parse().unwrap(),
        "[2606:4700::1111]:443".parse().unwrap(),
    ];
    assert_eq!(
        validated_addresses(addresses.clone())
            .unwrap()
            .collect::<Vec<_>>(),
        addresses
    );
}
#[tokio::test]
async fn budgets_refill_and_release_without_waiting() {
    let state = Arc::new(ImageProxyState::new().unwrap());
    let now = Instant::now();
    let permits: Vec<_> = (0..16).map(|_| state.try_admit(now).unwrap()).collect();
    assert!(matches!(
        state.try_admit(now),
        Err(ImageProxyError::RateLimited)
    ));
    drop(permits);
    for _ in 0..16 {
        drop(state.try_admit(now).unwrap());
    }
    assert!(matches!(
        state.try_admit(now),
        Err(ImageProxyError::RateLimited)
    ));
    drop(
        state
            .try_admit(now + std::time::Duration::from_millis(125))
            .unwrap(),
    );
    assert!(matches!(
        state.try_admit(now + std::time::Duration::from_millis(125)),
        Err(ImageProxyError::RateLimited)
    ));
    let task_state = state.clone();
    let (tx, rx) = tokio::sync::oneshot::channel();
    let task = tokio::spawn(async move {
        let _permit = task_state
            .try_admit(now + std::time::Duration::from_secs(5))
            .unwrap();
        tx.send(()).unwrap();
        std::future::pending::<()>().await;
    });
    rx.await.unwrap();
    assert_eq!(state.permits.available_permits(), 15);
    task.abort();
    let _ = task.await;
    assert_eq!(state.permits.available_permits(), 16);
}
#[tokio::test]
async fn route_rejects_before_network_and_returns_safe_errors() {
    let state = Arc::new(ImageProxyState::new().unwrap());
    let app = image_router(state.clone());
    for (method, uri, status) in [
        ("GET", "/fetch-content?url=https://127.0.0.1/", 403),
        ("GET", "/fetch-content?url=%GG", 400),
        ("HEAD", "/fetch-content", 405),
        ("POST", "/fetch-content", 405),
    ] {
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .method(method)
                    .uri(uri)
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), status);
        assert_eq!(response.headers()[header::CACHE_CONTROL], "no-store");
        assert!(
            to_bytes(response.into_body(), 1024)
                .await
                .unwrap()
                .is_empty()
        );
    }
    assert_eq!(state.bucket.lock().unwrap().tokens, 32.0);
    for error in [
        ImageProxyError::InvalidUrl,
        ImageProxyError::ForbiddenTarget,
        ImageProxyError::RateLimited,
        ImageProxyError::UpstreamNotFound,
        ImageProxyError::UpstreamTimeout,
        ImageProxyError::UpstreamFailure,
        ImageProxyError::ImageTooLarge,
        ImageProxyError::UnsupportedImage,
        ImageProxyError::Internal,
    ] {
        let response = error.into_response();
        assert_eq!(response.status(), error.status());
        assert!(!response.headers().contains_key(header::LOCATION));
        assert!(!response.headers().contains_key(header::SET_COOKIE));
        assert!(
            to_bytes(response.into_body(), 1024)
                .await
                .unwrap()
                .is_empty()
        );
    }
}

// Test-only network destination; no production flag can install this resolver.
#[derive(Clone)]
struct TestResolver {
    address: SocketAddr,
    calls: Arc<std::sync::atomic::AtomicUsize>,
}
impl reqwest::dns::Resolve for TestResolver {
    fn resolve(&self, _: reqwest::dns::Name) -> reqwest::dns::Resolving {
        self.calls.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
        let address = self.address;
        Box::pin(async move { Ok(Box::new(std::iter::once(address)) as reqwest::dns::Addrs) })
    }
}
async fn serve_raw(
    response: Vec<u8>,
) -> (
    reqwest::Client,
    url::Url,
    Arc<std::sync::atomic::AtomicUsize>,
    tokio::task::JoinHandle<()>,
) {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let calls = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let client = client::client_builder(TestResolver {
        address,
        calls: calls.clone(),
    })
    .https_only(false)
    .build()
    .unwrap();
    let task = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut request = [0u8; 4096];
        let _ = socket.read(&mut request).await;
        let _ = socket.write_all(&response).await;
    });
    (
        client,
        format!("http://image-test.invalid:{}/", address.port())
            .parse()
            .unwrap(),
        calls,
        task,
    )
}
async fn raw_image(headers: &str, body: &[u8]) -> Result<ImagePayload, ImageProxyError> {
    let mut response = headers.as_bytes().to_vec();
    response.extend_from_slice(body);
    let (client, url, calls, task) = serve_raw(response).await;
    let result = read_image(client.get(url).send().await.unwrap()).await;
    task.await.unwrap();
    assert_eq!(calls.load(std::sync::atomic::Ordering::SeqCst), 1);
    result
}
#[tokio::test]
async fn bounded_response_and_local_headers() {
    let payload = raw_image("HTTP/1.1 200 OK\r\nContent-Type: image/jpeg\r\nSet-Cookie: private=secret\r\nAccess-Control-Allow-Origin: *\r\nConnection: close\r\n\r\n",PNG).await.unwrap();
    assert_eq!(payload.content_type, "image/png");
    let response = success_response(payload);
    assert!(!response.headers().contains_key(header::SET_COOKIE));
    assert!(
        !response
            .headers()
            .contains_key(header::ACCESS_CONTROL_ALLOW_ORIGIN)
    );
    assert_eq!(response.headers()[header::CONTENT_TYPE], "image/png");
    for (status, expected) in [
        (302, ImageProxyError::UpstreamFailure),
        (404, ImageProxyError::UpstreamNotFound),
        (500, ImageProxyError::UpstreamFailure),
    ] {
        assert!(
            matches!(raw_image(&format!("HTTP/1.1 {status} Error\r\nLocation: http://127.0.0.1:1/\r\nContent-Length: 0\r\nConnection: close\r\n\r\n"),b"").await,Err(e) if e==expected)
        );
    }
    assert!(matches!(
        raw_image(
            "HTTP/1.1 200 OK\r\nContent-Encoding: gzip\r\nConnection: close\r\n\r\n",
            PNG
        )
        .await,
        Err(ImageProxyError::UpstreamFailure)
    ));
    assert!(matches!(
        raw_image("HTTP/1.1 200 OK\r\nConnection: close\r\n\r\n", b"<svg />").await,
        Err(ImageProxyError::UnsupportedImage)
    ));
    let mut chunked = format!("{:x}\r\n", PNG.len()).into_bytes();
    chunked.extend_from_slice(PNG);
    chunked.extend_from_slice(b"\r\n0\r\n\r\n");
    assert_eq!(
        raw_image(
            "HTTP/1.1 200 OK\r\nTransfer-Encoding: chunked\r\nConnection: close\r\n\r\n",
            &chunked
        )
        .await
        .unwrap()
        .bytes,
        PNG
    );
    let mut bytes = vec![0; MAX_IMAGE_BYTES];
    bytes[..PNG.len()].copy_from_slice(PNG);
    assert_eq!(
        raw_image("HTTP/1.1 200 OK\r\nConnection: close\r\n\r\n", &bytes)
            .await
            .unwrap()
            .bytes
            .len(),
        MAX_IMAGE_BYTES
    );
    bytes.push(0);
    assert!(matches!(
        raw_image("HTTP/1.1 200 OK\r\nConnection: close\r\n\r\n", &bytes).await,
        Err(ImageProxyError::ImageTooLarge)
    ));
    assert!(matches!(
        raw_image(
            "HTTP/1.1 200 OK\r\nContent-Length: 5242881\r\nConnection: close\r\n\r\n",
            b""
        )
        .await,
        Err(ImageProxyError::ImageTooLarge)
    ));
    assert!(matches!(
        raw_image(
            "HTTP/1.1 200 OK\r\nContent-Length: 200\r\nConnection: close\r\n\r\n",
            PNG
        )
        .await,
        Err(ImageProxyError::UpstreamFailure)
    ));
}
#[test]
fn supported_signatures_only() {
    for (bytes, mime) in [
        (PNG, "image/png"),
        (&b"\xff\xd8\xff\xe0"[..], "image/jpeg"),
        (&b"GIF89a"[..], "image/gif"),
        (&b"RIFF0000WEBP"[..], "image/webp"),
    ] {
        assert_eq!(image_type(bytes), Some(mime));
    }
    for bytes in [&b"<html>"[..], &b"<svg>"[..], &b""[..], &b"RIFF"[..]] {
        assert_eq!(image_type(bytes), None);
    }
}

#[tokio::test]
async fn stalled_body_times_out() {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let task = tokio::spawn(async move {
        let (mut socket, _) = listener.accept().await.unwrap();
        let mut request = [0u8; 4096];
        let _ = socket.read(&mut request).await;
        socket
            .write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 100\r\n\r\n")
            .await
            .unwrap();
        std::future::pending::<()>().await;
    });
    let client = client::client_builder(TestResolver {
        address,
        calls: Arc::default(),
    })
    .https_only(false)
    .timeout(std::time::Duration::from_millis(100))
    .build()
    .unwrap();
    let response = client
        .get(format!("http://image-test.invalid:{}/", address.port()))
        .send()
        .await
        .unwrap();
    assert!(matches!(
        read_image(response).await,
        Err(ImageProxyError::UpstreamTimeout)
    ));
    task.abort();
    let _ = task.await;
}

#[tokio::test]
async fn https_only_production_client_rejects_plain_http() {
    let client = client::client_builder(ValidatedResolver).build().unwrap();
    assert!(client.get("http://127.0.0.1:1/").send().await.is_err());
}

#[tokio::test]
#[ignore = "explicit live smoke; requires public DNS and direct HTTPS egress"]
async fn live_image_sources() {
    let client = client::client_builder(ValidatedResolver).build().unwrap();
    let mut failures = Vec::new();
    for input in [
        COVER,
        "https://ccportrait.yuewen.com/apimg/349573/p_3626960803214301/100",
        "https://i4-static.jjwxc.net/tmp/backend/authorspace/s1/19/18294/1829338/20230316185201_300_420.jpg",
        "https://i9-static.jjwxc.net/novelimage.php?novelid=951169&coverid=21&ver=6c95f52cd5e5d1c46c1df1da8abaa2d4",
        "http://static.jjwxc.net/tmp/guanli/authordefaultcover/20230411155238_643511c6e50a1_350.png",
        "http://i5-static.jjwxc.net/tmp/backend/authorspace/s1/14/13227/1322620/20240326161418.png",
    ] {
        let target = ImageTarget::parse(input).unwrap();
        match download_image(&client, &target).await {
            Ok(payload) => eprintln!(
                "{} {} {}",
                target.url().host_str().unwrap(),
                payload.content_type,
                payload.bytes.len()
            ),
            Err(error) => {
                failures.push((target.url().host_str().unwrap().to_owned(), error.code()))
            }
        }
    }
    assert!(failures.is_empty(), "live sample failures: {failures:?}");
}

#[tokio::test]
async fn https_handler_uses_resolved_connection_and_keeps_upstream_headers_private() {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    use tokio_rustls::{
        TlsAcceptor,
        rustls::{ServerConfig, pki_types::PrivatePkcs8KeyDer},
    };
    let rcgen::CertifiedKey { cert, signing_key } =
        rcgen::generate_simple_self_signed(vec!["bookcover.yuewen.com".into()]).unwrap();
    let server = ServerConfig::builder_with_provider(Arc::new(
        tokio_rustls::rustls::crypto::aws_lc_rs::default_provider(),
    ))
    .with_safe_default_protocol_versions()
    .unwrap()
    .with_no_client_auth()
    .with_single_cert(
        vec![cert.der().clone()],
        PrivatePkcs8KeyDer::from(signing_key.serialize_der()).into(),
    )
    .unwrap();
    let acceptor = TlsAcceptor::from(Arc::new(server));
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let calls = Arc::new(std::sync::atomic::AtomicUsize::new(0));
    let client = client::client_builder(TestResolver {
        address,
        calls: calls.clone(),
    })
    .add_root_certificate(reqwest::Certificate::from_der(cert.der()).unwrap())
    .build()
    .unwrap();
    let mut state = ImageProxyState::new().unwrap();
    state.client = client;
    let task = tokio::spawn(async move {
        let (socket, _) = listener.accept().await.unwrap();
        let mut socket = acceptor.accept(socket).await.unwrap();
        let mut request = Vec::new();
        loop {
            let mut buf = [0u8; 1024];
            let n = socket.read(&mut buf).await.unwrap();
            assert!(n > 0);
            request.extend_from_slice(&buf[..n]);
            if request.windows(4).any(|w| w == b"\r\n\r\n") {
                break;
            }
            assert!(request.len() < 8192);
        }
        let request = String::from_utf8(request).unwrap().to_ascii_lowercase();
        assert!(request.starts_with("get /qdbimg/349573/1026909178/180 http/1.1"));
        assert!(request.contains("host: bookcover.yuewen.com"));
        assert!(request.contains("accept-encoding: identity"));
        assert!(!request.contains("authorization:"));
        assert!(!request.contains("cookie:"));
        socket.write_all(format!("HTTP/1.1 200 OK\r\nContent-Length: {}\r\nContent-Type: image/jpeg\r\nSet-Cookie: secret=1\r\nConnection: close\r\n\r\n",PNG.len()).as_bytes()).await.unwrap();
        socket.write_all(PNG).await.unwrap();
        socket.shutdown().await.unwrap();
    });
    let query = url::form_urlencoded::Serializer::new(String::new())
        .append_pair("url", COVER)
        .finish();
    let response = image_router(Arc::new(state))
        .oneshot(
            Request::builder()
                .uri(format!("/fetch-content?{query}"))
                .header(header::AUTHORIZATION, "Bearer private")
                .header(header::COOKIE, "private=1")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), 200);
    assert_eq!(response.headers()[header::CONTENT_TYPE], "image/png");
    assert!(!response.headers().contains_key(header::SET_COOKIE));
    assert_eq!(to_bytes(response.into_body(), 1024).await.unwrap(), PNG);
    task.await.unwrap();
    assert_eq!(calls.load(std::sync::atomic::Ordering::SeqCst), 1);
}
