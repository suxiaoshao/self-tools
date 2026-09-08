use super::{ComposeRuntime, helpers::is_running};
use crate::{TaskResult, error::XtaskError};
use bollard::models::{ContainerInspectResponse, HealthStatusEnum};
use std::time::Duration;
use tokio::time::{Instant, sleep};

pub(super) fn ready(
    details: &ContainerInspectResponse,
    healthy: bool,
) -> Result<bool, &'static str> {
    if !is_running(details) || details.state.as_ref().and_then(|s| s.restarting) == Some(true) {
        return Err("container stopped or restarting");
    }
    if !healthy {
        return Ok(true);
    }
    match details
        .state
        .as_ref()
        .and_then(|s| s.health.as_ref())
        .and_then(|h| h.status)
    {
        Some(HealthStatusEnum::HEALTHY) => Ok(true),
        Some(HealthStatusEnum::STARTING) => Ok(false),
        Some(HealthStatusEnum::UNHEALTHY) => Err("healthcheck failed"),
        _ => Err("healthcheck is missing"),
    }
}

pub(super) async fn wait(
    runtime: &ComposeRuntime<'_>,
    service: &str,
    container: &str,
    healthy: bool,
) -> TaskResult {
    let deadline = Instant::now() + Duration::from_secs(90);
    loop {
        let details = runtime.docker.inspect_container(container, None).await?;
        match ready(&details, healthy) {
            Ok(true) => return Ok(()),
            Err(reason) => {
                return Err(XtaskError::NotReady {
                    service: service.into(),
                    reason,
                });
            }
            Ok(false) if Instant::now() >= deadline => {
                return Err(XtaskError::NotReady {
                    service: service.into(),
                    reason: "90 second deadline exceeded",
                });
            }
            Ok(false) => sleep(Duration::from_millis(500)).await,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use bollard::models::{ContainerState, Health};
    #[test]
    fn readiness_is_not_equivalent_to_running() {
        let mut container = ContainerInspectResponse {
            state: Some(ContainerState {
                running: Some(true),
                health: Some(Health {
                    status: Some(HealthStatusEnum::STARTING),
                    ..Default::default()
                }),
                ..Default::default()
            }),
            ..Default::default()
        };
        assert_eq!(ready(&container, true), Ok(false));
        assert_eq!(ready(&container, false), Ok(true));
        container
            .state
            .as_mut()
            .unwrap()
            .health
            .as_mut()
            .unwrap()
            .status = Some(HealthStatusEnum::UNHEALTHY);
        assert!(ready(&container, true).is_err());
        container
            .state
            .as_mut()
            .unwrap()
            .health
            .as_mut()
            .unwrap()
            .status = Some(HealthStatusEnum::HEALTHY);
        assert_eq!(ready(&container, true), Ok(true));
        container.state.as_mut().unwrap().running = Some(false);
        assert!(ready(&container, true).is_err());
    }
}
