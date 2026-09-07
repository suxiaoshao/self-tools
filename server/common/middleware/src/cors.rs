use std::{collections::HashSet, env, fmt};

use http::{
    Method,
    header::{AUTHORIZATION, CONTENT_TYPE, ORIGIN},
};
use tower_http::cors::{AllowOrigin, CorsLayer};
use url::Url;

#[derive(Debug)]
pub enum CorsConfigError {
    InvalidEncoding,
    InvalidOrigin { index: usize },
}
impl fmt::Display for CorsConfigError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::InvalidEncoding => write!(f, "CORS_ALLOWED_ORIGINS is not valid Unicode"),
            Self::InvalidOrigin { index } => {
                write!(f, "CORS_ALLOWED_ORIGINS entry {index} is invalid")
            }
        }
    }
}
impl std::error::Error for CorsConfigError {}

fn canonical_origin(input: &str) -> Option<String> {
    if input.is_empty()
        || input
            .bytes()
            .any(|b| b.is_ascii_whitespace() || b.is_ascii_control())
        || input.contains(['\\', '%', '@'])
    {
        return None;
    }
    let (scheme, rest) = input.split_once("://")?;
    if !matches!(scheme, "http" | "https") {
        return None;
    }
    // Reject paths before Url can normalize dot segments away.
    let authority = rest.strip_suffix('/').unwrap_or(rest);
    if authority.contains(['/', '?', '#']) {
        return None;
    }
    let url = Url::parse(input).ok()?;
    if url.host_str()?.ends_with('.') || url.port() == Some(0) {
        return None;
    }
    Some(url.origin().ascii_serialization())
}

fn configured_origins(value: Option<&str>) -> Result<HashSet<String>, CorsConfigError> {
    let value = value.unwrap_or("https://sushao.top");
    if value.is_empty() {
        return Ok(HashSet::new());
    }
    value
        .split(',')
        .enumerate()
        .map(|(index, origin)| {
            canonical_origin(origin.trim()).ok_or(CorsConfigError::InvalidOrigin { index })
        })
        .collect()
}

fn cors_layer(origins: HashSet<String>) -> CorsLayer {
    CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::PUT])
        .allow_headers([CONTENT_TYPE, AUTHORIZATION])
        .allow_credentials(true)
        .allow_origin(AllowOrigin::predicate(move |value, parts| {
            parts.headers.get_all(ORIGIN).iter().count() == 1
                && value
                    .to_str()
                    .ok()
                    .and_then(canonical_origin)
                    .is_some_and(|origin| origins.contains(&origin))
        }))
}

pub fn get_cors() -> Result<CorsLayer, CorsConfigError> {
    let value = match env::var("CORS_ALLOWED_ORIGINS") {
        Ok(value) => Some(value),
        Err(env::VarError::NotPresent) => None,
        Err(env::VarError::NotUnicode(_)) => return Err(CorsConfigError::InvalidEncoding),
    };
    Ok(cors_layer(configured_origins(value.as_deref())?))
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{Router, body::Body, routing::get};
    use http::{Request, header::*};
    use tower::ServiceExt;

    #[test]
    fn configuration_is_explicit_and_strict() {
        assert_eq!(
            configured_origins(None).unwrap(),
            HashSet::from(["https://sushao.top".into()])
        );
        assert!(configured_origins(Some("")).unwrap().is_empty());
        assert_eq!(
            configured_origins(Some(" http://localhost:3000 , https://sushao.top:443/ "))
                .unwrap()
                .len(),
            2
        );
        for value in [
            "*",
            "null",
            "https://sushao.top,",
            "https://sushao.top/a/..",
            "https://a@b",
            "https://sushao.top.",
            "https://sushao.top?x",
            "https://sushao.top#x",
            "http://localhost:0",
        ] {
            assert!(configured_origins(Some(value)).is_err(), "{value}");
        }
    }
    #[tokio::test]
    async fn exact_origins_and_preflight() {
        let app = Router::new()
            .route("/", get(|| async { "ok" }))
            .layer(cors_layer(configured_origins(None).unwrap()));
        for (origin, allowed) in [
            ("https://sushao.top", true),
            ("https://sushao.top:443", true),
            ("https://evilsushao.top", false),
            ("https://sub.sushao.top", false),
            ("http://sushao.top", false),
            ("https://sushao.top:444", false),
            ("null", false),
            ("http://localhost:3000", false),
            ("https://sushao.top https://evil.test", false),
        ] {
            let response = app
                .clone()
                .oneshot(
                    Request::builder()
                        .method("OPTIONS")
                        .uri("/")
                        .header(ORIGIN, origin)
                        .header(ACCESS_CONTROL_REQUEST_METHOD, "POST")
                        .header(ACCESS_CONTROL_REQUEST_HEADERS, "authorization")
                        .body(Body::empty())
                        .unwrap(),
                )
                .await
                .unwrap();
            assert_eq!(
                response.headers().contains_key(ACCESS_CONTROL_ALLOW_ORIGIN),
                allowed,
                "{origin}"
            );
            if allowed {
                assert_eq!(response.headers()[ACCESS_CONTROL_ALLOW_CREDENTIALS], "true");
                assert!(response.headers().contains_key(VARY));
            }
        }
        let response = app
            .clone()
            .oneshot(
                Request::builder()
                    .uri("/")
                    .header(ORIGIN, "https://sushao.top")
                    .header(ORIGIN, "https://evil.test")
                    .body(Body::empty())
                    .unwrap(),
            )
            .await
            .unwrap();
        assert!(!response.headers().contains_key(ACCESS_CONTROL_ALLOW_ORIGIN));
        let response = app
            .oneshot(Request::builder().uri("/").body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(response.status(), 200);
        assert!(!response.headers().contains_key(ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}
