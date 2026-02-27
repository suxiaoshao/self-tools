use std::{collections::HashMap, path::Path};

use bollard::Docker;

use crate::{
    compose_types::{ComposeFile, ComposeService},
    context::{load_env_file, workspace_root},
    TaskResult,
};

mod container;
mod helpers;
mod resources;
mod topology;

use container::ensure_service_running;
use resources::{compose_project_name, default_network_name, ensure_named_volumes, ensure_network};
use topology::resolve_order;

const CONFIG_SIGNATURE_LABEL: &str = "self-tools.compose.signature";
const COMPOSE_PROJECT_LABEL: &str = "com.docker.compose.project";
const COMPOSE_SERVICE_LABEL: &str = "com.docker.compose.service";
const COMPOSE_NETWORK_LABEL: &str = "com.docker.compose.network";
const COMPOSE_VOLUME_LABEL: &str = "com.docker.compose.volume";

struct ComposeRuntime<'a> {
    docker: &'a Docker,
    compose: &'a ComposeFile,
    env_from_file: &'a HashMap<String, String>,
    compose_dir: &'a Path,
    network_name: &'a str,
    project_name: &'a str,
}

pub async fn run_once() -> TaskResult {
    let root = workspace_root();
    let compose_path = root.join("docker/compose/docker-compose.yml");
    let compose_dir = root.join("docker/compose");
    let env_path = compose_dir.join(".env");

    let compose_raw = std::fs::read_to_string(compose_path)?;
    let compose: ComposeFile = serde_yaml::from_str(&compose_raw)?;
    let docker = Docker::connect_with_local_defaults()?;
    let project_name = compose_project_name(&root);
    let network_name = default_network_name(&project_name);

    ensure_named_volumes(&docker, &compose, &project_name).await?;
    ensure_network(&docker, &network_name, &project_name).await?;

    let env_from_file = load_env_file(&env_path)?;
    let runtime = ComposeRuntime {
        docker: &docker,
        compose: &compose,
        env_from_file: &env_from_file,
        compose_dir: &compose_dir,
        network_name: &network_name,
        project_name: &project_name,
    };

    let order = resolve_order(&compose.services)?;
    for service_name in order {
        let service: &ComposeService = runtime
            .compose
            .services
            .get(&service_name)
            .expect("service order generated from existing keys");
        ensure_service_running(&runtime, &service_name, service).await?;
    }

    Ok(())
}
