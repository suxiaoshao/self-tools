use crate::{
    application::{Error, Rejection, Result},
    session::{ABSOLUTE, IDLE, RECENT, now},
};
use diesel::{
    prelude::*,
    r2d2::{ConnectionManager, Pool},
    sql_types::*,
};
use uuid::Uuid;
pub type DbPool = Pool<ConnectionManager<PgConnection>>;
#[derive(QueryableByName)]
pub struct Admin {
    #[diesel(sql_type = SqlUuid)]
    pub user_id: Uuid,
    #[diesel(sql_type = Text)]
    pub username: String,
    #[diesel(sql_type = Binary)]
    pub config_fingerprint: Vec<u8>,
}
type SqlUuid = diesel::sql_types::Uuid;
#[derive(QueryableByName)]
pub struct SessionRow {
    #[diesel(sql_type = SqlUuid)]
    pub user_id: Uuid,
    #[diesel(sql_type = Text)]
    pub username: String,
    #[diesel(sql_type = BigInt)]
    pub last_seen: i64,
    #[diesel(sql_type = BigInt)]
    pub authenticated: i64,
    #[diesel(sql_type = BigInt)]
    pub expires: i64,
}
impl SessionRow {
    pub fn view(&self) -> crate::domain::Session {
        crate::domain::Session {
            user_id: self.user_id.to_string(),
            username: self.username.clone(),
            idle_expires_at: (self.last_seen + IDLE).min(self.expires),
            absolute_expires_at: self.expires,
            recent_authentication_until: self.authenticated + RECENT,
        }
    }
}
#[derive(QueryableByName)]
pub struct KeyRow {
    #[diesel(sql_type = SqlUuid)]
    pub id: Uuid,
    #[diesel(sql_type = Jsonb)]
    pub credential: serde_json::Value,
    #[diesel(sql_type = SmallInt)]
    pub format_version: i16,
    #[diesel(sql_type = Text)]
    pub name: String,
    #[diesel(sql_type = BigInt)]
    pub created: i64,
    #[diesel(sql_type = Nullable<BigInt>)]
    pub used: Option<i64>,
}
impl KeyRow {
    pub fn key(&self) -> Result<webauthn_rs::prelude::Passkey> {
        if self.format_version != 1 {
            return Err(service_errors::Fault::internal("passkey_format_version").into());
        }
        serde_json::from_value(self.credential.clone())
            .map_err(|source| crate::error::fault("passkey_serialization", source))
    }
    pub fn view(&self) -> crate::domain::PasskeyInfo {
        crate::domain::PasskeyInfo {
            id: self.id.to_string(),
            name: self.name.clone(),
            created_at: self.created,
            last_used_at: self.used,
        }
    }
}
const KEY_SELECT: &str = "SELECT id, credential, format_version, name, EXTRACT(EPOCH FROM created_at)::bigint AS created, EXTRACT(EPOCH FROM last_used_at)::bigint AS used FROM auth_passkey";
pub fn keys(db: &mut PgConnection) -> Result<Vec<KeyRow>> {
    Ok(diesel::sql_query(format!("{KEY_SELECT} ORDER BY created_at")).load(db)?)
}
pub fn key(db: &mut PgConnection, id: Uuid) -> Result<KeyRow> {
    diesel::sql_query(format!("{KEY_SELECT} WHERE id = $1 FOR UPDATE"))
        .bind::<SqlUuid, _>(id)
        .get_result(db)
        .optional()?
        .ok_or_else(|| Rejection::NotFound(id.to_string()).into())
}
pub fn check(db: &mut PgConnection, hash: &[u8], recent: bool) -> Result<SessionRow> {
    let row: SessionRow = diesel::sql_query("UPDATE auth_session s SET last_seen_at = to_timestamp($2) FROM auth_admin a WHERE s.token_hash=$1 AND s.user_id=a.user_id AND s.absolute_expires_at > to_timestamp($2) AND s.last_seen_at > to_timestamp($2 - $3) RETURNING s.user_id, a.username, EXTRACT(EPOCH FROM s.last_seen_at)::bigint AS last_seen, EXTRACT(EPOCH FROM s.authenticated_at)::bigint AS authenticated, EXTRACT(EPOCH FROM s.absolute_expires_at)::bigint AS expires")
      .bind::<Binary,_>(hash).bind::<BigInt,_>(now()).bind::<BigInt,_>(IDLE).get_result(db).optional()?.ok_or(Error::Rejected(Rejection::Unauthenticated))?;
    if recent && now() >= row.authenticated + RECENT {
        return Err(Error::Rejected(Rejection::ReauthRequired));
    }
    Ok(row)
}
pub fn logout(db: &mut PgConnection, hash: &[u8]) -> Result<()> {
    diesel::sql_query("DELETE FROM auth_session WHERE token_hash=$1")
        .bind::<Binary, _>(hash)
        .execute(db)?;
    Ok(())
}
pub fn login(
    db: &mut PgConnection,
    user: Uuid,
    key: Option<Uuid>,
    old: Option<&[u8]>,
) -> Result<crate::domain::LoginResult> {
    if let Some(old) = old {
        logout(db, old)?;
    }
    cleanup(db)?;
    let token = crate::session::token()?;
    let hash = crate::session::hash(&token)?;
    let time = now();
    diesel::sql_query("INSERT INTO auth_session (token_hash,user_id,passkey_id,created_at,last_seen_at,authenticated_at,absolute_expires_at) VALUES ($1,$2,$3,to_timestamp($4),to_timestamp($4),to_timestamp($4),to_timestamp($5))")
        .bind::<Binary,_>(&hash).bind::<SqlUuid,_>(user).bind::<Nullable<SqlUuid>,_>(key).bind::<BigInt,_>(time).bind::<BigInt,_>(time+ABSOLUTE).execute(db)?;
    Ok(crate::domain::LoginResult {
        session_token: token,
        session: check(db, &hash, false)?.view(),
    })
}
pub fn reauth(db: &mut PgConnection, hash: &[u8]) -> Result<crate::domain::Session> {
    check(db, hash, false)?;
    diesel::sql_query(
        "UPDATE auth_session SET authenticated_at=to_timestamp($2) WHERE token_hash=$1",
    )
    .bind::<Binary, _>(hash)
    .bind::<BigInt, _>(now())
    .execute(db)?;
    Ok(check(db, hash, false)?.view())
}
pub fn cleanup(db: &mut PgConnection) -> Result<()> {
    diesel::sql_query("DELETE FROM auth_session WHERE absolute_expires_at<=to_timestamp($1) OR last_seen_at<=to_timestamp($1-$2)").bind::<BigInt,_>(now()).bind::<BigInt,_>(IDLE).execute(db)?;
    Ok(())
}
pub fn initialize(db: &mut PgConnection, username: &str, fingerprint: &[u8]) -> Result<Uuid> {
    db.transaction(|db| {
        diesel::sql_query("INSERT INTO auth_admin(singleton,user_id,username,config_fingerprint) VALUES(1,$1,$2,$3) ON CONFLICT(singleton) DO NOTHING").bind::<SqlUuid,_>(Uuid::new_v4()).bind::<Text,_>(username).bind::<Binary,_>(fingerprint).execute(db)?;
        let admin: Admin = diesel::sql_query("SELECT user_id,username,config_fingerprint FROM auth_admin WHERE singleton=1 FOR UPDATE").get_result(db)?;
        if admin.config_fingerprint != fingerprint || admin.username != username {
            diesel::sql_query("DELETE FROM auth_session").execute(db)?;
            diesel::sql_query("UPDATE auth_admin SET username=$1,config_fingerprint=$2 WHERE singleton=1").bind::<Text,_>(username).bind::<Binary,_>(fingerprint).execute(db)?;
        }
        cleanup(db)?;
        for key in keys(db)? { key.key()?; }
        Ok(admin.user_id)
    })
}

