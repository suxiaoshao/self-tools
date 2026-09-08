use std::collections::HashMap;

use bollard::models::{
    ContainerCreateBody, ContainerInspectResponse, EndpointSettings, HostConfig, NetworkingConfig,
    PortBinding, RestartPolicy,
};
use bollard::query_parameters::{
    CreateContainerOptionsBuilder, InspectContainerOptionsBuilder, RemoveContainerOptionsBuilder,
    StartContainerOptions, StopContainerOptionsBuilder,
};
use tracing::{Level, event};

use crate::TaskResult;
use crate::compose_types::ComposeService;
use crate::context::load_env_file;
use crate::error::XtaskError;

use super::helpers::{is_running, parse_port_binding, parse_restart_policy, resolve_volume_bind};
use super::{COMPOSE_PROJECT_LABEL, COMPOSE_SERVICE_LABEL, CONFIG_SIGNATURE_LABEL, ComposeRuntime};

pub(super) async fn ensure_service_running(
    runtime: &ComposeRuntime<'_>,
    service_name: &str,
    service: &ComposeService,
) -> TaskResult {
    let container_name = service
        .container_name
        .clone()
        .unwrap_or_else(|| format!("self-tools-{service_name}"));
    let config_signature = build_config_signature(runtime, service_name, service).await?;

    let inspect = runtime
        .docker
        .inspect_container(
            &container_name,
            Some(InspectContainerOptionsBuilder::new().build()),
        )
        .await;

    match inspect {
        Ok(details) => {
            if !container_matches_signature(&details, &config_signature) {
                recreate_container(
                    runtime,
                    service_name,
                    service,
                    &container_name,
                    &details,
                    &config_signature,
                )
                .await?;
            } else if !is_running(&details) {
                event!(Level::INFO, container = %container_name, "starting existing container");
                runtime
                    .docker
                    .start_container(&container_name, None::<StartContainerOptions>)
                    .await?;
            }
        }
        Err(bollard::errors::Error::DockerResponseServerError {
            status_code: 404, ..
        }) => {
            create_and_start_container(
                runtime,
                service_name,
                service,
                &container_name,
                &config_signature,
            )
            .await?;
        }
        Err(err) => return Err(XtaskError::Docker(err)),
    }

    Ok(())
}

async fn create_and_start_container(
    runtime: &ComposeRuntime<'_>,
    service_name: &str,
    service: &ComposeService,
    container_name: &str,
    config_signature: &str,
) -> TaskResult {
    let image = service
        .image
        .as_deref()
        .ok_or_else(|| XtaskError::MissingImage {
            service: service_name.to_string(),
        })?;

    let env = resolve_environment(runtime.env_from_file, runtime.compose_dir, service, |key| {
        std::env::var(key).ok()
    })?;

    let mut env_list = env
        .iter()
        .map(|(k, v)| format!("{k}={v}"))
        .collect::<Vec<_>>();
    env_list.sort();

    let mut exposed_ports = Vec::new();
    let mut port_bindings: HashMap<String, Option<Vec<PortBinding>>> = HashMap::new();
    for port in &service.ports {
        let (host_port, container_port) = parse_port_binding(port);
        let key = format!("{container_port}/tcp");
        exposed_ports.push(key.clone());
        port_bindings.insert(
            key,
            Some(vec![PortBinding {
                host_ip: Some("0.0.0.0".to_string()),
                host_port: Some(host_port),
            }]),
        );
    }
    exposed_ports.sort();

    let mut binds = service
        .volumes
        .iter()
        .map(|volume| resolve_volume_bind(volume, runtime.compose))
        .collect::<Vec<_>>();
    binds.sort();

    let host_config = HostConfig {
        binds: (!binds.is_empty()).then_some(binds),
        port_bindings: (!port_bindings.is_empty()).then_some(port_bindings),
        network_mode: Some(runtime.network_name.to_string()),
        restart_policy: service.restart.as_ref().map(|policy| RestartPolicy {
            name: Some(parse_restart_policy(policy)),
            maximum_retry_count: Some(0),
        }),
        ..Default::default()
    };

    let mut labels = HashMap::new();
    labels.insert(
        CONFIG_SIGNATURE_LABEL.to_string(),
        config_signature.to_string(),
    );
    labels.insert(
        COMPOSE_PROJECT_LABEL.to_string(),
        runtime.project_name.to_string(),
    );
    labels.insert(COMPOSE_SERVICE_LABEL.to_string(), service_name.to_string());

    let mut endpoints = HashMap::new();
    let mut aliases = vec![service_name.to_string()];
    if container_name != service_name {
        aliases.push(container_name.to_string());
    }
    endpoints.insert(
        runtime.network_name.to_string(),
        EndpointSettings {
            aliases: Some(aliases),
            ..Default::default()
        },
    );

    event!(Level::INFO, container = %container_name, image, "creating container");
    runtime
        .docker
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
                labels: Some(labels),
                networking_config: Some(NetworkingConfig {
                    endpoints_config: Some(endpoints),
                }),
                ..Default::default()
            },
        )
        .await?;

    runtime
        .docker
        .start_container(container_name, None::<StartContainerOptions>)
        .await?;

    Ok(())
}

