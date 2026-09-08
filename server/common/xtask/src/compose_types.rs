use serde::Deserialize;
use std::collections::HashMap;

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ComposeFile {
    #[serde(default, rename = "version")]
    pub _version: Option<String>,
    #[serde(default)]
    pub services: HashMap<String, ComposeService>,
    #[serde(default)]
    pub volumes: HashMap<String, ComposeVolume>,
}

#[derive(Default, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ComposeVolume {
    pub name: Option<String>,
    #[serde(default)]
    pub external: bool,
    #[serde(default, rename = "x-exclusive")]
    pub exclusive: bool,
}

#[derive(Default, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct ComposeService {
    pub image: Option<String>,
    pub container_name: Option<String>,
    #[serde(default)]
    pub ports: Vec<String>,
    pub restart: Option<String>,
    #[serde(default)]
    pub volumes: Vec<String>,
    #[serde(default)]
    pub environment: HashMap<String, Option<String>>,
    #[serde(default)]
    pub env_file: StringOrVec,
    #[serde(default)]
    pub depends_on: DependsOn,
    pub healthcheck: Option<Healthcheck>,
    #[serde(default, rename = "x-required-env")]
    pub required_env: Vec<String>,
}

#[derive(Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Healthcheck {
    pub test: Vec<String>,
    pub interval: String,
    pub timeout: String,
    pub retries: i64,
    pub start_period: String,
}

#[derive(Default, Deserialize)]
#[serde(untagged)]
pub enum StringOrVec {
    #[default]
    Empty,
    One(String),
    Many(Vec<String>),
}
impl StringOrVec {
    pub fn as_slice(&self) -> Vec<&str> {
        match self {
            Self::Empty => vec![],
            Self::One(value) => vec![value],
            Self::Many(values) => values.iter().map(String::as_str).collect(),
        }
    }
}

#[derive(Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DependencyCondition {
    ServiceStarted,
    ServiceHealthy,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Dependency {
    pub condition: DependencyCondition,
}

#[derive(Default, Deserialize)]
#[serde(untagged)]
pub enum DependsOn {
    #[default]
    Empty,
    Names(Vec<String>),
    Detailed(HashMap<String, Dependency>),
}
impl DependsOn {
    pub fn entries(&self) -> Vec<(&str, DependencyCondition)> {
        match self {
            Self::Empty => vec![],
            Self::Names(names) => names
                .iter()
                .map(|name| (name.as_str(), DependencyCondition::ServiceStarted))
                .collect(),
            Self::Detailed(values) => values
                .iter()
                .map(|(name, dep)| (name.as_str(), dep.condition))
                .collect(),
        }
    }
    pub fn keys(&self) -> Vec<String> {
        self.entries()
            .into_iter()
            .map(|(name, _)| name.to_owned())
            .collect()
    }
}
