use crate::errors::ApiError;
use axum::{
    Json, Router,
    body::to_bytes,
    extract::{Request, State},
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{any, get},
};
use base64::{Engine, engine::general_purpose::URL_SAFE_NO_PAD};
use middleware::auth_http::{self, CEREMONY_COOKIE, SESSION_COOKIE};
use serde_json::{Value, json};
use thrift::auth::*;
use volo_thrift::MaybeException;
macro_rules! rpc {
    ($call:expr) => {
        match $call.await? {
            MaybeException::Ok(v) => v,
            MaybeException::Exception(e) => return Err(e.into()),
        }
    };
}
pub(crate) fn get_router() -> anyhow::Result<Router> {
    let origin =
        auth_http::configured_origin().map_err(|_| anyhow::anyhow!("invalid AUTH_ORIGIN"))?;
    Ok(Router::new()
        .route(
            "/health/ready",
            get(|| async {
                if service_health::auth_ready().await {
                    StatusCode::NO_CONTENT
                } else {
                    StatusCode::SERVICE_UNAVAILABLE
                }
            }),
        )
        .route("/api/auth/{*path}", any(handle))
        .with_state(origin))
}
fn text<'a>(body: &'a Value, key: &str) -> Result<&'a str, ApiError> {
    body.get(key)
        .and_then(Value::as_str)
        .ok_or_else(ApiError::invalid)
}
fn timestamp(value: i64) -> String {
    time::OffsetDateTime::from_unix_timestamp(value)
        .ok()
        .and_then(|v| {
            v.format(&time::format_description::well_known::Rfc3339)
                .ok()
        })
        .unwrap_or_default()
}
fn session_view(v: Session) -> Value {
    json!({"user":{"id":v.user_id.as_str(),"username":v.username.as_str()},"idleExpiresAt":timestamp(v.idle_expires_at),"absoluteExpiresAt":timestamp(v.absolute_expires_at),"recentAuthenticationUntil":timestamp(v.recent_authentication_until)})
}
fn passkey_view(v: PasskeyInfo) -> Value {
    json!({"id":v.id.as_str(),"name":v.name.as_str(),"createdAt":timestamp(v.created_at),"lastUsedAt":v.last_used_at.map(timestamp)})
}
fn options_view(v: Options) -> Result<Value, ApiError> {
    Ok(
        json!({"ceremonyId":v.ceremony_id.as_str(),"publicKey":serde_json::from_str::<Value>(v.public_key_json.as_str()).map_err(|_|ApiError::unavailable())?.get("publicKey").ok_or_else(ApiError::unavailable)?}),
    )
}
async fn handle(State(origin): State<String>, req: Request) -> Result<Response, ApiError> {
    let method = req.method().clone();
    let path = req.uri().path().trim_start_matches("/api/auth/").to_owned();
    auth_http::validate_request(req.headers(), &method, &origin)
        .map_err(|_| ApiError::rejected())?;
    let session =
        auth_http::cookie(req.headers(), SESSION_COOKIE).map_err(|_| ApiError::rejected())?;
    let binding =
        auth_http::cookie(req.headers(), CEREMONY_COOKIE).map_err(|_| ApiError::rejected())?;
    let ctx = Context {
        session_token: session.map(Into::into),
        trace_id: req
            .headers()
            .get("trace-id")
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_owned()
            .into(),
    };
    let bytes = to_bytes(req.into_body(), 64 * 1024)
        .await
        .map_err(|_| ApiError::invalid())?;
    let body = if method == Method::GET {
        Value::Null
    } else {
        serde_json::from_slice::<Value>(&bytes).map_err(|_| ApiError::invalid())?
    };
    let client = thrift::get_client()?;
    let mut cookies = Vec::new();
    let mut status = StatusCode::OK;
    let data = match (method.as_str(), path.as_str()) {
        ("GET", "session") => match client.check(ctx).await? {
            MaybeException::Ok(v) => session_view(v),
            MaybeException::Exception(AuthServiceCheckException::Err(e))
                if e.code == FailureCode::UNAUTHENTICATED =>
            {
                Value::Null
            }
            MaybeException::Exception(e) => return Err(e.into()),
        },
        ("POST", "password/login") => {
            let result = rpc!(client.login_password(
                ctx,
                text(&body, "username")?.to_owned().into(),
                text(&body, "password")?.to_owned().into()
            ));
            cookies.push(auth_http::set_cookie(
                SESSION_COOKIE,
                result.session_token.as_str(),
                result.session.absolute_expires_at
                    - time::OffsetDateTime::now_utc().unix_timestamp(),
            ));
            session_view(result.session)
        }
        ("POST", "logout") => {
            rpc!(client.logout(ctx));
            cookies.push(auth_http::set_cookie(SESSION_COOKIE, "", 0));
            status = StatusCode::NO_CONTENT;
            Value::Null
        }
        ("POST", "reauth/password") => session_view(rpc!(
            client.reauth_password(ctx, text(&body, "password")?.to_owned().into())
        )),
        ("GET", "passkeys") => Value::Array(
            rpc!(client.list_passkeys(ctx))
                .into_iter()
                .map(passkey_view)
                .collect(),
        ),
        ("POST", "passkey/login/options" | "reauth/passkey/options" | "passkeys/options") => {
            let binding = match binding {
                Some(v) => v,
                None => {
                    let mut bytes = [0; 32];
                    getrandom::fill(&mut bytes).map_err(|_| ApiError::unavailable())?;
                    URL_SAFE_NO_PAD.encode(bytes)
                }
            };
            let ceremony = CeremonyContext {
                context: ctx,
                browser_binding: binding.clone().into(),
                ceremony_id: None,
            };
            let options = match path.as_str() {
                "passkey/login/options" => rpc!(client.begin_login(ceremony)),
                "reauth/passkey/options" => rpc!(client.begin_reauth(ceremony)),
                _ => rpc!(
                    client.begin_registration(ceremony, text(&body, "name")?.to_owned().into())
                ),
            };
            cookies.push(auth_http::set_cookie(CEREMONY_COOKIE, &binding, 300));
            options_view(options)?
        }
        ("POST", "passkey/login/finish" | "reauth/passkey/finish" | "passkeys/finish") => {
            let ceremony = CeremonyContext {
                context: ctx,
                browser_binding: binding
                    .ok_or(ApiError(StatusCode::BAD_REQUEST, "CEREMONY_INVALID", None))?
                    .into(),
                ceremony_id: Some(text(&body, "ceremonyId")?.to_owned().into()),
            };
            let credential =
                serde_json::to_string(body.get("credential").ok_or_else(ApiError::invalid)?)
                    .map_err(|_| ApiError::invalid())?;
            match path.as_str() {
                "passkey/login/finish" => {
                    let result = rpc!(client.finish_login(ceremony, credential.into()));
                    cookies.push(auth_http::set_cookie(
                        SESSION_COOKIE,
                        result.session_token.as_str(),
                        result.session.absolute_expires_at
                            - time::OffsetDateTime::now_utc().unix_timestamp(),
                    ));
                    session_view(result.session)
                }
                "reauth/passkey/finish" => {
                    session_view(rpc!(client.finish_reauth(ceremony, credential.into())))
                }
                _ => {
                    status = StatusCode::CREATED;
                    passkey_view(rpc!(
                        client.finish_registration(ceremony, credential.into())
                    ))
                }
            }
        }
        ("PATCH", p) if p.starts_with("passkeys/") => passkey_view(rpc!(client.rename_passkey(
            ctx,
            p.trim_start_matches("passkeys/").to_owned().into(),
            text(&body, "name")?.to_owned().into()
        ))),
        ("DELETE", p) if p.starts_with("passkeys/") => {
            if rpc!(client.delete_passkey(ctx, p.trim_start_matches("passkeys/").to_owned().into()))
            {
                cookies.push(auth_http::set_cookie(SESSION_COOKIE, "", 0));
            }
            status = StatusCode::NO_CONTENT;
            Value::Null
        }
        _ => return Err(ApiError(StatusCode::NOT_FOUND, "NOT_FOUND", None)),
    };
    let mut response = if status == StatusCode::NO_CONTENT {
        status.into_response()
    } else {
        (status, Json(json!({"data":data}))).into_response()
    };
    response
        .headers_mut()
        .insert("cache-control", "no-store".parse().unwrap());
    for cookie in cookies {
        response.headers_mut().append(
            "set-cookie",
            cookie.parse().map_err(|_| ApiError::unavailable())?,
        );
    }
    Ok(response)
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn public_session_and_options_only_expose_public_contract() {
        let view = session_view(Session {
            user_id: "admin".into(),
            username: "name".into(),
            idle_expires_at: 100,
            absolute_expires_at: 200,
            recent_authentication_until: 50,
        });
        assert_eq!(view["user"]["id"], "admin");
        assert_eq!(view.as_object().unwrap().len(), 4);
        assert!(view.get("sessionToken").is_none());
        let options = options_view(Options {
            ceremony_id: "public-id".into(),
            public_key_json:
                r#"{"publicKey":{"challenge":"public-challenge"},"mediation":"optional"}"#.into(),
        })
        .unwrap();
        assert_eq!(options["publicKey"]["challenge"], "public-challenge");
        assert!(options.get("mediation").is_none());
    }
}
