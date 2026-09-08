use crate::{
    application::{Error, Rejection, Result},
    session,
};
use serde_json::Value;
use std::{
    collections::HashMap,
    time::{Duration, Instant},
};
use uuid::Uuid;
use webauthn_rs::prelude::{PasskeyAuthentication, PasskeyRegistration};
#[derive(Clone, Copy, PartialEq, Eq)]
pub enum Purpose {
    Login,
    Register,
    Reauth,
}
pub enum State {
    Register(PasskeyRegistration, String),
    Authenticate(PasskeyAuthentication, Vec<(Uuid, Value)>),
}
pub struct Ceremony {
    pub purpose: Purpose,
    pub session: Option<Vec<u8>>,
    pub binding: Vec<u8>,
    pub state: State,
    pub expires: Instant,
}
pub struct Budget {
    start: Instant,
    used: u32,
    limit: u32,
}
impl Budget {
    pub fn new(limit: u32) -> Self {
        Self {
            start: Instant::now(),
            used: 0,
            limit,
        }
    }
    pub fn take(&mut self) -> Result<()> {
        if self.start.elapsed() >= Duration::from_secs(60) {
            self.start = Instant::now();
            self.used = 0;
        }
        if self.used >= self.limit {
            return Err(Error::Rejected(Rejection::RateLimited));
        }
        self.used += 1;
        Ok(())
    }
}
pub struct Ceremonies {
    records: HashMap<String, Ceremony>,
    pub budget: Budget,
}
impl Default for Ceremonies {
    fn default() -> Self {
        Self {
            records: HashMap::new(),
            budget: Budget::new(60),
        }
    }
}
impl Ceremonies {
    pub fn insert(&mut self, ceremony: Ceremony) -> Result<String> {
        self.records.retain(|_, c| c.expires > Instant::now());
        if self.records.len() >= 256 {
            return Err(Error::Rejected(Rejection::RateLimited));
        }
        let id = session::token()?;
        self.records.insert(id.clone(), ceremony);
        Ok(id)
    }
    pub fn consume(
        &mut self,
        id: &str,
        binding: &[u8],
        session: Option<&[u8]>,
        purpose: Purpose,
    ) -> Result<State> {
        self.records.retain(|_, c| c.expires > Instant::now());
        let record = self
            .records
            .get(id)
            .ok_or(Error::Rejected(Rejection::CeremonyInvalid))?;
        if record.binding != binding {
            return Err(Error::Rejected(Rejection::CeremonyInvalid));
        }
        let record = self
            .records
            .remove(id)
            .ok_or(Error::Rejected(Rejection::CeremonyInvalid))?;
        if record.purpose != purpose || record.session.as_deref() != session {
            return Err(Error::Rejected(Rejection::CeremonyInvalid));
        }
        Ok(record.state)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn record() -> Ceremony {
        let auth = webauthn_rs::prelude::WebauthnBuilder::new(
            "sushao.top",
            &url::Url::parse("https://sushao.top").unwrap(),
        )
        .unwrap()
        .build()
        .unwrap();
        let (_, state) = auth
            .start_passkey_registration(uuid::Uuid::new_v4(), "test", "test", None)
            .unwrap();
        Ceremony {
            purpose: Purpose::Register,
            session: Some(vec![1; 32]),
            binding: vec![2; 32],
            state: State::Register(state, "Test".into()),
            expires: Instant::now() + Duration::from_secs(300),
        }
    }
    #[test]
    fn ceremonies_expire_and_wrong_purpose_or_session_consumes_them() {
        let mut store = Ceremonies::default();
        let mut expired = record();
        expired.expires = Instant::now();
        let id = store.insert(expired).unwrap();
        assert!(matches!(
            store.consume(&id, &[2; 32], Some(&[1; 32]), Purpose::Register),
            Err(Error::Rejected(Rejection::CeremonyInvalid))
        ));
        let id = store.insert(record()).unwrap();
        assert!(
            store
                .consume(&id, &[2; 32], Some(&[3; 32]), Purpose::Register)
                .is_err()
        );
        assert!(
            store
                .consume(&id, &[2; 32], Some(&[1; 32]), Purpose::Register)
                .is_err()
        );
        let id = store.insert(record()).unwrap();
        assert!(
            store
                .consume(&id, &[2; 32], Some(&[1; 32]), Purpose::Reauth)
                .is_err()
        );
        assert!(
            store
                .consume(&id, &[2; 32], Some(&[1; 32]), Purpose::Register)
                .is_err()
        );
    }
    #[test]
    fn bounded_state_and_attempt_budgets_recover_after_expiry() {
        let mut budget = Budget::new(2);
        assert!(budget.take().is_ok());
        assert!(budget.take().is_ok());
        assert!(matches!(
            budget.take(),
            Err(Error::Rejected(Rejection::RateLimited))
        ));
        budget.start = Instant::now() - Duration::from_secs(60);
        assert!(budget.take().is_ok());
        let mut store = Ceremonies::default();
        for _ in 0..256 {
            store.insert(record()).unwrap();
        }
        assert!(matches!(
            store.insert(record()),
            Err(Error::Rejected(Rejection::RateLimited))
        ));
        for record in store.records.values_mut() {
            record.expires = Instant::now();
        }
        assert!(store.insert(record()).is_ok());
        assert_eq!(store.records.len(), 1);
    }
}
