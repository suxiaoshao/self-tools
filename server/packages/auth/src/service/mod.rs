/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-18 01:32:12
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-21 01:01:34
 * @FilePath: /self-tools/server/packages/new_auth/src/impls/mod.rs
 */
use thrift::auth::{
    CheckRequest, ItemServiceCheckException, ItemServiceLoginException, LoginReply, LoginRequest,
};
use tracing::{event, Level};
use volo_thrift::UserError;

use crate::utils::Claims;

pub struct AuthImpl;

impl thrift::auth::ItemService for AuthImpl {
    async fn login(
        &self,
        _req: thrift::auth::LoginRequest,
    ) -> ::core::result::Result<
        thrift::auth::LoginReply,
        ::volo_thrift::error::UserError<thrift::auth::ItemServiceLoginException>,
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
        let auth = Claims::manager_token(username.into(), password.into()).map_err(|err| {
            UserError::UserException(ItemServiceLoginException::Err(thrift::auth::AuthError {
                code: err,
            }))
        })?;
        event!(Level::INFO, "login success");
        Ok(LoginReply { auth: auth.into() })
    }

    async fn check(
        &self,
        _req: thrift::auth::CheckRequest,
    ) -> ::core::result::Result<
        (),
        ::volo_thrift::error::UserError<thrift::auth::ItemServiceCheckException>,
    > {
        let CheckRequest { auth, trace_id } = _req;
        let trace_id = trace_id.as_str();
        let span = tracing::info_span!("check", trace_id);
        let _enter = span.enter();
        event!(Level::INFO, "check start");
        Claims::check_manager(auth.into()).map_err(|err| {
            UserError::UserException(ItemServiceCheckException::Err(thrift::auth::AuthError {
                code: err,
            }))
        })?;
        event!(Level::INFO, "check success");
        Ok(())
    }
}
