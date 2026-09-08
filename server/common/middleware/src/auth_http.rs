//! Same-origin authentication transport. This module never authenticates a session.
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use http::{HeaderMap, Method};
pub const SESSION_COOKIE: &str = "__Host-st_session";
pub const CEREMONY_COOKIE: &str = "__Host-st_ceremony";
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct Rejected;
fn single<'a>(headers: &'a HeaderMap, name: &str) -> Result<Option<&'a str>, Rejected> {
    let mut values = headers.get_all(name).iter();
    let first = values
        .next()
        .map(|v| v.to_str().map_err(|_| Rejected))
        .transpose()?;
    if values.next().is_some() {
        return Err(Rejected);
    }
    Ok(first)
}
pub fn configured_origin() -> Result<String, Rejected> {
    let origin = std::env::var("AUTH_ORIGIN").unwrap_or_else(|_| "https://sushao.top".into());
    let url = url::Url::parse(&origin).map_err(|_| Rejected)?;
    if url.scheme() != "https" || url.origin().ascii_serialization() != origin {
        return Err(Rejected);
    }
    Ok(origin)
}
pub fn validate_request(
    headers: &HeaderMap,
    method: &Method,
    origin: &str,
) -> Result<(), Rejected> {
    if single(headers, "x-self-tools-request")? != Some("1") {
        return Err(Rejected);
    }
    let actual = single(headers, "origin")?;
    if actual.is_some_and(|v| v != origin) || (*method != Method::GET && actual != Some(origin)) {
        return Err(Rejected);
    }
    if *method != Method::GET
        && !single(headers, "content-type")?.is_some_and(|v| {
            v.split(';')
                .next()
                .is_some_and(|v| v.trim().eq_ignore_ascii_case("application/json"))
        })
    {
        return Err(Rejected);
    }
    Ok(())
}
pub fn cookie(headers: &HeaderMap, name: &str) -> Result<Option<String>, Rejected> {
    let mut result = None;
    for header in headers.get_all("cookie") {
        for pair in header.to_str().map_err(|_| Rejected)?.split(';') {
            let Some((key, value)) = pair.trim().split_once('=') else {
                continue;
            };
            if key != name {
                continue;
            }
            if result.is_some() || URL_SAFE_NO_PAD.decode(value).map_err(|_| Rejected)?.len() != 32
            {
                return Err(Rejected);
            }
            result = Some(value.to_owned());
        }
    }
    Ok(result)
}
pub fn set_cookie(name: &str, token: &str, max_age: i64) -> String {
    format!(
        "{name}={token}; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age={}",
        max_age.max(0)
    )
}
/// Preserve unrelated cookies and every duplicate for the API parser to reject.
pub fn forwarded_cookies(
    headers: &HeaderMap,
    session: bool,
    ceremony: bool,
) -> Result<String, Rejected> {
    let mut pairs = Vec::new();
    for header in headers.get_all("cookie") {
        for pair in header.to_str().map_err(|_| Rejected)?.split(';') {
            let pair = pair.trim();
            let name = pair.split('=').next().unwrap_or_default();
            if (name == SESSION_COOKIE && !session) || (name == CEREMONY_COOKIE && !ceremony) {
                continue;
            }
            if !pair.is_empty() {
                pairs.push(pair);
            }
        }
    }
    Ok(pairs.join("; "))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_cross_origin_and_simple_requests() {
        let mut h = HeaderMap::new();
        let origin = "https://sushao.top";
        assert!(validate_request(&h, &Method::GET, origin).is_err());
        h.insert("x-self-tools-request", "1".parse().unwrap());
        assert!(validate_request(&h, &Method::GET, origin).is_ok());
        h.insert("content-type", "application/json".parse().unwrap());
        assert!(validate_request(&h, &Method::POST, origin).is_err());
        for value in [
            "null",
            "https://evil.sushao.top",
            "https://sushao.top.evil.test",
        ] {
            h.insert("origin", value.parse().unwrap());
            assert!(validate_request(&h, &Method::POST, origin).is_err());
        }
        h.insert("origin", origin.parse().unwrap());
        assert!(validate_request(&h, &Method::POST, origin).is_ok());
        h.append("origin", origin.parse().unwrap());
        assert!(validate_request(&h, &Method::POST, origin).is_err());
    }
    #[test]
    fn cookies_are_canonical_and_unique() {
        let token = URL_SAFE_NO_PAD.encode([7; 32]);
        let mut h = HeaderMap::new();
        h.insert(
            "cookie",
            format!("theme=dark; {SESSION_COOKIE}={token}; {CEREMONY_COOKIE}={token}")
                .parse()
                .unwrap(),
        );
        assert_eq!(cookie(&h, SESSION_COOKIE).unwrap(), Some(token.clone()));
        assert_eq!(forwarded_cookies(&h, false, false).unwrap(), "theme=dark");
        assert!(
            !forwarded_cookies(&h, true, false)
                .unwrap()
                .contains(CEREMONY_COOKIE)
        );
        h.append(
            "cookie",
            format!("{SESSION_COOKIE}={token}").parse().unwrap(),
        );
        assert!(cookie(&h, SESSION_COOKIE).is_err());
        h.insert(
            "cookie",
            format!("{SESSION_COOKIE}={token}=").parse().unwrap(),
        );
        assert!(cookie(&h, SESSION_COOKIE).is_err());
    }
}
