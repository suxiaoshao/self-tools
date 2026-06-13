use super::login::LoginInput;
use crate::errors::{OpenError, OpenResult, response::OpenResponse};
use axum::{
    Extension, Json,
    extract::{
        State,
        rejection::{ExtensionRejection, JsonRejection},
    },
    http::{
        HeaderMap, HeaderValue,
        header::{COOKIE, SET_COOKIE},
    },
    response::{IntoResponse, Response},
};
use middleware::TraceIdExt;
use std::{collections::HashMap, fmt::Debug, ops::Deref, sync::Arc};
use thrift::{
    auth::{LoginReply, LoginRequest},
    get_client,
};
use tokio::sync::Mutex;
use tracing::{Level, event};
use webauthn_rs::prelude::*;

const SESSION_COOKIE_NAME: &str = "webauthnrs";
const SESSION_MAX_AGE_SECONDS: u64 = 360;

type RegistrationSessionState = (String, Uuid, PasskeyRegistration, String);
type AuthenticationSessionState = (Uuid, PasskeyAuthentication);

#[derive(Debug, Default)]
struct UserStore {
    name_to_id: HashMap<String, Uuid>,
    keys: HashMap<Uuid, Vec<Passkey>>,
    auths: HashMap<Uuid, String>,
    reg_states: HashMap<String, RegistrationSessionState>,
    auth_states: HashMap<String, AuthenticationSessionState>,
}

impl UserStore {
    fn get_user_id_or_insert(&self, username: &str) -> Uuid {
        self.name_to_id
            .get(username)
            .copied()
            .unwrap_or_else(Uuid::new_v4)
    }
    fn get_user_id(&self, username: &str) -> Option<Uuid> {
        self.name_to_id.get(username).copied()
    }
    fn get_exclude_credentials(&self, user_id: Uuid) -> Option<Vec<CredentialID>> {
        self.keys
            .get(&user_id)
            .map(|keys| keys.iter().map(|sk| sk.cred_id().clone()).collect())
    }
    fn get_allow_credentials(&self, user_id: Uuid) -> Option<Vec<Passkey>> {
        self.keys.get(&user_id).cloned()
    }
    fn get_authenticator(&self, user_id: Uuid) -> Option<String> {
        self.auths.get(&user_id).cloned()
    }
    fn add_user_passkey(&mut self, user_id: Uuid, passkey: Passkey) {
        self.keys
            .entry(user_id)
            .and_modify(|keys| keys.push(passkey.clone()))
            .or_insert_with(|| vec![passkey]);
    }
    fn add_user(&mut self, username: String, user_id: Uuid) {
        self.name_to_id.insert(username, user_id);
    }
    fn add_user_auth(&mut self, user_id: Uuid, auth: String) {
        self.auths.insert(user_id, auth);
    }
    fn update_by_auth_result(&mut self, user_id: Uuid, auth_result: &AuthenticationResult) {
        if let Some(keys) = self.keys.get_mut(&user_id) {
            keys.iter_mut().for_each(|sk| {
                sk.update_credential(auth_result);
            });
        }
    }
    fn set_reg_state(&mut self, session_id: String, state: RegistrationSessionState) {
        self.reg_states.insert(session_id, state);
    }
    fn take_reg_state(&mut self, session_id: &str) -> Option<RegistrationSessionState> {
        self.reg_states.remove(session_id)
    }
    fn set_auth_state(&mut self, session_id: String, state: AuthenticationSessionState) {
        self.auth_states.insert(session_id, state);
    }
    fn take_auth_state(&mut self, session_id: &str) -> Option<AuthenticationSessionState> {
        self.auth_states.remove(session_id)
    }
}

#[derive(Clone)]
pub(crate) struct WebauthnContainer {
    webauthn: Webauthn,
    user_store: Arc<Mutex<UserStore>>,
}

impl Deref for WebauthnContainer {
    type Target = Webauthn;

    fn deref(&self) -> &Self::Target {
        &self.webauthn
    }
}

