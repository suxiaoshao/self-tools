//! Application data. Wire representations belong to the service adapter.
#[derive(Clone, Default)]
pub struct Context {
    pub session_token: Option<String>,
}
#[derive(Clone)]
pub struct CeremonyContext {
    pub context: Context,
    pub browser_binding: String,
    pub ceremony_id: Option<String>,
}
pub struct Session {
    pub user_id: String,
    pub username: String,
    pub idle_expires_at: i64,
    pub absolute_expires_at: i64,
    pub recent_authentication_until: i64,
}
pub struct LoginResult {
    pub session_token: String,
    pub session: Session,
}
pub struct PasskeyInfo {
    pub id: String,
    pub name: String,
    pub created_at: i64,
    pub last_used_at: Option<i64>,
}
pub struct Options {
    pub ceremony_id: String,
    pub public_key_json: String,
}
pub struct DeletePasskeyResult {
    pub id: String,
    pub session_invalidated: bool,
}
