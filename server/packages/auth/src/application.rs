use crate::{
    passkey::{Budget, Ceremonies, Ceremony, Purpose, State},
    repository::{self as repo, DbPool},
    session,
};
use diesel::{prelude::*, r2d2::ConnectionManager};
use std::{
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};
use thrift::auth::{CeremonyContext, Context, LoginResult, Options, PasskeyInfo, Session};
use uuid::Uuid;
use webauthn_rs::prelude::*;
#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("unauthenticated")]
    Unauthenticated,
    #[error("recent authentication required")]
    ReauthRequired,
    #[error("authentication failed")]
    AuthenticationFailed,
    #[error("ceremony invalid")]
    CeremonyInvalid,
    #[error("no passkey")]
    NoPasskey,
    #[error("passkey exists")]
    PasskeyExists,
    #[error("invalid request")]
    InvalidRequest,
    #[error("not found")]
    NotFound,
    #[error("rate limited")]
    RateLimited,
    #[error("authentication unavailable")]
    Unavailable,
}
pub type Result<T> = std::result::Result<T, Error>;
impl From<diesel::result::Error> for Error {
    fn from(err: diesel::result::Error) -> Self {
        if matches!(
            err,
            diesel::result::Error::DatabaseError(
                diesel::result::DatabaseErrorKind::UniqueViolation,
                _
            )
        ) {
            Self::PasskeyExists
        } else {
            tracing::error!("authentication database operation failed");
            Self::Unavailable
        }
    }
}
pub struct Application {
    pool: DbPool,
    slots: Arc<tokio::sync::Semaphore>,
    user: Uuid,
    username: String,
    secret: Vec<u8>,
    fingerprint: Vec<u8>,
    webauthn: Webauthn,
    ceremonies: Mutex<Ceremonies>,
    passwords: Mutex<Budget>,
}
impl Application {
    pub fn new() -> anyhow::Result<Arc<Self>> {
        fn env(name: &str) -> anyhow::Result<String> {
            let value = std::env::var(name).map_err(|_| anyhow::anyhow!("{name} required"))?;
            anyhow::ensure!(!value.is_empty(), "{name} must not be empty");
            Ok(value)
        }
        let username = env("USERNAME")?;
        let password = env("PASSWORD")?;
        let secret = env("SECRET")?.into_bytes();
        let fingerprint = session::fingerprint(&secret, &username, &password);
        let pool = DbPool::builder()
            .max_size(4)
            .connection_timeout(Duration::from_secs(5))
            .build(ConnectionManager::<PgConnection>::new(env("AUTH_PG")?))
            .map_err(|_| {
                anyhow::anyhow!("authentication database unavailable; apply migrations first")
            })?;
        service_health::database::check(
            &mut *pool
                .get()
                .map_err(|_| anyhow::anyhow!("authentication database unavailable"))?,
            crate::MIGRATIONS,
        )?;
        let user = repo::initialize(
            &mut *pool
                .get()
                .map_err(|_| anyhow::anyhow!("authentication database unavailable"))?,
            &username,
            &fingerprint,
        )?;
        let origin = url::Url::parse(
            &std::env::var("AUTH_ORIGIN").unwrap_or_else(|_| "https://sushao.top".into()),
        )?;
        anyhow::ensure!(
            origin.scheme() == "https"
                && origin.path() == "/"
                && origin.query().is_none()
                && origin.fragment().is_none()
                && origin.username().is_empty()
                && origin.password().is_none(),
            "AUTH_ORIGIN must be an HTTPS origin"
        );
        let rp = std::env::var("AUTH_RP_ID")
            .unwrap_or_else(|_| origin.host_str().unwrap_or_default().into());
        let webauthn = WebauthnBuilder::new(&rp, &origin)?
            .rp_name("Self Tools")
            .build()?;
        Ok(Arc::new(Self {
            pool,
            slots: Arc::new(tokio::sync::Semaphore::new(4)),
            user,
            username,
            secret,
            fingerprint,
            webauthn,
            ceremonies: Mutex::new(Ceremonies::default()),
            passwords: Mutex::new(Budget::new(10)),
        }))
    }
    pub async fn ready(&self) -> bool {
        service_health::database::ready(self.pool.clone(), crate::MIGRATIONS).await
    }

