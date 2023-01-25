#[cfg(feature = "trace")]
use rand::{distributions::Alphanumeric, Rng};

#[cfg(feature = "auth")]
mod auth;
#[cfg(feature = "cors")]
mod cors;
#[cfg(feature = "trace")]
mod trace;
#[cfg(feature = "auth")]
pub use auth::{auth, Unauthenticated};
#[cfg(feature = "cors")]
pub use cors::get_cors;
