use super::helpers::{is_running, parse_port_binding, parse_restart_policy, resolve_volume_bind};
use super::{COMPOSE_PROJECT_LABEL, COMPOSE_SERVICE_LABEL, ComposeRuntime};
use crate::{TaskResult, compose_types::ComposeService, context::load_env_file, error::XtaskError};
use bollard::{
    models::{
        ContainerCreateBody, ContainerInspectResponse, EndpointSettings, HealthConfig, HostConfig,
        ImageInspect, NetworkingConfig, PortBinding, RestartPolicy,
    },
    query_parameters::{
        CreateContainerOptionsBuilder, RemoveContainerOptionsBuilder, StartContainerOptions,
        StopContainerOptionsBuilder,
    },
};
use std::collections::HashMap;
use tracing::{Level, event};

const LEGACY_SIGNATURE: &str = "self-tools.compose.signature";

// Intentionally not Debug: the desired/actual configuration contains credentials.
pub(super) struct DesiredContainer {
    pub name: String,
    body: ContainerCreateBody,
}

pub(super) async fn prepare(
    runtime: &ComposeRuntime<'_>,
    name: &str,
    service: &ComposeService,
) -> Result<DesiredContainer, XtaskError> {
    let image_name = service
        .image
        .as_deref()
        .ok_or_else(|| XtaskError::MissingImage {
            service: name.into(),
        })?;
    let image = runtime.docker.inspect_image(image_name).await?;
    let env = resolve_environment(runtime.env_from_file, runtime.compose_dir, service, |key| {
        std::env::var(key).ok()
    })?;
    for key in &service.required_env {
        if env.get(key).is_none_or(String::is_empty) {
            return Err(XtaskError::MissingEnvironment {
                service: name.into(),
                key: key.clone(),
            });
        }
    }
    let desired = desired_container(runtime, name, service, image, env)?;
    match runtime.docker.inspect_container(&desired.name, None).await {
        Ok(details) => check_owner(runtime, name, &desired.name, &details)?,
        Err(bollard::errors::Error::DockerResponseServerError {
            status_code: 404, ..
        }) => (),
        Err(error) => return Err(error.into()),
    }
    Ok(desired)
}

fn desired_container(
    runtime: &ComposeRuntime<'_>,
    name: &str,
    service: &ComposeService,
    image: ImageInspect,
    env: HashMap<String, String>,
) -> Result<DesiredContainer, XtaskError> {
    let container_name = service
        .container_name
        .clone()
        .unwrap_or_else(|| format!("self-tools-{name}"));
    let config = image.config.unwrap_or_default();
    let mut merged_env = env_map(config.env.as_deref());
    merged_env.extend(env);
    let mut env_list: Vec<_> = merged_env
        .into_iter()
        .map(|(key, value)| format!("{key}={value}"))
        .collect();
    env_list.sort();
    let mut port_bindings: HashMap<String, Option<Vec<PortBinding>>> = HashMap::new();
    let mut exposed_ports = config.exposed_ports.unwrap_or_default();
    for value in &service.ports {
        let port = parse_port_binding(value)?;
        let key = format!("{}/tcp", port.container_port);
        exposed_ports.push(key.clone());
        port_bindings
            .entry(key)
            .or_insert_with(|| Some(vec![]))
            .as_mut()
            .unwrap()
            .push(PortBinding {
                host_ip: Some(port.host_ip),
                host_port: Some(port.host_port),
            });
    }
    exposed_ports.sort();
    exposed_ports.dedup();
    let mut binds: Vec<_> = service
        .volumes
        .iter()
        .map(|v| resolve_volume_bind(v, runtime.compose))
        .collect();
    binds.sort();
    let mut labels = HashMap::new();
    labels.insert(COMPOSE_PROJECT_LABEL.into(), runtime.project_name.into());
    labels.insert(COMPOSE_SERVICE_LABEL.into(), name.into());
    let mut aliases = vec![name.to_owned()];
    if container_name != name {
        aliases.push(container_name.clone());
    }
    let networking_config = NetworkingConfig {
        endpoints_config: Some(HashMap::from([(
            runtime.network_name.into(),
            EndpointSettings {
                aliases: Some(aliases),
                ..Default::default()
            },
        )])),
    };
    let healthcheck = service
        .healthcheck
        .as_ref()
        .map(|health| {
            let invalid = || XtaskError::InvalidHealthcheck {
                service: name.into(),
            };
            if health.test.first().map(String::as_str) != Some("CMD")
                || health.test.len() < 2
                || health.retries < 1
            {
                return Err(invalid());
            }
            Ok(HealthConfig {
                test: Some(health.test.clone()),
                interval: Some(duration_ns(&health.interval).ok_or_else(invalid)?),
                timeout: Some(duration_ns(&health.timeout).ok_or_else(invalid)?),
                retries: Some(health.retries),
                start_period: Some(duration_ns(&health.start_period).ok_or_else(invalid)?),
                ..Default::default()
            })
        })
        .transpose()?
        .or(config.healthcheck);
    Ok(DesiredContainer {
        name: container_name,
        body: ContainerCreateBody {
            // Resolve mutable tags before altering any container.
            image: image.id,
            env: Some(env_list),
            cmd: config.cmd,
            entrypoint: config.entrypoint,
            user: config.user,
            working_dir: config.working_dir,
            healthcheck,
            exposed_ports: Some(exposed_ports),
            host_config: Some(HostConfig {
                binds: Some(binds),
                port_bindings: Some(port_bindings),
                network_mode: Some(runtime.network_name.into()),
                restart_policy: Some(RestartPolicy {
                    name: Some(parse_restart_policy(
                        service.restart.as_deref().unwrap_or("no"),
                    )),
                    maximum_retry_count: Some(0),
                }),
                ..Default::default()
            }),
            labels: Some(labels),
            networking_config: Some(networking_config),
            ..Default::default()
        },
    })
}