    pub async fn run<T: Send + 'static>(
        self: &Arc<Self>,
        f: impl FnOnce(&Self, &mut PgConnection) -> Result<T> + Send + 'static,
    ) -> Result<T> {
        let permit = self
            .slots
            .clone()
            .acquire_owned()
            .await
            .map_err(|_| Error::Unavailable)?;
        let this = self.clone();
        tokio::task::spawn_blocking(move || {
            let _permit = permit;
            let mut db = this.pool.get().map_err(|_| Error::Unavailable)?;
            db.transaction::<_, Error, _>(|db| f(&this, db))
        })
        .await
        .map_err(|_| Error::Unavailable)?
    }
    fn password(&self, username: &str, password: &str) -> Result<()> {
        self.passwords
            .lock()
            .map_err(|_| Error::Unavailable)?
            .take()?;
        if !session::verify(&self.secret, &self.fingerprint, username, password) {
            return Err(Error::AuthenticationFailed);
        }
        Ok(())
    }
    pub fn check(&self, db: &mut PgConnection, ctx: &Context) -> Result<Session> {
        Ok(repo::check(db, &session_hash(ctx)?, false)?.view())
    }
    pub fn login_password(
        &self,
        db: &mut PgConnection,
        ctx: &Context,
        username: &str,
        password: &str,
    ) -> Result<LoginResult> {
        self.password(username, password)?;
        repo::login(db, self.user, None, optional_hash(ctx)?.as_deref())
    }
    pub fn logout(&self, db: &mut PgConnection, ctx: &Context) -> Result<()> {
        if let Some(hash) = optional_hash(ctx)? {
            repo::logout(db, &hash)?;
        }
        Ok(())
    }
    pub fn reauth_password(
        &self,
        db: &mut PgConnection,
        ctx: &Context,
        password: &str,
    ) -> Result<Session> {
        let hash = session_hash(ctx)?;
        repo::check(db, &hash, false)?;
        self.password(&self.username, password)?;
        repo::reauth(db, &hash)
    }
    pub fn list_passkeys(&self, db: &mut PgConnection, ctx: &Context) -> Result<Vec<PasskeyInfo>> {
        repo::check(db, &session_hash(ctx)?, false)?;
        Ok(repo::keys(db)?.iter().map(|k| k.view()).collect())
    }
    pub fn begin(
        &self,
        db: &mut PgConnection,
        ctx: &CeremonyContext,
        purpose: Purpose,
        name: Option<&str>,
    ) -> Result<Options> {
        if ctx.ceremony_id.is_some() {
            return Err(Error::InvalidRequest);
        }
        let binding =
            session::hash(ctx.browser_binding.as_str()).map_err(|_| Error::CeremonyInvalid)?;
        let hash = if purpose == Purpose::Login {
            None
        } else {
            let hash = session_hash(&ctx.context)?;
            repo::check(db, &hash, purpose == Purpose::Register)?;
            Some(hash)
        };
        self.ceremonies
            .lock()
            .map_err(|_| Error::Unavailable)?
            .budget
            .take()?;
        let rows = repo::keys(db)?;
        let keys = rows.iter().map(|k| k.key()).collect::<Result<Vec<_>>>()?;
        let (options, state) = if purpose == Purpose::Register {
            let name = valid_name(name.ok_or(Error::InvalidRequest)?)?;
            let (options, state) = self
                .webauthn
                .start_passkey_registration(
                    self.user,
                    &self.username,
                    &self.username,
                    Some(keys.iter().map(|k| k.cred_id().clone()).collect()),
                )
                .map_err(|_| Error::Unavailable)?;
            (
                serde_json::to_string(&options).map_err(|_| Error::Unavailable)?,
                State::Register(state, name),
            )
        } else {
            if keys.is_empty() {
                return Err(Error::NoPasskey);
            }
            let (options, state) = self
                .webauthn
                .start_passkey_authentication(&keys)
                .map_err(|_| Error::Unavailable)?;
            (
                serde_json::to_string(&options).map_err(|_| Error::Unavailable)?,
                State::Authenticate(
                    state,
                    rows.into_iter().map(|r| (r.id, r.credential)).collect(),
                ),
            )
        };
        let id = self
            .ceremonies
            .lock()
            .map_err(|_| Error::Unavailable)?
            .insert(Ceremony {
                purpose,
                session: hash,
                binding,
                state,
                expires: Instant::now() + Duration::from_secs(300),
            })?;
        Ok(Options {
            ceremony_id: id.into(),
            public_key_json: options.into(),
        })
    }
    fn consume(
        &self,
        db: &mut PgConnection,
        ctx: &CeremonyContext,
        purpose: Purpose,
    ) -> Result<State> {
        let binding =
            session::hash(ctx.browser_binding.as_str()).map_err(|_| Error::CeremonyInvalid)?;
        let hash = if purpose == Purpose::Login {
            None
        } else {
            Some(session_hash(&ctx.context)?)
        };
        let state = self
            .ceremonies
            .lock()
            .map_err(|_| Error::Unavailable)?
            .consume(
                ctx.ceremony_id
                    .as_ref()
                    .ok_or(Error::CeremonyInvalid)?
                    .as_str(),
                &binding,
                hash.as_deref(),
                purpose,
            )?;
        if let Some(hash) = hash {
            repo::check(db, &hash, purpose == Purpose::Register)?;
        }
        Ok(state)
    }
    fn authenticate(
        &self,
        db: &mut PgConnection,
        ctx: &CeremonyContext,
        purpose: Purpose,
        json: &str,
    ) -> Result<Uuid> {
        let State::Authenticate(state, snapshots) = self.consume(db, ctx, purpose)? else {
            return Err(Error::CeremonyInvalid);
        };
        let credential: PublicKeyCredential =
            serde_json::from_str(json).map_err(|_| Error::InvalidRequest)?;
        let result = self
            .webauthn
            .finish_passkey_authentication(&credential, &state)
            .map_err(|_| Error::AuthenticationFailed)?;
        // Lock and compare the full persisted credential before applying the result. A
        // concurrent update requires a fresh ceremony, so stale counters cannot win.
        for (id, snapshot) in snapshots {
            let snapshot_key: Passkey =
                serde_json::from_value(snapshot.clone()).map_err(|_| Error::Unavailable)?;
            if snapshot_key.cred_id() != result.cred_id() {
                continue;
            }
            let row = repo::key(db, id).map_err(|e| {
                if matches!(e, Error::NotFound) {
                    Error::AuthenticationFailed
                } else {
                    e
                }
            })?;
            if row.credential != snapshot {
                return Err(Error::CeremonyInvalid);
            }
            let mut key = row.key()?;
            key.update_credential(&result)
                .ok_or(Error::AuthenticationFailed)?;
            repo::update_key(db, id, &key)?;
            return Ok(id);
        }
        Err(Error::AuthenticationFailed)
    }
    pub fn finish_login(
        &self,
        db: &mut PgConnection,
        ctx: &CeremonyContext,
        json: &str,
    ) -> Result<LoginResult> {
        let key = self.authenticate(db, ctx, Purpose::Login, json)?;
        repo::login(
            db,
            self.user,
            Some(key),
            optional_hash(&ctx.context)?.as_deref(),
        )
    }
    pub fn finish_reauth(
        &self,
        db: &mut PgConnection,
        ctx: &CeremonyContext,
        json: &str,
    ) -> Result<Session> {
        self.authenticate(db, ctx, Purpose::Reauth, json)?;
        repo::reauth(db, &session_hash(&ctx.context)?)
    }
    pub fn finish_registration(
        &self,
        db: &mut PgConnection,
        ctx: &CeremonyContext,
        json: &str,
    ) -> Result<PasskeyInfo> {
        let State::Register(state, name) = self.consume(db, ctx, Purpose::Register)? else {
            return Err(Error::CeremonyInvalid);
        };
        let credential: RegisterPublicKeyCredential =
            serde_json::from_str(json).map_err(|_| Error::InvalidRequest)?;
        let key = self
            .webauthn
            .finish_passkey_registration(&credential, &state)
            .map_err(|_| Error::AuthenticationFailed)?;
        let id = Uuid::new_v4();
        repo::insert_key(db, id, self.user, &key, &name)?;
        Ok(repo::key(db, id)?.view())
    }
    pub fn rename_passkey(
        &self,
        db: &mut PgConnection,
        ctx: &Context,
        id: &str,
        name: &str,
    ) -> Result<PasskeyInfo> {
        repo::check(db, &session_hash(ctx)?, true)?;
        let id = Uuid::parse_str(id).map_err(|_| Error::InvalidRequest)?;
        let name = valid_name(name)?;
        repo::key(db, id)?;
        repo::rename_key(db, id, &name)?;
        Ok(repo::key(db, id)?.view())
    }
    pub fn delete_passkey(&self, db: &mut PgConnection, ctx: &Context, id: &str) -> Result<bool> {
        let hash = session_hash(ctx)?;
        repo::check(db, &hash, true)?;
        let id = Uuid::parse_str(id).map_err(|_| Error::InvalidRequest)?;
        repo::key(db, id)?;
        repo::delete_key(db, id)?;
        match repo::check(db, &hash, false) {
            Ok(_) => Ok(false),
            Err(Error::Unauthenticated) => Ok(true),
            Err(e) => Err(e),
        }
    }
}
fn optional_hash(ctx: &Context) -> Result<Option<Vec<u8>>> {
    ctx.session_token
        .as_ref()
        .map(|s| session::hash(s.as_str()))
        .transpose()
}
fn session_hash(ctx: &Context) -> Result<Vec<u8>> {
    optional_hash(ctx)?.ok_or(Error::Unauthenticated)
}
fn valid_name(name: &str) -> Result<String> {
    let name = name.trim();
    if !(1..=64).contains(&name.chars().count()) {
        return Err(Error::InvalidRequest);
    }
    Ok(name.into())
}

#[cfg(test)]
mod tests;
