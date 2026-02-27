use bollard::models::ContainerInspectResponse;
use bollard::models::RestartPolicyNameEnum;
use nom::{
    IResult, Parser,
    branch::alt,
    bytes::complete::{tag, take_till, take_till1},
    character::complete::{char, one_of, satisfy},
    combinator::{all_consuming, opt, recognize, rest},
    multi::separated_list1,
    sequence::{pair, preceded},
};

use crate::compose_types::ComposeFile;

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

pub(super) fn parse_port_binding(input: &str) -> (String, String) {
    let Ok((_, parts)) = all_consuming(parse_port_segments).parse(input) else {
        return ("".to_string(), "".to_string());
    };

    if parts.len() == 1 {
        let value = parts[0].to_string();
        return (value.clone(), value);
    }

    let host = parts[parts.len() - 2].to_string();
    let container = parts[parts.len() - 1].to_string();
    (host, container)
}

fn parse_port_segments(input: &str) -> IResult<&str, Vec<&str>> {
    separated_list1(char(':'), take_till1(|c| c == ':')).parse(input)
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
            },
        );
        let compose = ComposeFile {
            services: HashMap::new(),
            volumes,
        };
        let bind = resolve_volume_bind("postgres:/var/lib/postgresql/data/pgdata", &compose);
        assert_eq!(bind, "postgres_data:/var/lib/postgresql/data/pgdata");
    }

    #[test]
    fn parse_port_binding_supports_single_and_pair_and_triplet() {
        assert_eq!(
            parse_port_binding("80"),
            ("80".to_string(), "80".to_string())
        );
        assert_eq!(
            parse_port_binding("8080:80"),
            ("8080".to_string(), "80".to_string())
        );
        assert_eq!(
            parse_port_binding("127.0.0.1:8080:80"),
            ("8080".to_string(), "80".to_string())
        );
    }
}
