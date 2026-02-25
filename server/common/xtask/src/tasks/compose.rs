use std::{
    collections::{HashMap, HashSet},
    path::Path,
};

use bollard::{
    Docker,
    models::{
        ContainerCreateBody, ContainerInspectResponse, HostConfig, PortBinding, RestartPolicy,
        RestartPolicyNameEnum, VolumeCreateOptions,
    },
    query_parameters::{
        CreateContainerOptionsBuilder, InspectContainerOptionsBuilder, ListVolumesOptionsBuilder,
        StartContainerOptions,
    },
};
use tracing::{event, Level};

use crate::{
    TaskResult,
    compose_types::{ComposeFile, ComposeService},
    context::{load_env_file, workspace_root},
    error::XtaskError,
};

pub async fn run_once() -> TaskResult {
    let root = workspace_root();
    let compose_path = root.join("docker/compose/docker-compose.yml");
    let compose_dir = root.join("docker/compose");
    let env_path = compose_dir.join(".env");

    let compose_raw = std::fs::read_to_string(compose_path)?;
    let compose: ComposeFile = serde_yaml::from_str(&compose_raw)?;
    let docker = Docker::connect_with_local_defaults()?;

    ensure_named_volumes(&docker, &compose).await?;

    let env_from_file = load_env_file(&env_path)?;
    let order = resolve_order(&compose.services)?;

    for service_name in order {
        let service = compose
            .services
            .get(&service_name)
            .expect("service order generated from existing keys");

        ensure_service_running(
            &docker,
            &service_name,
            service,
            &compose,
            &env_from_file,
            &compose_dir,
        )
        .await?;
    }

    Ok(())
}

async fn ensure_named_volumes(docker: &Docker, compose: &ComposeFile) -> TaskResult {
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
        docker
            .create_volume(VolumeCreateOptions {
                name: Some(name),
                driver: Some("local".to_string()),
                driver_opts: Some(HashMap::new()),
                labels: Some(HashMap::new()),
                ..Default::default()
            })
            .await?;
    }

    Ok(())
}

async fn ensure_service_running(
    docker: &Docker,
    service_name: &str,
    service: &ComposeService,
    compose: &ComposeFile,
    env_from_file: &HashMap<String, String>,
    compose_dir: &Path,
) -> TaskResult {
    let container_name = service
        .container_name
        .clone()
        .unwrap_or_else(|| format!("self-tools-{service_name}"));

    let inspect = docker
        .inspect_container(
            &container_name,
            Some(InspectContainerOptionsBuilder::new().build()),
        )
        .await;

    match inspect {
        Ok(details) => {
            if !is_running(&details) {
                event!(Level::INFO, container = %container_name, "starting existing container");
                docker
                    .start_container(&container_name, None::<StartContainerOptions>)
                    .await?;
            }
        }
        Err(bollard::errors::Error::DockerResponseServerError {
            status_code: 404, ..
        }) => {
            create_and_start_container(
                docker,
                service_name,
                service,
                compose,
                env_from_file,
                compose_dir,
                &container_name,
            )
            .await?;
        }
        Err(err) => return Err(XtaskError::Docker(err)),
    }

    Ok(())
}

