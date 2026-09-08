use crate::application::{Error, Result};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use hmac::{Hmac, Mac};
use sha2::{Digest, Sha256};
pub const IDLE: i64 = 30 * 86400;
pub const ABSOLUTE: i64 = 90 * 86400;
pub const RECENT: i64 = 300;
pub fn now() -> i64 {
    time::OffsetDateTime::now_utc().unix_timestamp()
}
pub fn token() -> Result<String> {
    let mut bytes = [0; 32];
    getrandom::fill(&mut bytes).map_err(|_| Error::Unavailable)?;
    Ok(URL_SAFE_NO_PAD.encode(bytes))
}
pub fn hash(token: &str) -> Result<Vec<u8>> {
    let bytes = URL_SAFE_NO_PAD
        .decode(token)
        .map_err(|_| Error::Unauthenticated)?;
    if bytes.len() != 32 {
        return Err(Error::Unauthenticated);
    }
    Ok(Sha256::digest(token.as_bytes()).to_vec())
}
pub fn fingerprint(secret: &[u8], username: &str, password: &str) -> Vec<u8> {
    let mut mac = Hmac::<Sha256>::new_from_slice(secret).expect("HMAC accepts all key lengths");
    for part in [username, password] {
        mac.update(&(part.len() as u64).to_be_bytes());
        mac.update(part.as_bytes());
    }
    mac.finalize().into_bytes().to_vec()
}
pub fn verify(secret: &[u8], expected: &[u8], username: &str, password: &str) -> bool {
    let mut mac = Hmac::<Sha256>::new_from_slice(secret).expect("HMAC accepts all key lengths");
    for part in [username, password] {
        mac.update(&(part.len() as u64).to_be_bytes());
        mac.update(part.as_bytes());
    }
    mac.verify_slice(expected).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn tokens_and_password_fingerprints_have_distinct_boundaries() {
        let a = token().unwrap();
        let b = token().unwrap();
        assert_ne!(a, b);
        assert_eq!(hash(&a).unwrap().len(), 32);
        assert!(hash(&(a + "=")).is_err());
        assert!(hash("legacy.jwt.token").is_err());
        let expected = fingerprint(b"secret", "ab", "c");
        assert!(verify(b"secret", &expected, "ab", "c"));
        assert!(!verify(b"secret", &expected, "a", "bc"));
        assert!(!verify(b"changed", &expected, "ab", "c"));
    }
}