async fn recreate_container(
    runtime: &ComposeRuntime<'_>,
    service_name: &str,
    service: &ComposeService,
    container_name: &str,
    details: &ContainerInspectResponse,
    config_signature: &str,
) -> TaskResult {
    event!(
        Level::INFO,
        container = %container_name,
        "container configuration changed, recreating"
    );
    if is_running(details) {
        runtime
            .docker
            .stop_container(
                container_name,
                Some(StopContainerOptionsBuilder::new().build()),
            )
            .await?;
    }

    runtime
        .docker
        .remove_container(
            container_name,
            Some(RemoveContainerOptionsBuilder::new().force(true).build()),
        )
        .await?;

    create_and_start_container(
        runtime,
        service_name,
        service,
        container_name,
        config_signature,
    )
    .await
}

fn container_matches_signature(details: &ContainerInspectResponse, expected: &str) -> bool {
    details
        .config
        .as_ref()
        .and_then(|config| config.labels.as_ref())
        .and_then(|labels| labels.get(CONFIG_SIGNATURE_LABEL))
        .is_some_and(|actual| actual == expected)
}

async fn build_config_signature(
    runtime: &ComposeRuntime<'_>,
    service_name: &str,
    service: &ComposeService,
) -> Result<String, XtaskError> {
    let image = service
        .image
        .as_deref()
        .ok_or_else(|| XtaskError::MissingImage {
            service: service_name.to_string(),
        })?;
    let image_id = runtime
        .docker
        .inspect_image(image)
        .await?
        .id
        .unwrap_or_default();

    let env = resolve_environment(runtime.env_from_file, runtime.compose_dir, service, |key| {
        std::env::var(key).ok()
    })?;

    let mut env_pairs = env
        .into_iter()
        .map(|(k, v)| format!("{k}={v}"))
        .collect::<Vec<_>>();
    env_pairs.sort();

    let mut ports = service
        .ports
        .iter()
        .map(|port| {
            let (host_port, container_port) = parse_port_binding(port);
            format!("{host_port}:{container_port}")
        })
        .collect::<Vec<_>>();
    ports.sort();

    let mut binds = service
        .volumes
        .iter()
        .map(|volume| resolve_volume_bind(volume, runtime.compose))
        .collect::<Vec<_>>();
    binds.sort();

    let restart = service.restart.clone().unwrap_or_default();

    Ok(format!(
        "project={}|image={image}|image_id={image_id}|restart={restart}|network={}|env={}|ports={}|binds={}",
        runtime.project_name,
        runtime.network_name,
        env_pairs.join(","),
        ports.join(","),
        binds.join(",")
    ))
}

// Both container creation and its signature must use the same resolved values.
fn resolve_environment(
    project_env: &HashMap<String, String>,
    compose_dir: &std::path::Path,
    service: &ComposeService,
    process_env: impl Fn(&str) -> Option<String>,
) -> Result<HashMap<String, String>, XtaskError> {
    let mut env = project_env.clone();
    for env_file in service.env_file.as_slice() {
        env.extend(load_env_file(&compose_dir.join(env_file))?);
    }
    for (key, value) in &service.environment {
        let value = value
            .clone()
            .or_else(|| process_env(key).or_else(|| project_env.get(key).cloned()));
        if let Some(value) = value {
            env.insert(key.clone(), value);
        } else {
            env.remove(key);
        }
    }
    Ok(env)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::compose_types::ComposeFile;

    #[test]
    fn login_auth_origin_passthrough_preserves_missing_empty_and_custom_origin() {
        let compose: ComposeFile = serde_yaml::from_str(include_str!(
            "../../../../../../docker/compose/docker-compose.yml"
        ))
        .unwrap();
        let login = &compose.services["login"];
        let key = "AUTH_ORIGIN";
        assert_eq!(login.environment.get(key), Some(&None));
        assert!(login.env_file.as_slice().is_empty());
        for value in [None, Some(""), Some("https://custom.example")] {
            let project = value
                .map(|v| (key.to_string(), v.to_string()))
                .into_iter()
                .collect();
            let env =
                resolve_environment(&project, std::path::Path::new("."), login, |_| None).unwrap();
            assert_eq!(env.get(key).map(String::as_str), value);
        }
    }

    #[test]
    fn environment_precedence_preserves_explicit_values_and_shell_empty() {
        let service: ComposeService = serde_yaml::from_str(
            "environment:\n  INHERIT: null\n  EMPTY: null\n  FIXED: literal\n  CLEARED: ''\n  MISSING: null\n"
        ).unwrap();
        let project = ["INHERIT", "EMPTY", "FIXED", "CLEARED"]
            .into_iter()
            .map(|key| (key.to_string(), "project".to_string()))
            .collect();
        let env = resolve_environment(
            &project,
            std::path::Path::new("."),
            &service,
            |key| match key {
                "EMPTY" => Some(String::new()),
                "MISSING" => None,
                _ => Some("shell".to_string()),
            },
        )
        .unwrap();
        assert_eq!(env["INHERIT"], "shell");
        assert_eq!(env["EMPTY"], "");
        assert_eq!(env["FIXED"], "literal");
        assert_eq!(env["CLEARED"], "");
        assert!(!env.contains_key("MISSING"));
    }
}
