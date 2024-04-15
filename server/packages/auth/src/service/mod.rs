/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-18 01:32:12
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-04-14 10:07:00
 * @FilePath: /self-tools/server/packages/new_auth/src/impls/mod.rs
 */
use thrift::auth::{
    CheckRequest, ItemServiceCheckException, ItemServiceLoginException, LoginReply, LoginRequest,
};
use tracing::{event, Level};
use volo_thrift::MaybeException;

use crate::utils::Claims;

pub struct AuthImpl;

impl thrift::auth::ItemService for AuthImpl {
    async fn login(
        &self,
        _req: thrift::auth::LoginRequest,
    ) -> Result<
        volo_thrift::MaybeException<LoginReply, ItemServiceLoginException>,
        volo_thrift::ServerError,
    > {
        let LoginRequest {
            username,
            password,
            trace_id,
        } = _req;
        let trace_id = trace_id.as_str();
        let span = tracing::info_span!("login", trace_id);
        let _enter = span.enter();
        event!(Level::INFO, "login start");
        event!(Level::INFO, "login request: {}", &username);
        let auth = match Claims::manager_token(username.into(), password.into()) {
            Ok(auth) => auth,
            Err(err) => {
                event!(Level::ERROR, "login failed: {}", err.inner());
                return Ok(MaybeException::Exception(ItemServiceLoginException::Err(
                    thrift::auth::AuthError { code: err },
                )));
            }
        };
        event!(Level::INFO, "login success");
        Ok(MaybeException::Ok(LoginReply { auth: auth.into() }))
    }

    async fn check(
        &self,
        _req: thrift::auth::CheckRequest,
    ) -> Result<volo_thrift::MaybeException<(), ItemServiceCheckException>, volo_thrift::ServerError>
    {
        let CheckRequest { auth, trace_id } = _req;
        let trace_id = trace_id.as_str();
        let span = tracing::info_span!("check", trace_id);
        let _enter = span.enter();
        event!(Level::INFO, "check start");
        match Claims::check_manager(auth.into()) {
            Ok(_) => {}
            Err(err) => {
                event!(Level::ERROR, "check failed: {}", err.inner());
                return Ok(MaybeException::Exception(ItemServiceCheckException::Err(
                    thrift::auth::AuthError { code: err },
                )));
            }
        };
        event!(Level::INFO, "check success");
        Ok(MaybeException::Ok(()))
    }
}
