use axum::{
    body::Body,
    http::{StatusCode, header},
    response::{IntoResponse, Response},
};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(super) enum ImageProxyError {
    InvalidUrl,
    ForbiddenTarget,
    RateLimited,
    UpstreamNotFound,
    UpstreamTimeout,
    UpstreamFailure,
    ImageTooLarge,
    UnsupportedImage,
    Internal,
}
impl ImageProxyError {
    pub(super) fn code(self) -> &'static str {
        match self {
            Self::InvalidUrl => "invalid_url",
            Self::ForbiddenTarget => "forbidden_target",
            Self::RateLimited => "rate_limited",
            Self::UpstreamNotFound => "upstream_not_found",
            Self::UpstreamTimeout => "upstream_timeout",
            Self::UpstreamFailure => "upstream_failure",
            Self::ImageTooLarge => "image_too_large",
            Self::UnsupportedImage => "unsupported_image",
            Self::Internal => "internal",
        }
    }
    pub(super) fn status(self) -> StatusCode {
        match self {
            Self::InvalidUrl => StatusCode::BAD_REQUEST,
            Self::ForbiddenTarget => StatusCode::FORBIDDEN,
            Self::RateLimited => StatusCode::TOO_MANY_REQUESTS,
            Self::UpstreamNotFound => StatusCode::NOT_FOUND,
            Self::UpstreamTimeout => StatusCode::GATEWAY_TIMEOUT,
            Self::Internal => StatusCode::INTERNAL_SERVER_ERROR,
            _ => StatusCode::BAD_GATEWAY,
        }
    }
}
pub(super) fn empty_response(status: StatusCode) -> Response {
    let mut response = Response::new(Body::empty());
    *response.status_mut() = status;
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, "no-store".parse().unwrap());
    response
        .headers_mut()
        .insert(header::CONTENT_LENGTH, "0".parse().unwrap());
    response
        .headers_mut()
        .insert(header::X_CONTENT_TYPE_OPTIONS, "nosniff".parse().unwrap());
    response
}
impl IntoResponse for ImageProxyError {
    fn into_response(self) -> Response {
        let mut response = empty_response(self.status());
        if self == Self::RateLimited {
            response
                .headers_mut()
                .insert(header::RETRY_AFTER, "1".parse().unwrap());
        }
        response
    }
}