fn duration_ns(value: &str) -> Option<i64> {
    let (n, scale) = if let Some(n) = value.strip_suffix("ms") {
        (n, 1_000_000)
    } else {
        (value.strip_suffix('s')?, 1_000_000_000)
    };
    n.parse::<i64>()
        .ok()?
        .checked_mul(scale)
        .filter(|n| *n >= 1_000_000)
}

fn check_owner(
    runtime: &ComposeRuntime<'_>,
    name: &str,
    container: &str,
    details: &ContainerInspectResponse,
) -> TaskResult {
    let labels = details.config.as_ref().and_then(|c| c.labels.as_ref());
    if labels
        .and_then(|l| l.get(COMPOSE_PROJECT_LABEL))
        .map(String::as_str)
        != Some(runtime.project_name)
        || labels
            .and_then(|l| l.get(COMPOSE_SERVICE_LABEL))
            .map(String::as_str)
            != Some(name)
    {
        return Err(XtaskError::UnmanagedContainer {
            name: container.into(),
        });
    }
    Ok(())
}

pub(super) async fn ensure_service_running(
    runtime: &ComposeRuntime<'_>,
    desired: &DesiredContainer,
) -> TaskResult {
    match runtime.docker.inspect_container(&desired.name, None).await {
        Ok(details) if matches_configuration(&details, desired) => {
            if !is_running(&details) {
                runtime
                    .docker
                    .start_container(&desired.name, None::<StartContainerOptions>)
                    .await?;
            }
            return Ok(());
        }
        Ok(details) => {
            // A running service might have been replaced since preflight.
            let name = desired
                .body
                .labels
                .as_ref()
                .unwrap()
                .get(COMPOSE_SERVICE_LABEL)
                .unwrap();
            check_owner(runtime, name, &desired.name, &details)?;
            event!(Level::INFO, container = %desired.name, "configuration changed; recreating container (volumes retained)");
            if is_running(&details) {
                runtime
                    .docker
                    .stop_container(
                        &desired.name,
                        Some(StopContainerOptionsBuilder::new().build()),
                    )
                    .await?;
            }
            runtime
                .docker
                .remove_container(
                    &desired.name,
                    Some(RemoveContainerOptionsBuilder::new().build()),
                )
                .await?;
        }
        Err(bollard::errors::Error::DockerResponseServerError {
            status_code: 404, ..
        }) => (),
        Err(error) => return Err(error.into()),
    }
    event!(Level::INFO, container = %desired.name, "creating container");
    runtime
        .docker
        .create_container(
            Some(
                CreateContainerOptionsBuilder::new()
                    .name(&desired.name)
                    .build(),
            ),
            desired.body.clone(),
        )
        .await?;
    runtime
        .docker
        .start_container(&desired.name, None::<StartContainerOptions>)
        .await?;
    Ok(())
}

fn env_map(env: Option<&[String]>) -> HashMap<String, String> {
    env.unwrap_or_default()
        .iter()
        .filter_map(|pair| pair.split_once('='))
        .map(|(k, v)| (k.into(), v.into()))
        .collect()
}
fn sorted(values: Option<&[String]>) -> Vec<String> {
    let mut values = values.unwrap_or_default().to_vec();
    values.sort();
    values
}
fn ports(
    value: Option<&HashMap<String, Option<Vec<PortBinding>>>>,
) -> Vec<(String, String, String)> {
    let mut result = vec![];
    for (port, bindings) in value.into_iter().flatten() {
        for binding in bindings.iter().flatten() {
            result.push((
                port.clone(),
                binding.host_ip.clone().unwrap_or_default(),
                binding.host_port.clone().unwrap_or_default(),
            ));
        }
    }
    result.sort();
    result
}

