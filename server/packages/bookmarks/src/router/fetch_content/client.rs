use super::{
    error::ImageProxyError,
    policy::{ImageTarget, is_allowed_ip},
};
use axum::body::Bytes;
use reqwest::{
    Client, ClientBuilder,
    dns::{Addrs, Name, Resolve, Resolving},
};
use std::{io, net::SocketAddr, sync::Arc, time::Duration};
use tracing::Instrument;

pub(super) const MAX_IMAGE_BYTES: usize = 5 * 1024 * 1024;
pub(super) const TOTAL_TIMEOUT: Duration = Duration::from_secs(10);
pub(super) struct ValidatedResolver;

pub(super) fn validated_addresses(addresses: Vec<SocketAddr>) -> io::Result<Addrs> {
    if addresses.is_empty() || addresses.iter().any(|a| !is_allowed_ip(a.ip())) {
        return Err(io::Error::other("image destination rejected"));
    }
    Ok(Box::new(addresses.into_iter()))
}
impl Resolve for ValidatedResolver {
    fn resolve(&self, name: Name) -> Resolving {
        Box::pin(async move {
            let addresses = tokio::net::lookup_host((name.as_str(), 443))
                .await?
                .collect();
            Ok(validated_addresses(addresses)?)
        })
    }
}
// Also used by controlled tests: security options have one construction path.
pub(super) fn client_builder(resolver: impl Resolve + 'static) -> ClientBuilder {
    Client::builder()
        .dns_resolver(Arc::new(resolver))
        .https_only(true)
        .no_proxy()
        .redirect(reqwest::redirect::Policy::none())
        .retry(reqwest::retry::never())
        .connect_timeout(Duration::from_secs(3))
        .timeout(TOTAL_TIMEOUT)
        .no_gzip()
        .no_brotli()
        .no_zstd()
        .no_deflate()
}
pub(super) struct ImagePayload {
    pub(super) bytes: Bytes,
    pub(super) content_type: &'static str,
}
fn network_error(error: reqwest::Error) -> ImageProxyError {
    if error.is_timeout() {
        ImageProxyError::UpstreamTimeout
    } else {
        ImageProxyError::UpstreamFailure
    }
}
pub(super) async fn download_image(
    client: &Client,
    target: &ImageTarget,
) -> Result<ImagePayload, ImageProxyError> {
    let span = tracing::info_span!(target:"telemetry","image.http",otel.kind="client");
    tokio::time::timeout(
        TOTAL_TIMEOUT,
        async {
            let response = client
                .get(target.url().clone())
                .header(reqwest::header::ACCEPT_ENCODING, "identity")
                .send()
                .await
                .map_err(network_error)?;
            read_image(response).await
        }
        .instrument(span),
    )
    .await
    .map_err(|_| ImageProxyError::UpstreamTimeout)?
}
pub(super) async fn read_image(
    mut response: reqwest::Response,
) -> Result<ImagePayload, ImageProxyError> {
    use ImageProxyError::*;
    match response.status().as_u16() {
        200 => (),
        404 => return Err(UpstreamNotFound),
        _ => return Err(UpstreamFailure),
    }
    if response
        .headers()
        .get_all(reqwest::header::CONTENT_ENCODING)
        .iter()
        .any(|h| h.as_bytes() != b"identity")
    {
        return Err(UpstreamFailure);
    }
    if response
        .content_length()
        .is_some_and(|n| n > MAX_IMAGE_BYTES as u64)
    {
        return Err(ImageTooLarge);
    }
    let mut bytes = Vec::new();
    while let Some(chunk) = response.chunk().await.map_err(network_error)? {
        if chunk.len() > MAX_IMAGE_BYTES - bytes.len() {
            return Err(ImageTooLarge);
        }
        bytes.extend_from_slice(&chunk);
    }
    let content_type = image_type(&bytes).ok_or(UnsupportedImage)?;
    Ok(ImagePayload {
        bytes: bytes.into(),
        content_type,
    })
}
pub(super) fn image_type(bytes: &[u8]) -> Option<&'static str> {
    if bytes.starts_with(b"\xff\xd8\xff") {
        Some("image/jpeg")
    } else if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
        Some("image/png")
    } else if bytes.starts_with(b"GIF87a") || bytes.starts_with(b"GIF89a") {
        Some("image/gif")
    } else if bytes.len() >= 12 && &bytes[..4] == b"RIFF" && &bytes[8..12] == b"WEBP" {
        Some("image/webp")
    } else {
        None
    }
}
