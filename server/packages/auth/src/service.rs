use crate::{
    application::{Application, Error},
    passkey::Purpose,
};
use std::sync::Arc;
use thrift::auth::*;
use volo_thrift::MaybeException;
pub struct AuthImpl(pub Arc<Application>);
impl AuthService for AuthImpl {
    async fn login_password(
        &self,
        ctx: Context,
        username: volo::FastStr,
        password: volo::FastStr,
    ) -> Result<
        MaybeException<LoginResult, AuthServiceLoginPasswordException>,
        volo_thrift::ServerError,
    > {
        Ok(
            match self
                .0
                .run(move |app, db| {
                    app.login_password(db, &ctx, username.as_str(), password.as_str())
                })
                .await
            {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => MaybeException::Exception(AuthServiceLoginPasswordException::Err(
                    failure(error),
                )),
            },
        )
    }
    async fn check(
        &self,
        ctx: Context,
    ) -> Result<MaybeException<Session, AuthServiceCheckException>, volo_thrift::ServerError> {
        Ok(match self.0.run(move |app, db| app.check(db, &ctx)).await {
            Ok(value) => MaybeException::Ok(value),
            Err(error) => MaybeException::Exception(AuthServiceCheckException::Err(failure(error))),
        })
    }
    async fn logout(
        &self,
        ctx: Context,
    ) -> Result<MaybeException<(), AuthServiceLogoutException>, volo_thrift::ServerError> {
        Ok(
            match self.0.run(move |app, db| app.logout(db, &ctx)).await {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => {
                    MaybeException::Exception(AuthServiceLogoutException::Err(failure(error)))
                }
            },
        )
    }
    async fn reauth_password(
        &self,
        ctx: Context,
        password: volo::FastStr,
    ) -> Result<MaybeException<Session, AuthServiceReauthPasswordException>, volo_thrift::ServerError>
    {
        Ok(
            match self
                .0
                .run(move |app, db| app.reauth_password(db, &ctx, password.as_str()))
                .await
            {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => MaybeException::Exception(AuthServiceReauthPasswordException::Err(
                    failure(error),
                )),
            },
        )
    }
    async fn begin_login(
        &self,
        ctx: CeremonyContext,
    ) -> Result<MaybeException<Options, AuthServiceBeginLoginException>, volo_thrift::ServerError>
    {
        Ok(
            match self
                .0
                .run(move |app, db| app.begin(db, &ctx, Purpose::Login, None))
                .await
            {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => {
                    MaybeException::Exception(AuthServiceBeginLoginException::Err(failure(error)))
                }
            },
        )
    }
    async fn finish_login(
        &self,
        ctx: CeremonyContext,
        credential_json: volo::FastStr,
    ) -> Result<
        MaybeException<LoginResult, AuthServiceFinishLoginException>,
        volo_thrift::ServerError,
    > {
        Ok(
            match self
                .0
                .run(move |app, db| app.finish_login(db, &ctx, credential_json.as_str()))
                .await
            {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => {
                    MaybeException::Exception(AuthServiceFinishLoginException::Err(failure(error)))
                }
            },
        )
    }
    async fn begin_reauth(
        &self,
        ctx: CeremonyContext,
    ) -> Result<MaybeException<Options, AuthServiceBeginReauthException>, volo_thrift::ServerError>
    {
        Ok(
            match self
                .0
                .run(move |app, db| app.begin(db, &ctx, Purpose::Reauth, None))
                .await
            {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => {
                    MaybeException::Exception(AuthServiceBeginReauthException::Err(failure(error)))
                }
            },
        )
    }
    async fn finish_reauth(
        &self,
        ctx: CeremonyContext,
        credential_json: volo::FastStr,
    ) -> Result<MaybeException<Session, AuthServiceFinishReauthException>, volo_thrift::ServerError>
    {
        Ok(
            match self
                .0
                .run(move |app, db| app.finish_reauth(db, &ctx, credential_json.as_str()))
                .await
            {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => {
                    MaybeException::Exception(AuthServiceFinishReauthException::Err(failure(error)))
                }
            },
        )
    }
    async fn list_passkeys(
        &self,
        ctx: Context,
    ) -> Result<
        MaybeException<Vec<PasskeyInfo>, AuthServiceListPasskeysException>,
        volo_thrift::ServerError,
    > {
        Ok(
            match self.0.run(move |app, db| app.list_passkeys(db, &ctx)).await {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => {
                    MaybeException::Exception(AuthServiceListPasskeysException::Err(failure(error)))
                }
            },
        )
    }
    async fn begin_registration(
        &self,
        ctx: CeremonyContext,
        name: volo::FastStr,
    ) -> Result<
        MaybeException<Options, AuthServiceBeginRegistrationException>,
        volo_thrift::ServerError,
    > {
        Ok(
            match self
                .0
                .run(move |app, db| app.begin(db, &ctx, Purpose::Register, Some(name.as_str())))
                .await
            {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => MaybeException::Exception(
                    AuthServiceBeginRegistrationException::Err(failure(error)),
                ),
            },
        )
    }
    async fn finish_registration(
        &self,
        ctx: CeremonyContext,
        credential_json: volo::FastStr,
    ) -> Result<
        MaybeException<PasskeyInfo, AuthServiceFinishRegistrationException>,
        volo_thrift::ServerError,
    > {
        Ok(
            match self
                .0
                .run(move |app, db| app.finish_registration(db, &ctx, credential_json.as_str()))
                .await
            {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => MaybeException::Exception(
                    AuthServiceFinishRegistrationException::Err(failure(error)),
                ),
            },
        )
    }
    async fn rename_passkey(
        &self,
        ctx: Context,
        id: volo::FastStr,
        name: volo::FastStr,
    ) -> Result<
        MaybeException<PasskeyInfo, AuthServiceRenamePasskeyException>,
        volo_thrift::ServerError,
    > {
        Ok(
            match self
                .0
                .run(move |app, db| app.rename_passkey(db, &ctx, id.as_str(), name.as_str()))
                .await
            {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => MaybeException::Exception(AuthServiceRenamePasskeyException::Err(
                    failure(error),
                )),
            },
        )
    }
    async fn delete_passkey(
        &self,
        ctx: Context,
        id: volo::FastStr,
    ) -> Result<MaybeException<bool, AuthServiceDeletePasskeyException>, volo_thrift::ServerError>
    {
        Ok(
            match self
                .0
                .run(move |app, db| app.delete_passkey(db, &ctx, id.as_str()))
                .await
            {
                Ok(value) => MaybeException::Ok(value),
                Err(error) => MaybeException::Exception(AuthServiceDeletePasskeyException::Err(
                    failure(error),
                )),
            },
        )
    }
}
fn failure(error: Error) -> AuthFailure {
    let code = match error {
        Error::Unauthenticated => FailureCode::UNAUTHENTICATED,
        Error::ReauthRequired => FailureCode::REAUTH_REQUIRED,
        Error::AuthenticationFailed => FailureCode::AUTHENTICATION_FAILED,
        Error::CeremonyInvalid => FailureCode::CEREMONY_INVALID,
        Error::NoPasskey => FailureCode::NO_PASSKEY,
        Error::PasskeyExists => FailureCode::PASSKEY_EXISTS,
        Error::InvalidRequest => FailureCode::INVALID_REQUEST,
        Error::NotFound => FailureCode::NOT_FOUND,
        Error::RateLimited => FailureCode::RATE_LIMITED,
        Error::Unavailable => FailureCode::UNAVAILABLE,
    };
    AuthFailure {
        code,
        retry_after_seconds: if matches!(error, Error::RateLimited) {
            Some(60)
        } else {
            None
        },
    }
}