pub fn update_key(
    db: &mut PgConnection,
    id: Uuid,
    key: &webauthn_rs::prelude::Passkey,
) -> Result<()> {
    diesel::sql_query(
        "UPDATE auth_passkey SET credential=$2,last_used_at=to_timestamp($3) WHERE id=$1",
    )
    .bind::<SqlUuid, _>(id)
    .bind::<Jsonb, _>(
        serde_json::to_value(key)
            .map_err(|source| crate::error::fault("passkey_serialization", source))?,
    )
    .bind::<BigInt, _>(now())
    .execute(db)?;
    Ok(())
}
pub fn insert_key(
    db: &mut PgConnection,
    id: Uuid,
    user: Uuid,
    key: &webauthn_rs::prelude::Passkey,
    name: &str,
) -> Result<()> {
    diesel::sql_query("INSERT INTO auth_passkey(id,user_id,credential_id,credential,name,created_at) VALUES($1,$2,$3,$4,$5,to_timestamp($6))")
        .bind::<SqlUuid, _>(id)
        .bind::<SqlUuid, _>(user)
        .bind::<Binary, _>(key.cred_id().as_ref())
        .bind::<Jsonb, _>(serde_json::to_value(key).map_err(|source| crate::error::fault("passkey_serialization", source))?)
        .bind::<Text, _>(name)
        .bind::<BigInt, _>(now())
        .execute(db).map_err(|source| match &source {
            diesel::result::Error::DatabaseError(diesel::result::DatabaseErrorKind::UniqueViolation, info)
                if info.constraint_name() == Some("auth_passkey_credential_id_key") => Error::Rejected(Rejection::PasskeyExists),
            _ => source.into(),
        })?;
    Ok(())
}
pub fn rename_key(db: &mut PgConnection, id: Uuid, name: &str) -> Result<()> {
    diesel::sql_query("UPDATE auth_passkey SET name=$2 WHERE id=$1")
        .bind::<SqlUuid, _>(id)
        .bind::<Text, _>(name)
        .execute(db)?;
    Ok(())
}
pub fn delete_key(db: &mut PgConnection, id: Uuid) -> Result<bool> {
    let changed = diesel::sql_query("DELETE FROM auth_passkey WHERE id=$1")
        .bind::<SqlUuid, _>(id)
        .execute(db)?;
    Ok(changed != 0)
}
