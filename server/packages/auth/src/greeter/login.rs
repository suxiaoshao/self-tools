use proto::auth::{login_server::Login, CheckRequest, Empty, LoginReply, LoginRequest};
use tonic::{async_trait, Request, Response, Status};

use crate::utils::Claims;

pub struct LoginGreeter;

#[async_trait]
impl Login for LoginGreeter {
    async fn login(&self, request: Request<LoginRequest>) -> Result<Response<LoginReply>, Status> {
        let LoginRequest { name, password } = request.into_inner();
        let auth = Claims::manager_token(name, password)?;

        Ok(Response::new(LoginReply { auth }))
    }

    async fn check(&self, request: Request<CheckRequest>) -> Result<Response<Empty>, Status> {
        let CheckRequest { auth } = request.into_inner();
        Claims::check_manager(auth)?;
        Ok(Response::new(Empty {}))
    }
}