async fn create_and_start_container(
    docker: &Docker,
    service_name: &str,
    service: &ComposeService,
    compose: &ComposeFile,
    env_from_file: &HashMap<String, String>,
    compose_dir: &Path,
    container_name: &str,
) -> TaskResult {
    let image = service
        .image
        .as_deref()
        .ok_or_else(|| XtaskError::MissingImage {
            service: service_name.to_string(),
        })?;

    let mut env = env_from_file.clone();
    for env_file in service.env_file.as_slice() {
        env.extend(load_env_file(&compose_dir.join(env_file))?);
    }
    for (k, v) in &service.environment {
        env.insert(k.clone(), v.clone());
    }

    let env_list = env
        .into_iter()
        .map(|(k, v)| format!("{k}={v}"))
        .collect::<Vec<_>>();

    let mut exposed_ports = HashMap::new();
    let mut port_bindings: HashMap<String, Option<Vec<PortBinding>>> = HashMap::new();

    for port in &service.ports {
        let (host_port, container_port) = parse_port_binding(port);
        let key = format!("{container_port}/tcp");
        exposed_ports.insert(key.clone(), HashMap::new());
        port_bindings.insert(
            key,
            Some(vec![PortBinding {
                host_ip: Some("0.0.0.0".to_string()),
                host_port: Some(host_port),
            }]),
        );
    }

    let binds = service
        .volumes
        .iter()
        .map(|volume| resolve_volume_bind(volume, compose))
        .collect::<Vec<_>>();

    let host_config = HostConfig {
        binds: (!binds.is_empty()).then_some(binds),
        port_bindings: (!port_bindings.is_empty()).then_some(port_bindings),
        restart_policy: service.restart.as_ref().map(|policy| RestartPolicy {
            name: Some(parse_restart_policy(policy)),
            maximum_retry_count: Some(0),
        }),
        ..Default::default()
    };

    event!(Level::INFO, container = %container_name, image, "creating container");
    docker
        .create_container(
            Some(
                CreateContainerOptionsBuilder::new()
                    .name(container_name)
                    .build(),
            ),
            ContainerCreateBody {
                image: Some(image.to_string()),
                env: (!env_list.is_empty()).then_some(env_list),
                exposed_ports: (!exposed_ports.is_empty()).then_some(exposed_ports),
                host_config: Some(host_config),
                ..Default::default()
            },
        )
        .await?;

    docker
        .start_container(container_name, None::<StartContainerOptions>)
        .await?;

    Ok(())
}

fn resolve_volume_bind(volume: &str, compose: &ComposeFile) -> String {
    let mut parts = volume.split(':');
    let source = parts.next().unwrap_or_default();
    let target = parts.next().unwrap_or_default();

    if source.starts_with('/') {
        return volume.to_string();
    }

    let resolved_source = compose
        .volumes
        .get(source)
        .and_then(|v| v.name.as_ref())
        .cloned()
        .unwrap_or_else(|| source.to_string());

    if target.is_empty() {
        resolved_source
    } else {
        format!("{resolved_source}:{target}")
    }
}

fn parse_port_binding(input: &str) -> (String, String) {
    let parts = input.split(':').collect::<Vec<_>>();
    if parts.len() == 1 {
        let value = parts[0].to_string();
        return (value.clone(), value);
    }
    if parts.len() >= 2 {
        let host = parts[parts.len() - 2].to_string();
        let container = parts[parts.len() - 1].to_string();
        return (host, container);
    }
    ("".to_string(), "".to_string())
}

fn is_running(details: &ContainerInspectResponse) -> bool {
    details
        .state
        .as_ref()
        .and_then(|s| s.running)
        .unwrap_or(false)
}

fn resolve_order(
    services: &HashMap<String, ComposeService>,
) -> Result<Vec<String>, XtaskError> {
    let mut resolved = Vec::new();
    let mut visiting = HashSet::new();
    let mut visited = HashSet::new();

    for service in services.keys() {
        visit_service(
            service,
            services,
            &mut visiting,
            &mut visited,
            &mut resolved,
        )?;
    }

    Ok(resolved)
}

fn visit_service(
    service: &str,
    services: &HashMap<String, ComposeService>,
    visiting: &mut HashSet<String>,
    visited: &mut HashSet<String>,
    resolved: &mut Vec<String>,
) -> Result<(), XtaskError> {
    if visited.contains(service) {
        return Ok(());
    }

    if !visiting.insert(service.to_string()) {
        return Err(XtaskError::DependencyCycle {
            service: service.to_string(),
        });
    }

    let deps = services
        .get(service)
        .map(|s| s.depends_on.keys().into_iter().collect::<Vec<_>>())
        .unwrap_or_default();

    for dep in deps {
        if !services.contains_key(&dep) {
            return Err(XtaskError::UnknownDependency {
                service: service.to_string(),
                dependency: dep,
            });
        }
        visit_service(&dep, services, visiting, visited, resolved)?;
    }

    visiting.remove(service);
    visited.insert(service.to_string());
    resolved.push(service.to_string());
    Ok(())
}

fn parse_restart_policy(value: &str) -> RestartPolicyNameEnum {
    match value {
        "no" => RestartPolicyNameEnum::NO,
        "always" => RestartPolicyNameEnum::ALWAYS,
        "unless-stopped" => RestartPolicyNameEnum::UNLESS_STOPPED,
        "on-failure" => RestartPolicyNameEnum::ON_FAILURE,
        _ => RestartPolicyNameEnum::EMPTY,
    }
}
