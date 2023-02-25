use proto::auth::{login_server::Login, CheckRequest, Empty, LoginReply, LoginRequest};
use tonic::{async_trait, Request, Response, Status};
use tracing::{event, Level};

use crate::utils::Claims;

pub struct LoginGreeter;

#[async_trait]
impl Login for LoginGreeter {
    async fn login(&self, request: Request<LoginRequest>) -> Result<Response<LoginReply>, Status> {
        let span = tracing::info_span!("login");
        let _enter = span.enter();
        event!(Level::INFO, "login start");
        let LoginRequest { username, password } = request.into_inner();
        event!(Level::INFO, "login request: {}", &username);
        let auth = Claims::manager_token(username, password)?;
        event!(Level::INFO, "login success");
        Ok(Response::new(LoginReply { auth }))
    }

    async fn check(&self, request: Request<CheckRequest>) -> Result<Response<Empty>, Status> {
        let span = tracing::info_span!("check");
        let _enter = span.enter();
        event!(Level::INFO, "check start");
        let CheckRequest { auth } = request.into_inner();
        Claims::check_manager(auth)?;
        event!(Level::INFO, "check success");
        Ok(Response::new(Empty {}))
    }
}
