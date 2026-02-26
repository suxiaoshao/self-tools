use bollard::models::ContainerInspectResponse;
use bollard::models::RestartPolicyNameEnum;

use crate::compose_types::ComposeFile;

pub(super) fn resolve_volume_bind(volume: &str, compose: &ComposeFile) -> String {
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

pub(super) fn parse_port_binding(input: &str) -> (String, String) {
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

pub(super) fn parse_restart_policy(value: &str) -> RestartPolicyNameEnum {
    match value {
        "no" => RestartPolicyNameEnum::NO,
        "always" => RestartPolicyNameEnum::ALWAYS,
        "unless-stopped" => RestartPolicyNameEnum::UNLESS_STOPPED,
        "on-failure" => RestartPolicyNameEnum::ON_FAILURE,
        _ => RestartPolicyNameEnum::EMPTY,
    }
}

pub(super) fn is_running(details: &ContainerInspectResponse) -> bool {
    details
        .state
        .as_ref()
        .and_then(|s| s.running)
        .unwrap_or(false)
}