impl WebauthnContainer {
    pub(crate) fn new() -> OpenResult<Self> {
        let webauthn = get_webauthn()?;
        Ok(Self {
            webauthn,
            user_store: Default::default(),
        })
    }
    async fn get_user_id_or_insert(&self, username: &str) -> Uuid {
        self.user_store.lock().await.get_user_id_or_insert(username)
    }
    async fn get_user_id(&self, username: &str) -> Option<Uuid> {
        self.user_store.lock().await.get_user_id(username)
    }
    async fn get_authenticator(&self, user_id: Uuid) -> Option<String> {
        self.user_store.lock().await.get_authenticator(user_id)
    }
    async fn get_exclude_credentials(&self, user_id: Uuid) -> Option<Vec<CredentialID>> {
        self.user_store
            .lock()
            .await
            .get_exclude_credentials(user_id)
    }
    async fn get_allowed_credentials(&self, user_id: Uuid) -> Option<Vec<Passkey>> {
        self.user_store.lock().await.get_allow_credentials(user_id)
    }
    async fn add_user_passkey(&self, user_id: Uuid, passkey: Passkey) {
        self.user_store
            .lock()
            .await
            .add_user_passkey(user_id, passkey);
    }
    async fn add_user(&self, username: String, user_id: Uuid) {
        self.user_store.lock().await.add_user(username, user_id);
    }
    async fn add_user_auth(&self, user_id: Uuid, auth: String) {
        self.user_store.lock().await.add_user_auth(user_id, auth);
    }
    async fn update_by_auth_result(&self, user_id: Uuid, auth_result: &AuthenticationResult) {
        self.user_store
            .lock()
            .await
            .update_by_auth_result(user_id, auth_result);
    }
    async fn set_reg_state(&self, session_id: String, state: RegistrationSessionState) {
        self.user_store
            .lock()
            .await
            .set_reg_state(session_id, state);
    }
    async fn take_reg_state(&self, session_id: &str) -> Option<RegistrationSessionState> {
        self.user_store.lock().await.take_reg_state(session_id)
    }
    async fn set_auth_state(&self, session_id: String, state: AuthenticationSessionState) {
        self.user_store
            .lock()
            .await
            .set_auth_state(session_id, state);
    }
    async fn take_auth_state(&self, session_id: &str) -> Option<AuthenticationSessionState> {
        self.user_store.lock().await.take_auth_state(session_id)
    }
}

fn session_id_from_headers(headers: &HeaderMap) -> Option<String> {
    headers
        .get(COOKIE)
        .and_then(|value| value.to_str().ok())
        .and_then(|cookies| {
            cookies.split(';').find_map(|cookie| {
                let (name, value) = cookie.trim().split_once('=')?;
                if name == SESSION_COOKIE_NAME && Uuid::parse_str(value).is_ok() {
                    Some(value.to_owned())
                } else {
                    None
                }
            })
        })
}

fn get_or_create_session_id(headers: &HeaderMap) -> String {
    session_id_from_headers(headers).unwrap_or_else(|| Uuid::new_v4().to_string())
}

fn required_session_id(headers: &HeaderMap) -> OpenResult<String> {
    session_id_from_headers(headers)
        .ok_or_else(|| OpenError::SessionError("No session found".to_string()))
}

fn response_with_session<T: serde::Serialize + Debug>(
    session_id: &str,
    response: OpenResponse<T>,
) -> OpenResult<Response> {
    let cookie = format!(
        "{SESSION_COOKIE_NAME}={session_id}; Path=/; Max-Age={SESSION_MAX_AGE_SECONDS}; SameSite=Strict; HttpOnly"
    );
    let mut response = response.into_response();
    response
        .headers_mut()
        .insert(SET_COOKIE, HeaderValue::from_str(&cookie)?);
    Ok(response)
}

pub(super) fn get_webauthn() -> OpenResult<Webauthn> {
    let webauthn = WebauthnBuilder::new(
        "sushao.top",
        &Url::parse("https://sushao.top")
            .map_err(|_e| OpenError::UrlParseError("https://auth.sushao.top"))?,
    )?
    .allow_any_port(true)
    .allow_subdomains(true)
    .build()?;
    Ok(webauthn)
}

pub async fn start_register(
    State(webauthn_container): State<WebauthnContainer>,
    trace_id: Result<Extension<TraceIdExt>, ExtensionRejection>,
    headers: HeaderMap,
    json: Result<Json<LoginInput>, JsonRejection>,
) -> OpenResult<Response> {
    // 读取输入信息
    let span = tracing::info_span!("start register");
    let _enter = span.enter();
    event!(Level::INFO, "start register start");
    let trace_id = trace_id.map(|x| x.0).map(|x| x.0)?;
    let Json(LoginInput { username, password }) = json?;
    event!(Level::INFO, "start register request: {}", &username);

    // 验证用户账号密码
    let client = get_client()?;
    event!(Level::INFO, "rpc login call");
    let LoginReply { auth } = match client
        .login(LoginRequest {
            username: username.clone().into(),
            password: password.into(),
            trace_id: trace_id.into(),
        })
        .await?
    {
        volo_thrift::MaybeException::Ok(data) => data,
        volo_thrift::MaybeException::Exception(err) => return Err(err.into()),
    };

    // 获取用户ID
    let user_unique_id = webauthn_container.get_user_id_or_insert(&username).await;
    let exclude_credentials = webauthn_container
        .get_exclude_credentials(user_unique_id)
        .await;

    let (ccr, reg_state) = webauthn_container.start_passkey_registration(
        user_unique_id,
        &username,
        &username,
        exclude_credentials,
    )?;
    event!(Level::INFO, "webauthn registration started");

    let session_id = get_or_create_session_id(&headers);
    webauthn_container
        .set_reg_state(
            session_id.clone(),
            (username, user_unique_id, reg_state, auth.to_string()),
        )
        .await;
    event!(Level::INFO, "Registration Successful!");
    response_with_session(&session_id, OpenResponse::new(ccr))
}