fn matches_configuration(details: &ContainerInspectResponse, desired: &DesiredContainer) -> bool {
    let Some(actual) = &details.config else {
        return false;
    };
    let Some(host) = &details.host_config else {
        return false;
    };
    let wanted = &desired.body;
    let wanted_host = wanted.host_config.as_ref().unwrap();
    let actual_labels = actual.labels.as_ref();
    let labels_match = wanted
        .labels
        .as_ref()
        .unwrap()
        .iter()
        .all(|(k, v)| actual_labels.and_then(|l| l.get(k)) == Some(v));
    // Remove the old plaintext label even when all other values already match.
    labels_match
        && !actual_labels.is_some_and(|l| l.contains_key(LEGACY_SIGNATURE))
        && details.image == wanted.image
        && env_map(actual.env.as_deref()) == env_map(wanted.env.as_deref())
        && actual.cmd == wanted.cmd
        && actual.entrypoint == wanted.entrypoint
        && actual.working_dir.as_deref().unwrap_or_default()
            == wanted.working_dir.as_deref().unwrap_or_default()
        && actual.user.as_deref().unwrap_or_default() == wanted.user.as_deref().unwrap_or_default()
        && actual.healthcheck == wanted.healthcheck
        && sorted(host.binds.as_deref()) == sorted(wanted_host.binds.as_deref())
        && ports(host.port_bindings.as_ref()) == ports(wanted_host.port_bindings.as_ref())
        && host.network_mode == wanted_host.network_mode
        && host.restart_policy == wanted_host.restart_policy
}

