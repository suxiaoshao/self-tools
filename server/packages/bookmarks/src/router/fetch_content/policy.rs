use super::error::ImageProxyError;
use base64::{Engine as _, engine::general_purpose::STANDARD};
use std::net::IpAddr;
use url::{Host, Url};

#[derive(Clone)]
pub(super) struct ImageTarget {
    url: Url,
}
impl ImageTarget {
    pub(super) fn parse(input: &str) -> Result<Self, ImageProxyError> {
        use ImageProxyError::{ForbiddenTarget, InvalidUrl};
        if input.len() > 2048
            || input.is_empty()
            || input.trim() != input
            || input.chars().any(char::is_control)
            || input.contains(['\\', '#'])
        {
            return Err(InvalidUrl);
        }
        let normalized = if input.starts_with("//") {
            format!("https:{input}")
        } else {
            input.to_owned()
        };
        let (scheme, rest) = normalized.split_once("://").ok_or(InvalidUrl)?;
        if !matches!(scheme, "http" | "https") {
            return Err(InvalidUrl);
        }
        let authority = rest.split(['/', '?']).next().ok_or(InvalidUrl)?;
        if authority.contains(['@', '%']) {
            return Err(InvalidUrl);
        }
        let raw_path = rest
            .strip_prefix(authority)
            .ok_or(InvalidUrl)?
            .split('?')
            .next()
            .unwrap_or("");
        if raw_path.contains('%') || raw_path.split('/').any(|s| matches!(s, "." | "..")) {
            return Err(InvalidUrl);
        }
        let mut url = Url::parse(&normalized).map_err(|_| InvalidUrl)?;
        if !matches!(url.host(), Some(Host::Domain(_)))
            || url.host_str().is_none_or(|h| h.ends_with('.'))
            || !url.username().is_empty()
            || url.password().is_some()
            || url.port().is_some()
        {
            return Err(ForbiddenTarget);
        }
        if !allowed_path(&url) {
            return Err(ForbiddenTarget);
        }
        url.set_scheme("https").map_err(|_| InvalidUrl)?;
        url.set_port(None).map_err(|_| InvalidUrl)?;
        Ok(Self { url })
    }
    pub(super) fn url(&self) -> &Url {
        &self.url
    }
    pub(super) fn source(&self) -> &'static str {
        match self.url.host_str() {
            Some("bookcover.yuewen.com" | "ccportrait.yuewen.com") => "qidian",
            _ => "jjwxc",
        }
    }
}
fn digits(s: &str) -> bool {
    !s.is_empty() && s.bytes().all(|b| b.is_ascii_digit())
}
fn filename(s: &str) -> bool {
    s.rsplit_once('.').is_some_and(|(name, ext)| {
        !name.is_empty()
            && name
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
            && matches!(ext, "jpg" | "jpeg" | "png" | "gif" | "webp")
    })
}
fn allowed_path(url: &Url) -> bool {
    let path: Vec<_> = url.path().split('/').collect();
    if url.host_str() == Some("i9-static.jjwxc.net") {
        if url.path() != "/novelimage.php" {
            return false;
        }
        let mut seen = [false; 3];
        for (key, value) in url.query_pairs() {
            let (index, valid) = match key.as_ref() {
                "novelid" => (0, digits(&value)),
                "coverid" => (1, digits(&value)),
                "ver" => (
                    2,
                    value.len() == 32 && value.bytes().all(|b| b.is_ascii_hexdigit()),
                ),
                _ => return false,
            };
            if seen[index] || !valid {
                return false;
            }
            seen[index] = true;
        }
        return seen.iter().all(|v| *v);
    }
    if url.host_str() == Some("i0-static.jjwxc.net") && url.path() == "/authorimagespace.php" {
        let mut seen = [false; 2];
        for (key, value) in url.query_pairs() {
            let (index, valid) = match key.as_ref() {
                "path" => (
                    0,
                    STANDARD
                        .decode(value.as_bytes())
                        .is_ok_and(|id| !id.is_empty() && id.iter().all(u8::is_ascii_digit)),
                ),
                "imageName" => (1, filename(&value)),
                _ => return false,
            };
            if seen[index] || !valid {
                return false;
            }
            seen[index] = true;
        }
        return seen.iter().all(|v| *v);
    }
    if url.query().is_some() {
        return false;
    }
    match (url.host_str(), path.as_slice()) {
        (Some("bookcover.yuewen.com"), ["", "qdbimg", "349573", id, "180"]) => digits(id),
        (Some("ccportrait.yuewen.com"), ["", "apimg", "349573", id, "100"]) => {
            id.strip_prefix("p_").is_some_and(digits)
        }
        (
            Some("i0-static.jjwxc.net" | "i4-static.jjwxc.net" | "i5-static.jjwxc.net"),
            ["", "tmp", "backend", "authorspace", shard, a, b, c, file],
        ) => {
            shard.strip_prefix('s').is_some_and(digits)
                && [a, b, c].iter().all(|v| digits(v))
                && filename(file)
        }
        (Some("static.jjwxc.net"), ["", "tmp", "guanli", "authordefaultcover", file]) => {
            filename(file)
        }
        _ => false,
    }
}

pub(super) fn is_allowed_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ip) => {
            let value = u32::from(ip);
            const DENIED: [(u32, u32); 15] = [
                (0x00000000, 8),  // 0.0.0.0/8
                (0x0a000000, 8),  // 10.0.0.0/8
                (0x64400000, 10), // 100.64.0.0/10
                (0x7f000000, 8),  // 127.0.0.0/8
                (0xa9fe0000, 16), // 169.254.0.0/16
                (0xac100000, 12), // 172.16.0.0/12
                (0xc0000000, 24), // 192.0.0.0/24
                (0xc0000200, 24), // 192.0.2.0/24
                (0xc0586300, 24), // 192.88.99.0/24
                (0xc0a80000, 16), // 192.168.0.0/16
                (0xc6120000, 15), // 198.18.0.0/15
                (0xc6336400, 24), // 198.51.100.0/24
                (0xcb007100, 24), // 203.0.113.0/24
                (0xe0000000, 4),  // 224.0.0.0/4
                (0xf0000000, 4),  // 240.0.0.0/4
            ];
            !DENIED
                .iter()
                .any(|(base, bits)| value >> (32 - bits) == base >> (32 - bits))
        }
        IpAddr::V6(ip) => {
            let value = u128::from(ip);
            value >> 125 == 1
                && ![
                    (0x2001u128 << 112, 23),
                    (0x20010db8u128 << 96, 32),
                    (0x2002u128 << 112, 16),
                    (0x3fff0u128 << 108, 20),
                ]
                .iter()
                .any(|(base, bits)| value >> (128 - bits) == base >> (128 - bits))
        }
    }
}
