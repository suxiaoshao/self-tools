use bollard::models::ContainerInspectResponse;
use bollard::models::RestartPolicyNameEnum;
use nom::{
    IResult, Parser,
    branch::alt,
    bytes::complete::{tag, take_till, take_till1},
    character::complete::{char, one_of, satisfy},
    combinator::{all_consuming, opt, recognize, rest},
    sequence::{pair, preceded},
};

use crate::{compose_types::ComposeFile, error::XtaskError};

pub(super) fn resolve_volume_bind(volume: &str, compose: &ComposeFile) -> String {
    let Some((source, target, options)) = split_volume_spec(volume) else {
        return volume.to_string();
    };

    if is_bind_mount_source(&source) {
        return volume.to_string();
    }

    let resolved_source = compose
        .volumes
        .get(source.as_str())
        .and_then(|v| v.name.as_ref())
        .cloned()
        .unwrap_or(source);

    if target.is_empty() {
        resolved_source
    } else if let Some(options) = options {
        format!("{resolved_source}:{target}:{options}")
    } else {
        format!("{resolved_source}:{target}")
    }
}

fn split_volume_spec(volume: &str) -> Option<(String, String, Option<String>)> {
    let (_, (source, target, options)) = all_consuming(volume_spec_parser).parse(volume).ok()?;
    Some((
        source.to_string(),
        target.to_string(),
        options.map(str::to_string),
    ))
}

fn volume_spec_parser(input: &str) -> IResult<&str, (&str, &str, Option<&str>)> {
    let (input, source) = alt((windows_drive_source_parser, generic_source_parser)).parse(input)?;
    let (input, _) = char(':').parse(input)?;
    let (input, target) = take_till(|c| c == ':').parse(input)?;
    let (input, options) = opt(preceded(char(':'), rest)).parse(input)?;
    Ok((input, (source, target, options)))
}

fn generic_source_parser(input: &str) -> IResult<&str, &str> {
    take_till1(|c| c == ':').parse(input)
}

fn windows_drive_source_parser(input: &str) -> IResult<&str, &str> {
    recognize((
        satisfy(|c| c.is_ascii_alphabetic()),
        char(':'),
        one_of("/\\"),
        take_till(|c| c == ':'),
    ))
    .parse(input)
}

fn is_bind_mount_source(source: &str) -> bool {
    all_consuming(bind_mount_source_parser)
        .parse(source)
        .is_ok()
}

fn bind_mount_source_parser(input: &str) -> IResult<&str, &str> {
    alt((
        windows_drive_source_parser,
        recognize(pair(char('/'), rest)),
        recognize(pair(tag("./"), rest)),
        recognize(pair(tag("../"), rest)),
    ))
    .parse(input)
}

#[derive(Debug, PartialEq, Eq)]
pub(super) struct PublishedPort {
    pub host_ip: String,
    pub host_port: String,
    pub container_port: String,
}

pub(super) fn parse_port_binding(input: &str) -> Result<PublishedPort, XtaskError> {
    let parts: Vec<_> = input.split(':').collect();
    let (host_ip, host, container) = match parts.as_slice() {
        [host, container] => ("0.0.0.0", *host, *container),
        [ip, host, container] if ip.parse::<std::net::Ipv4Addr>().is_ok() => {
            (*ip, *host, *container)
        }
        _ => return Err(XtaskError::InvalidPort),
    };
    for value in [host, container] {
        if value.parse::<u16>().ok().filter(|v| *v > 0).is_none() {
            return Err(XtaskError::InvalidPort);
        }
    }
    Ok(PublishedPort {
        host_ip: host_ip.into(),
        host_port: host.into(),
        container_port: container.into(),
    })
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

#[cfg(test)]
mod tests {
    use std::collections::HashMap;

    use crate::compose_types::{ComposeFile, ComposeVolume};

    use super::{parse_port_binding, resolve_volume_bind, split_volume_spec};

    #[test]
    fn split_volume_spec_handles_windows_bind_mount() {
        let parsed = split_volume_spec("C:/Users/PC/Documents/config/letsencrypt:/etc/letsencrypt");
        assert_eq!(
            parsed,
            Some((
                "C:/Users/PC/Documents/config/letsencrypt".to_string(),
                "/etc/letsencrypt".to_string(),
                None,
            ))
        );
    }

    #[test]
    fn resolve_volume_bind_preserves_windows_bind_mount() {
        let compose = ComposeFile {
            _version: None,
            services: HashMap::new(),
            volumes: HashMap::new(),
        };
        let bind = resolve_volume_bind(
            "C:/Users/PC/Documents/config/letsencrypt:/etc/letsencrypt",
            &compose,
        );
        assert_eq!(
            bind,
            "C:/Users/PC/Documents/config/letsencrypt:/etc/letsencrypt"
        );
    }

    #[test]
    fn resolve_volume_bind_maps_named_volume() {
        let mut volumes = HashMap::new();
        volumes.insert(
            "postgres".to_string(),
            ComposeVolume {
                name: Some("postgres_data".to_string()),
                external: false,
                exclusive: false,
            },
        );
        let compose = ComposeFile {
            _version: None,
            services: HashMap::new(),
            volumes,
        };
        let bind = resolve_volume_bind("postgres:/var/lib/postgresql/data/pgdata", &compose);
        assert_eq!(bind, "postgres_data:/var/lib/postgresql/data/pgdata");
    }

    #[test]
    fn published_port_keeps_host_ip_and_rejects_unsupported_forms() {
        let port = parse_port_binding("127.0.0.1:5432:5432").unwrap();
        assert_eq!(port.host_ip, "127.0.0.1");
        assert_eq!(port.host_port, "5432");
        assert_eq!(port.container_port, "5432");
        assert_eq!(parse_port_binding("8080:80").unwrap().host_ip, "0.0.0.0");
        for input in [
            "80",
            "",
            "bad:80:80",
            "0:80",
            "99999:80",
            "127.0.0.1::80",
            "[::1]:5432:5432",
            "53:53/udp",
        ] {
            assert!(parse_port_binding(input).is_err());
        }
    }
}
