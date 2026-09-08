use nom::{
    Parser,
    bytes::complete::take_till1,
    character::complete::char,
    combinator::{all_consuming, rest},
    sequence::separated_pair,
};
use std::{collections::HashMap, process::Command};
use tracing::{Level, event};
use url::Url;

use crate::{BuildOptions, TaskResult, context::workspace_root, error::XtaskError};

pub fn run(options: BuildOptions) -> TaskResult {
    let root = workspace_root();
    // Buildx owns .dockerignore processing before anything is sent to Docker.
    // Do not reconstruct or upload a tar of the unfiltered workspace.

    let build_args = collect_build_args(&options);
    if build_args.values().any(|value| value.contains('@')) {
        return Err(XtaskError::CredentialBuildArgument);
    }

    event!(Level::INFO, tag = options.tag, "building service images");
    let mut command = Command::new("docker");
    command.current_dir(&root).env("TAG", &options.tag).args([
        "buildx",
        "bake",
        "--file",
        "docker/docker-bake.hcl",
        "--load",
    ]);
    // Keep the host CLI proxy separate from the rewritten container proxy.
    for (key, value) in &build_args {
        command.arg("--set").arg(format!("*.args.{key}={value}"));
    }
    if !command.status()?.success() {
        return Err(XtaskError::BuildFailed {
            image: "service images".into(),
        });
    }

    Ok(())
}

fn collect_build_args(options: &BuildOptions) -> HashMap<String, String> {
    let mut args = HashMap::new();

    insert_proxy_arg(&mut args, "HTTP_PROXY", options.http_proxy.as_deref(), true);
    insert_proxy_arg(
        &mut args,
        "HTTPS_PROXY",
        options.https_proxy.as_deref(),
        true,
    );
    insert_proxy_arg(&mut args, "NO_PROXY", options.no_proxy.as_deref(), false);

    if let Some(url) = options
        .debian_mirror_url
        .as_deref()
        .map(str::trim)
        .filter(|v| !v.is_empty())
    {
        args.insert("APT_MIRROR".to_string(), url.to_string());
    }

    args
}

fn insert_proxy_arg(
    args: &mut HashMap<String, String>,
    upper_name: &str,
    value: Option<&str>,
    normalize_localhost: bool,
) {
    if let Some(value) = value.map(str::trim).filter(|v| !v.is_empty()) {
        let value = if normalize_localhost {
            rewrite_local_proxy_for_docker_build(value)
        } else {
            value.to_string()
        };

        args.insert(upper_name.to_string(), value.clone());
        args.insert(upper_name.to_ascii_lowercase(), value);
    }
}

fn rewrite_local_proxy_for_docker_build(value: &str) -> String {
    if let Some(rewritten) = rewrite_proxy_url_host(value) {
        return rewritten;
    }

    if let Some((host, rest)) = parse_host_and_rest(value)
        && is_local_host(host)
    {
        let docker_host = docker_proxy_host();
        return format!("{docker_host}:{rest}");
    }

    value.to_string()
}

fn parse_host_and_rest(value: &str) -> Option<(&str, &str)> {
    let (_, parsed) = all_consuming(host_and_rest_parser).parse(value).ok()?;
    Some(parsed)
}

fn host_and_rest_parser(input: &str) -> nom::IResult<&str, (&str, &str)> {
    separated_pair(take_till1(|c| c == ':'), char(':'), rest).parse(input)
}

fn rewrite_proxy_url_host(value: &str) -> Option<String> {
    let mut parsed = Url::parse(value).ok()?;
    let host = parsed.host_str()?;
    if !is_local_host(host) {
        return None;
    }

    let docker_host = docker_proxy_host();
    parsed.set_host(Some(&docker_host)).ok()?;
    Some(parsed.to_string())
}

fn docker_proxy_host() -> String {
    std::env::var("XTASK_DOCKER_PROXY_HOST")
        .ok()
        .filter(|v| !v.is_empty())
        .unwrap_or_else(|| "host.docker.internal".to_string())
}

fn is_local_host(host: &str) -> bool {
    host.eq_ignore_ascii_case("localhost") || host == "127.0.0.1" || host == "::1"
}

#[cfg(test)]
mod tests {
    use super::{collect_build_args, rewrite_local_proxy_for_docker_build};
    use crate::BuildOptions;

    #[test]
    fn rewrites_loopback_proxy_url_to_docker_host() {
        let input = "http://127.0.0.1:7890";
        let rewritten = rewrite_local_proxy_for_docker_build(input);
        assert_eq!(rewritten, "http://host.docker.internal:7890/");
    }

    #[test]
    fn keeps_non_loopback_proxy_url() {
        let input = "http://10.0.0.2:7890";
        let rewritten = rewrite_local_proxy_for_docker_build(input);
        assert_eq!(rewritten, input);
    }

    #[test]
    fn rewrites_plain_localhost_proxy() {
        let input = "localhost:7890";
        let rewritten = rewrite_local_proxy_for_docker_build(input);
        assert_eq!(rewritten, "host.docker.internal:7890");
    }

    #[test]
    fn build_args_use_explicit_flags_not_env() {
        let options = BuildOptions {
            http_proxy: Some("http://127.0.0.1:7890".to_string()),
            https_proxy: Some("http://127.0.0.1:7890".to_string()),
            no_proxy: Some("localhost,127.0.0.1".to_string()),
            debian_mirror_url: Some("http://mirrors.tuna.tsinghua.edu.cn".to_string()),
            tag: "test".into(),
        };

        let args = collect_build_args(&options);
        assert_eq!(
            args.get("HTTP_PROXY"),
            Some(&"http://host.docker.internal:7890/".to_string())
        );
        assert_eq!(
            args.get("HTTPS_PROXY"),
            Some(&"http://host.docker.internal:7890/".to_string())
        );
        assert_eq!(
            args.get("NO_PROXY"),
            Some(&"localhost,127.0.0.1".to_string())
        );
        assert_eq!(
            args.get("APT_MIRROR"),
            Some(&"http://mirrors.tuna.tsinghua.edu.cn".to_string())
        );
    }
}
