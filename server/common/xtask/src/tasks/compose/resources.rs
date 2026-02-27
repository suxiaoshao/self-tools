use std::collections::{HashMap, HashSet};
use std::path::Path;

use bollard::Docker;
use bollard::models::{NetworkCreateRequest, VolumeCreateRequest};
use bollard::query_parameters::ListVolumesOptionsBuilder;
use tracing::{Level, event};

use crate::TaskResult;
use crate::compose_types::ComposeFile;

use super::{COMPOSE_NETWORK_LABEL, COMPOSE_PROJECT_LABEL, COMPOSE_VOLUME_LABEL};

pub(super) fn compose_project_name(root: &Path) -> String {
    root.file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("self-tools")
        .to_string()
}

pub(super) fn default_network_name(project_name: &str) -> String {
    format!("{project_name}_default")
}

pub(super) async fn ensure_named_volumes(
    docker: &Docker,
    compose: &ComposeFile,
    project_name: &str,
) -> TaskResult {
    let existing = docker
        .list_volumes(Some(ListVolumesOptionsBuilder::new().build()))
        .await?
        .volumes
        .unwrap_or_default()
        .into_iter()
        .map(|volume| volume.name)
        .collect::<HashSet<_>>();

    for (key, volume) in &compose.volumes {
        let name = volume.name.clone().unwrap_or_else(|| key.to_string());
        if existing.contains(&name) {
            continue;
        }

        event!(Level::INFO, volume = %name, "creating volume");
        let mut labels = HashMap::new();
        labels.insert(COMPOSE_PROJECT_LABEL.to_string(), project_name.to_string());
        labels.insert(COMPOSE_VOLUME_LABEL.to_string(), key.to_string());
        docker
            .create_volume(VolumeCreateRequest {
                name: Some(name),
                driver: Some("local".to_string()),
                driver_opts: Some(HashMap::new()),
                labels: Some(labels),
                ..Default::default()
            })
            .await?;
    }

    Ok(())
}

pub(super) async fn ensure_network(
    docker: &Docker,
    network_name: &str,
    project_name: &str,
) -> TaskResult {
    let existing = docker.list_networks(None).await?;
    if existing
        .iter()
        .any(|network| network.name.as_deref() == Some(network_name))
    {
        return Ok(());
    }

    event!(Level::INFO, network = %network_name, "creating network");
    let mut labels = HashMap::new();
    labels.insert(COMPOSE_PROJECT_LABEL.to_string(), project_name.to_string());
    labels.insert(COMPOSE_NETWORK_LABEL.to_string(), "default".to_string());
    docker
        .create_network(NetworkCreateRequest {
            name: network_name.to_string(),
            driver: Some("bridge".to_string()),
            labels: Some(labels),
            ..Default::default()
        })
        .await?;

    Ok(())
}
