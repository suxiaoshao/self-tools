use std::io;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum XtaskError {
    #[error("failed to create async runtime: {0}")]
    Runtime(io::Error),
    #[error("docker api error: {0}")]
    Docker(#[from] bollard::errors::Error),
    #[error("io error: {0}")]
    Io(#[from] io::Error),
    #[error("yaml parse error: {0}")]
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
