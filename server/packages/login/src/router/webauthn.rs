use super::login::LoginInput;
use crate::errors::{response::OpenResponse, OpenError, OpenResult};
use axum::{
    extract::{
        rejection::{ExtensionRejection, JsonRejection},
        State,
    },
    Extension, Json,
};
use middleware::TraceIdExt;
use std::{collections::HashMap, ops::Deref, sync::Arc};
use thrift::{
    auth::{LoginReply, LoginRequest},
    get_client,
};
use tokio::sync::Mutex;
use tower_sessions::Session;
use tracing::{event, Level};
use webauthn_rs::prelude::*;

#[derive(Debug, Clone, Default)]
struct UserStore {
    name_to_id: HashMap<String, Uuid>,
    keys: HashMap<Uuid, Vec<Passkey>>,
}

impl UserStore {
    fn get_user_id(&self, username: &str) -> Uuid {
        self.name_to_id
            .get(username)
            .copied()
            .unwrap_or_else(Uuid::new_v4)
    }
    fn get_exclude_credentials(&self, user_id: Uuid) -> Option<Vec<CredentialID>> {
        self.keys
            .get(&user_id)
            .map(|keys| keys.iter().map(|sk| sk.cred_id().clone()).collect())
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
    async fn get_user_id(&self, username: &str) -> Uuid {
        self.user_store.lock().await.get_user_id(username)
    }
    async fn get_exclude_credentials(&self, user_id: Uuid) -> Option<Vec<CredentialID>> {
        self.user_store
            .lock()
            .await
            .get_exclude_credentials(user_id)
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
}

pub(super) fn get_webauthn() -> OpenResult<Webauthn> {
    let webauthn = WebauthnBuilder::new(
        "sushao.top",
        &Url::parse("https://auth.sushao.top")
            .map_err(|_e| OpenError::UrlParseError("https://auth.sushao.top"))?,
    )?
    .build()?;
    Ok(webauthn)
}

pub async fn start_register(
    State(webauthn_container): State<WebauthnContainer>,
    trace_id: Result<Extension<TraceIdExt>, ExtensionRejection>,
    session: Session,
    json: Result<Json<LoginInput>, JsonRejection>,
) -> OpenResult<OpenResponse<CreationChallengeResponse>> {
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
    let LoginReply { .. } = match client
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
    let user_unique_id = webauthn_container.get_user_id(&username).await;
    let exclude_credentials = webauthn_container
        .get_exclude_credentials(user_unique_id)
        .await;

    let _ = session.remove_value("reg_state").await;

    let (ccr, reg_state) = webauthn_container.start_passkey_registration(
        user_unique_id,
        &username,
        &username,
        exclude_credentials,
    )?;

    session
        .insert("reg_state", (username, user_unique_id, reg_state))
        .await?;
    event!(Level::INFO, "Registration Successful!");
    Ok(OpenResponse::new(ccr))
}

pub(crate) async fn finish_register(
    State(webauthn_container): State<WebauthnContainer>,
    session: Session,
    json: Result<Json<RegisterPublicKeyCredential>, JsonRejection>,
) -> OpenResult<()> {
    // 读取输入信息
    let span = tracing::info_span!("finish register");
    let _enter = span.enter();
    event!(Level::INFO, "finish register start");
    let Json(reg) = json?;
    let (username, user_unique_id, reg_state) = match session.get("reg_state").await? {
        Some((username, user_unique_id, reg_state)) => (username, user_unique_id, reg_state),
        None => {
            event!(Level::ERROR, "No registration state found");
            return Err(OpenError::SessionError(
                "No registration state found".to_string(),
            ));
        }
    };
    event!(Level::INFO, "finish register request: {}", &reg.id);

    let _ = session.remove_value("reg_state").await;

    let sk = webauthn_container.finish_passkey_registration(&reg, &reg_state)?;

    webauthn_container
        .add_user_passkey(user_unique_id, sk.clone())
        .await;
    webauthn_container.add_user(username, user_unique_id).await;
    Ok(())
}