pub(crate) async fn finish_register(
    State(webauthn_container): State<WebauthnContainer>,
    headers: HeaderMap,
    json: Result<Json<RegisterPublicKeyCredential>, JsonRejection>,
) -> OpenResult<Response> {
    // 读取输入信息
    let span = tracing::info_span!("finish register");
    let _enter = span.enter();
    event!(Level::INFO, "finish register start");
    let Json(reg) = json?;
    let session_id = required_session_id(&headers)?;
    let (username, user_unique_id, reg_state, auth): (_, _, _, String) =
        match webauthn_container.take_reg_state(&session_id).await {
            Some((username, user_unique_id, reg_state, auth)) => {
                (username, user_unique_id, reg_state, auth)
            }
            None => {
                event!(Level::ERROR, "No registration state found");
                return Err(OpenError::SessionError(
                    "No registration state found".to_string(),
                ));
            }
        };
    event!(Level::INFO, "finish register request: {}", &reg.id);

    let sk = webauthn_container.finish_passkey_registration(&reg, &reg_state)?;
    event!(Level::INFO, "finish register success");

    webauthn_container
        .add_user_passkey(user_unique_id, sk.clone())
        .await;
    webauthn_container.add_user(username, user_unique_id).await;
    webauthn_container
        .add_user_auth(user_unique_id, auth.clone())
        .await;
    Ok(OpenResponse::new(auth).into_response())
}

#[derive(serde::Deserialize)]
pub(super) struct AuthenticationInput {
    username: String,
}

pub(super) async fn start_authentication(
    State(webauthn_container): State<WebauthnContainer>,
    headers: HeaderMap,
    json: Result<Json<AuthenticationInput>, JsonRejection>,
) -> OpenResult<Response> {
    // 读取输入信息
    let span = tracing::info_span!("start authentication");
    let _enter = span.enter();
    event!(Level::INFO, "start authentication start");
    let Json(auth) = json?;
    let username = auth.username;

    let user_unique_id = webauthn_container
        .get_user_id(&username)
        .await
        .ok_or(OpenError::WebauthnUserNotExist)?;
    let allow_credentials = webauthn_container
        .get_allowed_credentials(user_unique_id)
        .await
        .ok_or(OpenError::UserHasNoCredentials)?;

    let (rcr, auth_state) = webauthn_container.start_passkey_authentication(&allow_credentials)?;
    event!(Level::INFO, "start authentication success");
    let session_id = get_or_create_session_id(&headers);
    webauthn_container
        .set_auth_state(session_id.clone(), (user_unique_id, auth_state))
        .await;
    response_with_session(&session_id, OpenResponse::new(rcr))
}

pub(super) async fn finish_authentication(
    State(webauthn_container): State<WebauthnContainer>,
    headers: HeaderMap,
    json: Result<Json<PublicKeyCredential>, JsonRejection>,
) -> OpenResult<Response> {
    // 读取输入信息
    let span = tracing::info_span!("finish authentication");
    let _enter = span.enter();
    event!(Level::INFO, "finish authentication start");
    let session_id = required_session_id(&headers)?;
    let (user_unique_id, auth_state): (Uuid, PasskeyAuthentication) =
        match webauthn_container.take_auth_state(&session_id).await {
            Some((user_unique_id, auth_state)) => (user_unique_id, auth_state),
            None => {
                event!(Level::ERROR, "No registration state found");
                return Err(OpenError::SessionError(
                    "No registration state found".to_string(),
                ));
            }
        };
    let auth = json?.0;

    let auth_result = webauthn_container.finish_passkey_authentication(&auth, &auth_state)?;
    webauthn_container
        .update_by_auth_result(user_unique_id, &auth_result)
        .await;

    let auth = webauthn_container
        .get_authenticator(user_unique_id)
        .await
        .ok_or(OpenError::WebauthnAuthNotSet)?;

    Ok(OpenResponse::new(auth).into_response())
}
