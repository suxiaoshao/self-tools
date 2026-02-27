use std::collections::{HashMap, HashSet};

use crate::compose_types::ComposeService;
use crate::error::XtaskError;

pub(super) fn resolve_order(
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