fn resolve_environment(
    project_env: &HashMap<String, String>,
    compose_dir: &std::path::Path,
    service: &ComposeService,
    process_env: impl Fn(&str) -> Option<String>,
) -> Result<HashMap<String, String>, XtaskError> {
    let mut env = HashMap::new();
    for path in service.env_file.as_slice() {
        env.extend(load_env_file(&compose_dir.join(path))?);
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
    use bollard::models::ContainerConfig;

    #[test]
    #[ignore = "requires Docker and XTASK_DOCKER_TEST_IMAGE pointing to a PostgreSQL image"]
    fn docker_configuration_stays_stable_without_secret_labels() {
        let image = std::env::var("XTASK_DOCKER_TEST_IMAGE").expect("explicit test image required");
        let suffix = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let name = format!("self-tools-compose-test-{suffix}");
        crate::block_on(async {
            let docker = bollard::Docker::connect_with_local_defaults()?;
            let mut service = ComposeService {
                image: Some(image),
                container_name: Some(name.clone()),
                environment: HashMap::from([(
                    "POSTGRES_PASSWORD".into(),
                    Some("fixture-password".into()),
                )]),
                healthcheck: Some(crate::compose_types::Healthcheck {
                    test: vec![
                        "CMD".into(),
                        "pg_isready".into(),
                        "-h".into(),
                        "127.0.0.1".into(),
                        "-U".into(),
                        "postgres".into(),
                    ],
                    interval: "1s".into(),
                    timeout: "2s".into(),
                    retries: 5,
                    start_period: "1s".into(),
                }),
                ..Default::default()
            };
            let compose = ComposeFile {
                _version: None,
                services: HashMap::new(),
                volumes: HashMap::new(),
            };
            let project_env = HashMap::from([("UNDECLARED_SECRET".into(), "must-not-leak".into())]);
            let runtime = ComposeRuntime {
                docker: &docker,
                compose: &compose,
                env_from_file: &project_env,
                compose_dir: std::path::Path::new("."),
                network_name: &name,
                project_name: &name,
            };
            let desired = prepare(&runtime, "postgres", &service).await?;
            super::super::resources::ensure_network(&docker, &name, &name).await?;
            ensure_service_running(&runtime, &desired).await?;
            super::super::readiness::wait(&runtime, "postgres", &name, true).await?;
            let details = docker.inspect_container(&name, None).await?;
            assert!(
                matches_configuration(&details, &desired),
                "Docker defaults must not cause repeated replacement"
            );
            assert!(
                !env_map(details.config.as_ref().unwrap().env.as_deref())
                    .contains_key("UNDECLARED_SECRET")
            );
            assert!(
                !details
                    .config
                    .as_ref()
                    .unwrap()
                    .labels
                    .as_ref()
                    .unwrap()
                    .values()
                    .any(|v| v.contains("fixture-password"))
            );
            ensure_service_running(&runtime, &desired).await?;
            assert_eq!(docker.inspect_container(&name, None).await?.id, details.id);
            service
                .environment
                .insert("POSTGRES_PASSWORD".into(), Some("rotated-fixture".into()));
            let rotated = prepare(&runtime, "postgres", &service).await?;
            assert!(!matches_configuration(&details, &rotated));
            docker
                .stop_container(&name, Some(StopContainerOptionsBuilder::new().build()))
                .await?;
            docker
                .remove_container(
                    &name,
                    Some(RemoveContainerOptionsBuilder::new().v(true).build()),
                )
                .await?;
            docker.remove_network(&name).await?;
            Ok(())
        })
        .unwrap();
    }

    #[test]
    fn environment_is_explicit_and_preserves_precedence_and_empty_values() {
        let service: ComposeService = serde_yaml::from_str(
            "environment:\n  INHERIT: null\n  EMPTY: null\n  FIXED: literal\n  MISSING: null\n",
        )
        .unwrap();
        let project = HashMap::from([
            ("INHERIT".into(), "project".into()),
            ("SECRET".into(), "do-not-leak".into()),
        ]);
        let env = resolve_environment(&project, std::path::Path::new("."), &service, |key| {
            (key == "EMPTY").then(String::new)
        })
        .unwrap();
        assert_eq!(
            env,
            HashMap::from([
                ("INHERIT".into(), "project".into()),
                ("EMPTY".into(), "".into()),
                ("FIXED".into(), "literal".into())
            ])
        );
        let compose: ComposeFile = serde_yaml::from_str(include_str!(
            "../../../../../../docker/compose/docker-compose.yml"
        ))
        .unwrap();
        for service in compose.services.values() {
            assert!(service.env_file.as_slice().is_empty());
        }
        let login = &compose.services["login"];
        assert_eq!(login.environment.len(), 6);
        for name in ["web", "login", "auth", "bookmarks", "collections"] {
            let service = &compose.services[name];
            for key in [
                "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
                "OTEL_EXPORTER_OTLP_TRACES_HEADERS",
                "OTEL_EXPORTER_OTLP_TRACES_TIMEOUT",
                "OTEL_TRACES_SAMPLER",
                "OTEL_TRACES_SAMPLER_ARG",
            ] {
                assert_eq!(service.environment.get(key), Some(&None));
            }
            let absent =
                resolve_environment(&HashMap::new(), std::path::Path::new("."), service, |_| {
                    None
                })
                .unwrap();
            assert!(absent.keys().all(|key| !key.starts_with("OTEL_")));
        }
        assert_eq!(login.environment.get("AUTH_ORIGIN"), Some(&None));
    }

    #[test]
    fn configuration_comparison_catches_secret_rotation_and_removes_legacy_exposure() {
        let env = vec!["PASSWORD=first".into(), "PATH=/usr/bin".into()];
        let host = HostConfig::default();
        let labels = HashMap::from([(COMPOSE_PROJECT_LABEL.into(), "test".into())]);
        let desired = DesiredContainer {
            name: "test".into(),
            body: ContainerCreateBody {
                image: Some("sha256:one".into()),
                env: Some(env.clone()),
                host_config: Some(host.clone()),
                labels: Some(labels.clone()),
                ..Default::default()
            },
        };
        let mut details = ContainerInspectResponse {
            image: desired.body.image.clone(),
            host_config: Some(host),
            config: Some(ContainerConfig {
                env: Some(env),
                labels: Some(labels),
                ..Default::default()
            }),
            ..Default::default()
        };
        assert!(matches_configuration(&details, &desired));
        details
            .config
            .as_mut()
            .unwrap()
            .env
            .as_mut()
            .unwrap()
            .push("OLD_UNDECLARED=secret".into());
        assert!(!matches_configuration(&details, &desired));
        details.config.as_mut().unwrap().env =
            Some(vec!["PASSWORD=rotated".into(), "PATH=/usr/bin".into()]);
        assert!(!matches_configuration(&details, &desired));
        details.config.as_mut().unwrap().env = desired.body.env.clone();
        details
            .config
            .as_mut()
            .unwrap()
            .labels
            .as_mut()
            .unwrap()
            .insert(LEGACY_SIGNATURE.into(), "secret".into());
        assert!(!matches_configuration(&details, &desired));
        assert!(
            !desired
                .body
                .labels
                .as_ref()
                .unwrap()
                .values()
                .any(|v| v.contains("first"))
        );
    }
}
