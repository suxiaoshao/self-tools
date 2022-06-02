use tonic::transport::Channel;
use tower::ServiceBuilder;

#[cfg(feature = "auth_client")]
use crate::auth::login_client::LoginClient;
use crate::middleware::client::service::{Auth, AuthService};

#[cfg(feature = "auth_client")]
pub async fn login_client(
    auth: Option<String>,
) -> Result<LoginClient<AuthService>, tonic::transport::Error> {
    let channel = Channel::from_static("http://core:80").connect().await?;

    let channel = ServiceBuilder::new()
        // Interceptors can be also be applied as middleware
        .layer(Auth(auth))
        .service(channel);
    let client = LoginClient::new(channel);
    Ok(client)
}

pub mod service {
    use std::future::Future;
    use std::pin::Pin;
    use std::task::{Context, Poll};

    use http::{Request, Response};
    use tonic::body::BoxBody;
    use tonic::transport::Body;
    use tonic::transport::Channel;
    use tower::{Layer, Service};

    pub struct Auth(pub Option<String>);

    impl Layer<Channel> for Auth {
        type Service = AuthService;

        fn layer(&self, inner: Channel) -> Self::Service {
            AuthService::new(inner, self.0.clone())
        }
    }

    #[derive(Clone)]
    pub struct AuthService {
        inner: Channel,
        auth: Option<String>,
    }

    impl AuthService {
        fn new(inner: Channel, auth: Option<String>) -> Self {
            AuthService { inner, auth }
        }
    }

    impl Service<Request<BoxBody>> for AuthService {
        type Response = Response<Body>;
        type Error = Box<dyn std::error::Error + Send + Sync>;
        #[allow(clippy::type_complexity)]
        type Future = Pin<Box<dyn Future<Output = Result<Self::Response, Self::Error>> + Send>>;

        fn poll_ready(&mut self, cx: &mut Context<'_>) -> Poll<Result<(), Self::Error>> {
            self.inner.poll_ready(cx).map_err(Into::into)
        }

        fn call(&mut self, mut req: Request<BoxBody>) -> Self::Future {
            let clone = self.inner.clone();
            let mut inner = std::mem::replace(&mut self.inner, clone);

            if let Some(auth) = self.auth.as_ref().and_then(|x| x.parse().ok()) {
                req.headers_mut().insert("authorization", auth);
            }

            Box::pin(async move {
                // Do extra async work here...
                let response = inner.call(req).await?;

                Ok(response)
            })
        }
    }
}
