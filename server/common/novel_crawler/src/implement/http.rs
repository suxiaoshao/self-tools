use crate::errors::NovelResult;
use reqwest::Client;
use std::time::Duration;
use tracing::Instrument;

const MOBILE_USER_AGENT: &str = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";

pub(super) enum UserAgent {
    Default,
    Mobile,
}

pub(super) async fn text_from_url(
    url: &str,
    charset: &str,
    user_agent: UserAgent,
) -> NovelResult<String> {
    let client = Client::builder().timeout(Duration::from_secs(20)).build()?;
    read_text(&client, url, charset, user_agent).await
}

async fn read_text(
    client: &Client,
    url: &str,
    charset: &str,
    user_agent: UserAgent,
) -> NovelResult<String> {
    let span = tracing::info_span!(target: "telemetry", "crawler.http", otel.kind = "client");
    let mut request = client.get(url);
    if let UserAgent::Mobile = user_agent {
        request = request.header(reqwest::header::USER_AGENT, MOBILE_USER_AGENT);
    }
    let body = async {
        request
            .send()
            .await?
            .error_for_status()?
            .text_with_charset(charset)
            .await
    }
    .instrument(span)
    .await?;
    Ok(body)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::NovelError;
    use tokio::{
        io::{AsyncReadExt, AsyncWriteExt},
        net::TcpListener,
        task::JoinHandle,
    };

    async fn respond(
        status: &str,
        content_type: &str,
        body: &[u8],
    ) -> (String, JoinHandle<String>) {
        let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
        let url = format!("http://{}/fixture", listener.local_addr().unwrap());
        let mut response = format!(
            "HTTP/1.1 {status}\r\nContent-Type: {content_type}\r\nContent-Length: {}\r\nConnection: close\r\n\r\n",
            body.len()
        ).into_bytes();
        response.extend_from_slice(body);
        let server = tokio::spawn(async move {
            tokio::time::timeout(Duration::from_secs(5), async move {
                let (mut stream, _) = listener.accept().await.unwrap();
                let mut request = Vec::new();
                while !request.windows(4).any(|bytes| bytes == b"\r\n\r\n") {
                    assert!(request.len() < 8192, "request headers too large");
                    assert_ne!(stream.read_buf(&mut request).await.unwrap(), 0);
                }
                stream.write_all(&response).await.unwrap();
                String::from_utf8(request).unwrap()
            })
            .await
            .expect("loopback response must complete")
        });
        (url, server)
    }

    fn client() -> Client {
        Client::builder()
            .no_proxy()
            .timeout(Duration::from_secs(5))
            .build()
            .unwrap()
    }

    #[tokio::test]
    async fn decodes_charsets_and_preserves_site_user_agents() {
        // GB18030 bytes for 中文; the HTML parser itself only receives decoded strings.
        let (url, server) = respond("200 OK", "text/html", b"\xd6\xd0\xce\xc4").await;
        assert_eq!(
            read_text(&client(), &url, "gb18030", UserAgent::Default)
                .await
                .unwrap(),
            "中文"
        );
        assert!(
            !server
                .await
                .unwrap()
                .to_ascii_lowercase()
                .contains("user-agent:")
        );

        let (url, server) = respond("200 OK", "text/html", "中文".as_bytes()).await;
        assert_eq!(
            read_text(&client(), &url, "utf-8", UserAgent::Mobile)
                .await
                .unwrap(),
            "中文"
        );
        let request = server.await.unwrap();
        assert!(
            request
                .lines()
                .any(|line| line.eq_ignore_ascii_case(&format!("user-agent: {MOBILE_USER_AGENT}")))
        );

        // A response charset overrides the site's fallback, matching reqwest's existing contract.
        let (url, server) = respond("200 OK", "text/html; charset=utf-8", "中文".as_bytes()).await;
        assert_eq!(
            read_text(&client(), &url, "gb18030", UserAgent::Mobile)
                .await
                .unwrap(),
            "中文"
        );
        server.await.unwrap();
    }

    #[tokio::test]
    async fn retains_http_status_as_network_error_without_parsing_error_pages() {
        let (url, server) = respond("502 Bad Gateway", "text/html", b"upstream failure page").await;
        let error = read_text(&client(), &url, "utf-8", UserAgent::Mobile)
            .await
            .unwrap_err();
        let NovelError::NetworkError(source) = error else {
            panic!("HTTP failures must retain their source");
        };
        assert_eq!(source.status(), Some(reqwest::StatusCode::BAD_GATEWAY));
        assert!(!format!("{source:?}").contains("upstream failure page"));
        server.await.unwrap();
    }
}
