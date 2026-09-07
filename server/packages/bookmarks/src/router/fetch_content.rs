mod client;
mod error;
mod policy;
#[cfg(test)]
mod tests;

use axum::{
    Extension, Router,
    extract::RawQuery,
    http::{Method, StatusCode, header},
    response::{IntoResponse, Response},
    routing::any,
};
use client::{ImagePayload, ValidatedResolver, client_builder, download_image};
use error::{ImageProxyError, empty_response};
use policy::ImageTarget;
use std::{
    sync::{Arc, Mutex},
    time::Instant,
};
use tokio::sync::{OwnedSemaphorePermit, Semaphore};

pub(crate) struct ImageProxyState {
    client: reqwest::Client,
    permits: Arc<Semaphore>,
    bucket: Mutex<TokenBucket>,
}
struct TokenBucket {
    tokens: f64,
    updated_at: Instant,
}
impl ImageProxyState {
    pub(crate) fn new() -> Result<Self, reqwest::Error> {
        Ok(Self {
            client: client_builder(ValidatedResolver).build()?,
            permits: Arc::new(Semaphore::new(16)),
            bucket: Mutex::new(TokenBucket {
                tokens: 32.0,
                updated_at: Instant::now(),
            }),
        })
    }
    fn try_admit(&self, now: Instant) -> Result<OwnedSemaphorePermit, ImageProxyError> {
        let permit = self
            .permits
            .clone()
            .try_acquire_owned()
            .map_err(|_| ImageProxyError::RateLimited)?;
        let mut bucket = self.bucket.lock().map_err(|_| ImageProxyError::Internal)?;
        bucket.tokens = (bucket.tokens
            + now
                .saturating_duration_since(bucket.updated_at)
                .as_secs_f64()
                * 8.0)
            .min(32.0);
        bucket.updated_at = now.max(bucket.updated_at);
        if bucket.tokens < 1.0 {
            return Err(ImageProxyError::RateLimited);
        }
        bucket.tokens -= 1.0;
        Ok(permit)
    }
}
pub(crate) fn image_router(state: Arc<ImageProxyState>) -> Router {
    Router::new()
        .route("/fetch-content", any(fetch_content))
        .layer(Extension(state))
}
fn parse_query(query: Option<&str>) -> Result<ImageTarget, ImageProxyError> {
    let query = query.ok_or(ImageProxyError::InvalidUrl)?;
    // A 2048-byte URL may be percent encoded threefold; reject before allocating.
    if query.len() > 6150 {
        return Err(ImageProxyError::InvalidUrl);
    }
    let bytes = query.as_bytes();
    for (i, b) in bytes.iter().enumerate() {
        if *b == b'%'
            && (i + 2 >= bytes.len()
                || !bytes[i + 1].is_ascii_hexdigit()
                || !bytes[i + 2].is_ascii_hexdigit())
        {
            return Err(ImageProxyError::InvalidUrl);
        }
    }
    let mut fields = url::form_urlencoded::parse(bytes);
    let (key, value) = fields.next().ok_or(ImageProxyError::InvalidUrl)?;
    if key != "url" || fields.next().is_some() || value.contains('\u{fffd}') {
        return Err(ImageProxyError::InvalidUrl);
    }
    ImageTarget::parse(&value)
}
fn success_response(payload: ImagePayload) -> Response {
    let len = payload.bytes.len();
    let mut response = payload.bytes.into_response();
    let headers = response.headers_mut();
    headers.insert(header::CONTENT_TYPE, payload.content_type.parse().unwrap());
    headers.insert(header::CONTENT_LENGTH, len.into());
    headers.insert(
        header::CACHE_CONTROL,
        "public, max-age=3600".parse().unwrap(),
    );
    headers.insert(header::X_CONTENT_TYPE_OPTIONS, "nosniff".parse().unwrap());
    headers.insert(
        header::CONTENT_SECURITY_POLICY,
        "default-src 'none'; sandbox".parse().unwrap(),
    );
    response
}
async fn fetch_content(
    method: Method,
    RawQuery(query): RawQuery,
    Extension(state): Extension<Arc<ImageProxyState>>,
) -> Response {
    if method != Method::GET {
        let mut response = empty_response(StatusCode::METHOD_NOT_ALLOWED);
        response
            .headers_mut()
            .insert(header::ALLOW, "GET".parse().unwrap());
        return response;
    }
    let start = Instant::now();
    let mut source = "unknown";
    let result = async {
        let target = parse_query(query.as_deref())?;
        source = target.source();
        let _permit = state.try_admit(start)?;
        download_image(&state.client, &target).await
    }
    .await;
    match result {
        Ok(payload) => {
            tracing::info!(
                source,
                status = 200,
                bytes = payload.bytes.len(),
                elapsed_ms = start.elapsed().as_millis() as u64,
                "image proxy completed"
            );
            success_response(payload)
        }
        Err(error) => {
            tracing::info!(
                source,
                status = error.status().as_u16(),
                code = error.code(),
                elapsed_ms = start.elapsed().as_millis() as u64,
                "image proxy rejected"
            );
            error.into_response()
        }
    }
}
