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
fn cookie(headers: &HeaderMap, name: &str) -> Result<Option<String>, Rejected> {
    let mut result = None;
    for header in headers.get_all("cookie") {
        for pair in header.to_str().map_err(|_| Rejected)?.split(';') {
            let pair = pair.trim();
            let Some((key, value)) = pair.split_once('=') else {
                if pair == name {
                    return Err(Rejected);
                }
                continue;
            };
            if key != name {
                continue;
            }
            if result.is_some() {
                return Err(Rejected);
            }
            result = Some(value.to_owned());
        }
    }
    Ok(result)
}
/// A session token is opaque here. The auth owner decides whether it authenticates;
/// malformed credentials must not prevent a browser from logging in again.
pub fn session_cookie(headers: &HeaderMap) -> Result<Option<String>, Rejected> {
    cookie(headers, SESSION_COOKIE)
}
/// Ceremony binding is protocol state, so its canonical encoding remains mandatory.
pub fn ceremony_cookie(headers: &HeaderMap) -> Result<Option<String>, Rejected> {
    let token = cookie(headers, CEREMONY_COOKIE)?;
    if let Some(token) = &token
        && URL_SAFE_NO_PAD.decode(token).map_err(|_| Rejected)?.len() != 32
    {
        return Err(Rejected);
    }
    Ok(token)
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
    fn session_cookies_are_opaque_and_unique() {
        let token = URL_SAFE_NO_PAD.encode([7; 32]);
        let mut h = HeaderMap::new();
        h.insert(
            "cookie",
            format!("theme=dark; {SESSION_COOKIE}={token}; {CEREMONY_COOKIE}={token}")
                .parse()
                .unwrap(),
        );
        assert_eq!(session_cookie(&h).unwrap(), Some(token.clone()));
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
        assert!(session_cookie(&h).is_err());
        h.insert(
            "cookie",
            format!("{SESSION_COOKIE}={token}=").parse().unwrap(),
        );
        assert_eq!(session_cookie(&h).unwrap(), Some(format!("{token}=")));
        for raw in ["", "legacy.jwt.token", "abc", "===="] {
            h.insert("cookie", format!("{SESSION_COOKIE}={raw}").parse().unwrap());
            assert_eq!(session_cookie(&h).unwrap(), Some(raw.into()));
            h.append(
                "cookie",
                format!("{SESSION_COOKIE}={token}").parse().unwrap(),
            );
            assert!(session_cookie(&h).is_err());
        }
        h.insert("cookie", SESSION_COOKIE.parse().unwrap());
        assert!(session_cookie(&h).is_err());
    }

    #[test]
    fn ceremony_cookies_remain_canonical_and_unique() {
        let token = URL_SAFE_NO_PAD.encode([7; 32]);
        let mut h = HeaderMap::new();
        for raw in ["", "legacy.jwt.token", "abc", &format!("{token}=")] {
            h.insert(
                "cookie",
                format!("{CEREMONY_COOKIE}={raw}").parse().unwrap(),
            );
            assert!(ceremony_cookie(&h).is_err());
        }
        h.insert(
            "cookie",
            format!("{CEREMONY_COOKIE}={token}").parse().unwrap(),
        );
        assert_eq!(ceremony_cookie(&h).unwrap(), Some(token.clone()));
        h.append(
            "cookie",
            format!("{CEREMONY_COOKIE}={token}").parse().unwrap(),
        );
        assert!(ceremony_cookie(&h).is_err());
        h.insert("cookie", CEREMONY_COOKIE.parse().unwrap());
        assert!(ceremony_cookie(&h).is_err());
    }
}
