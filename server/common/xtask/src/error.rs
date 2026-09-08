use std::io;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum XtaskError {
    #[error("migration stopped: {0}. Existing backup/target resources are retained")]
    Migration(&'static str),
    #[error(
        "unsupported port binding; use host-port:container-port or IPv4:host-port:container-port"
    )]
    InvalidPort,
    #[error("invalid healthcheck in service `{service}`")]
    InvalidHealthcheck { service: String },
    #[error("service `{service}` requires a nonempty `{key}`")]
    MissingEnvironment { service: String, key: String },
    #[error(
        "required external volume `{name}` is missing; complete database migration before deployment"
    )]
    MissingVolume { name: String },
    #[error(
        "exclusive volume `{name}` is in use by another running container; stop the staging database before cutover"
    )]
    VolumeInUse { name: String },
    #[error("container `{name}` belongs to another owner; refusing to replace it")]
    UnmanagedContainer { name: String },
    #[error("service `{service}` is not ready: {reason}")]
    NotReady {
        service: String,
        reason: &'static str,
    },

    #[error("image build failed for `{image}`")]
    BuildFailed { image: String },
    #[error("proxy/mirror credentials must not be passed as build arguments")]
    CredentialBuildArgument,
    #[error("failed to create async runtime: {0}")]
    Runtime(io::Error),
    #[error("docker API request failed")]
    Docker(#[from] bollard::errors::Error),
    #[error("io error: {0}")]
    Io(#[from] io::Error),
    #[error("invalid or unsupported Compose YAML")]
    Yaml(#[from] serde_yaml::Error),
    #[error("certificate generation error: {0}")]
    Rcgen(#[from] rcgen::Error),
    #[error("missing required field `image` in service `{service}`")]
    MissingImage { service: String },
    #[error("dependency cycle detected around service `{service}`")]
    DependencyCycle { service: String },
    #[error("service `{service}` references unknown dependency `{dependency}`")]
    UnknownDependency { service: String, dependency: String },
    #[error("docker compose up failed after {attempts} attempts")]
    ComposeFailed { attempts: usize },
}
