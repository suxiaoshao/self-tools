use std::collections::HashMap;

use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct ComposeFile {
    #[serde(default)]
    pub services: HashMap<String, ComposeService>,
    #[serde(default)]
    pub volumes: HashMap<String, ComposeVolume>,
}

#[derive(Debug, Default, Deserialize)]
pub struct ComposeVolume {
    pub name: Option<String>,
}

#[derive(Debug, Default, Deserialize)]
pub struct ComposeService {
    pub image: Option<String>,
    pub container_name: Option<String>,
    #[serde(default)]
    pub ports: Vec<String>,
    pub restart: Option<String>,
    #[serde(default)]
    pub volumes: Vec<String>,
    #[serde(default)]
    pub environment: HashMap<String, String>,
    #[serde(default)]
    pub env_file: StringOrVec,
    #[serde(default)]
    pub depends_on: DependsOn,
}

#[derive(Debug, Default, Deserialize)]
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
            Self::Empty => Vec::new(),
            Self::One(value) => vec![value.as_str()],
            Self::Many(values) => values.iter().map(String::as_str).collect(),
        }
    }
}

#[derive(Debug, Default, Deserialize)]
#[serde(untagged)]
pub enum DependsOn {
    #[default]
    Empty,
    Names(Vec<String>),
    Detailed(HashMap<String, serde_yaml::Value>),
}

impl DependsOn {
    pub fn keys(&self) -> Vec<String> {
        match self {
            Self::Empty => Vec::new(),
            Self::Names(values) => values.clone(),
            Self::Detailed(map) => map.keys().cloned().collect(),
        }
    }
}
