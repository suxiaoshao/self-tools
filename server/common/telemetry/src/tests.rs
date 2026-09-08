use crate::{IngressTrust, OpenTelemetrySpanExt, PropagationFields};
use opentelemetry_proto::tonic::collector::trace::v1::ExportTraceServiceRequest;
use prost::Message;
use std::{
    io::{BufRead, Read, Write},
    net::TcpListener,
    process::Command,
    time::{Duration, Instant},
};

// Each child has its own process environment and subscriber; parallel tests never mutate env.
#[test]
fn exporter_child() {
    if std::env::var("SELF_TOOLS_TELEMETRY_PROBE").is_err() {
        return;
    }
    let guard = crate::init("telemetry-test").unwrap();
    let (parent, correlation) = crate::extract(&PropagationFields::default(), IngressTrust::Public);
    let span = tracing::info_span!(target:"telemetry","http.server",otel.kind="server");
    span.set_parent(parent).unwrap();
    span.in_scope(||{
        assert_eq!(crate::current_correlation(),Some(correlation));
        tracing::info!(target:"telemetry",event="http.completed",method="GET",route="/test",status=200u64,duration_ms=0u64,outcome="success",cookie="cookie-secret",body="body-secret",source=?std::io::Error::other("error-secret"));
        tracing::warn!(target:"third_party",message="third-party-secret");
        let unsafe_span=tracing::info_span!(target:"telemetry","private-span",password="span-secret");
        drop(unsafe_span);
    });
    drop(span);
    // Export failures are telemetry failures, not an application error or changed exit status.
    let _ = guard.shutdown();
}
fn probe(endpoint: &str, timeout_ms: u64) -> std::process::Output {
    let mut command = Command::new(std::env::current_exe().unwrap());
    for (name, _) in std::env::vars_os() {
        if name.to_string_lossy().starts_with("OTEL_") {
            command.env_remove(name);
        }
    }
    command
        .args(["--exact", "tests::exporter_child", "--nocapture"])
        .env("SELF_TOOLS_TELEMETRY_PROBE", "1")
        .env("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", endpoint)
        .env(
            "OTEL_EXPORTER_OTLP_TRACES_HEADERS",
            "authorization=Bearer%20otlp-secret",
        )
        .env("OTEL_EXPORTER_OTLP_TRACES_TIMEOUT", timeout_ms.to_string())
        .output()
        .unwrap()
}
fn receiver(delay: Duration) -> (String, std::thread::JoinHandle<(Vec<String>, Vec<u8>)>) {
    let listener = TcpListener::bind("127.0.0.1:0").unwrap();
    let endpoint = format!("http://{}/v1/traces", listener.local_addr().unwrap());
    listener.set_nonblocking(true).unwrap();
    let thread = std::thread::spawn(move || {
        let deadline = Instant::now() + Duration::from_secs(5);
        let stream = loop {
            match listener.accept() {
                Ok((s, _)) => break s,
                Err(e)
                    if e.kind() == std::io::ErrorKind::WouldBlock && Instant::now() < deadline =>
                {
                    std::thread::sleep(Duration::from_millis(5))
                }
                Err(e) => panic!("test receiver failed: {}", e.kind()),
            }
        };
        // Accepted sockets inherit nonblocking mode on macOS. The receiver uses
        // blocking buffered reads with a deadline once the connection is accepted.
        stream.set_nonblocking(false).unwrap();
        stream
            .set_read_timeout(Some(Duration::from_secs(2)))
            .unwrap();
        let mut reader = std::io::BufReader::new(stream);
        let mut headers = Vec::new();
        let mut total = 0;
        loop {
            let mut line = String::new();
            assert!(
                reader.read_line(&mut line).unwrap() > 0,
                "unexpected HTTP EOF"
            );
            total += line.len();
            assert!(total < 16384);
            if line == "\r\n" {
                break;
            }
            headers.push(line);
        }
        let len = headers
            .iter()
            .find_map(|line| {
                line.to_ascii_lowercase()
                    .strip_prefix("content-length:")
                    .map(|v| v.trim().parse::<usize>().unwrap())
            })
            .unwrap();
        assert!(len < 100_000);
        let mut body = vec![0; len];
        reader.read_exact(&mut body).unwrap();
        std::thread::sleep(delay);
        let _ = reader
            .get_mut()
            .write_all(b"HTTP/1.1 200 OK\r\nContent-Length: 0\r\nConnection: close\r\n\r\n");
        (headers, body)
    });
    (endpoint, thread)
}
fn assert_safe(output: &std::process::Output) {
    assert!(output.status.success());
    let stdout = String::from_utf8_lossy(&output.stdout);
    let stderr = String::from_utf8_lossy(&output.stderr);
    for secret in [
        "cookie-secret",
        "body-secret",
        "error-secret",
        "span-secret",
        "third-party-secret",
        "otlp-secret",
        "/v1/traces",
    ] {
        assert!(!stdout.contains(secret));
        assert!(!stderr.contains(secret));
    }
    let event = stdout
        .lines()
        .find_map(|line| {
            serde_json::from_str::<serde_json::Value>(line)
                .ok()
                .filter(|v| v["event"] == "http.completed")
        })
        .unwrap();
    for field in ["trace_id", "request_id"] {
        assert_eq!(event[field].as_str().unwrap().len(), 32);
    }
    assert_eq!(event["span_id"].as_str().unwrap().len(), 16);
}
#[test]
fn real_otlp_protobuf_and_failure_isolation() {
    let (endpoint, receiver) = receiver(Duration::ZERO);
    let output = probe(&endpoint, 2_000);
    assert_safe(&output);
    let (headers, body) = receiver.join().unwrap();
    assert!(headers[0].starts_with("POST /v1/traces HTTP/1.1"));
    assert!(headers.iter().any(|h| {
        h.trim()
            .eq_ignore_ascii_case("content-type: application/x-protobuf")
    }));
    assert!(headers.iter().any(|h| {
        h.trim()
            .eq_ignore_ascii_case("authorization: Bearer otlp-secret")
    }));
    let request = ExportTraceServiceRequest::decode(body.as_slice()).unwrap();
    let spans = request
        .resource_spans
        .iter()
        .flat_map(|r| r.scope_spans.iter())
        .flat_map(|s| s.spans.iter())
        .collect::<Vec<_>>();
    assert_eq!(spans.len(), 1);
    assert_eq!(spans[0].name, "http.server");
    assert_ne!(spans[0].trace_id, vec![0; 16]);
    assert!(!String::from_utf8_lossy(&body).contains("secret"));
    let (endpoint, receiver) = self::receiver(Duration::from_millis(250));
    let started = Instant::now();
    assert_safe(&probe(&endpoint, 100));
    assert!(started.elapsed() < Duration::from_secs(5));
    receiver.join().unwrap();
    assert_safe(&probe("", 100));
}
