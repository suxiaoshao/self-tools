use crate::logging::SafeJsonLayer;
use opentelemetry::trace::TracerProvider;
use opentelemetry_otlp::{WithExportConfig, WithHttpConfig};
use opentelemetry_sdk::{
    Resource,
    trace::{BatchConfigBuilder, BatchSpanProcessor, Sampler, SdkTracerProvider},
};
use std::time::Duration;
use tracing_subscriber::{filter::filter_fn, prelude::*};

#[derive(Debug, thiserror::Error)]
pub enum InitError {
    #[error("invalid telemetry configuration: {0}")]
    Config(&'static str),
    #[error("telemetry initialization failed")]
    Build(#[source] service_errors::Fault),
    #[error("telemetry initialization thread failed")]
    Thread,
    #[error("a tracing subscriber is already installed")]
    Subscriber,
}
#[derive(Debug, thiserror::Error)]
#[error("telemetry shutdown did not complete")]
pub struct ShutdownError;

pub struct TelemetryGuard {
    provider: SdkTracerProvider,
}
impl TelemetryGuard {
    pub fn shutdown(self) -> Result<(), ShutdownError> {
        self.provider
            .shutdown_with_timeout(Duration::from_secs(5))
            .map_err(|_| ShutdownError)
    }
}

pub fn init(service_name: &'static str) -> Result<TelemetryGuard, InitError> {
    let config = Config::read(|name| std::env::var(name))?;
    // reqwest::blocking creates its own runtime and must be constructed outside a Tokio context.
    let provider = std::thread::Builder::new()
        .name("telemetry-init".into())
        .spawn(move || build_provider(service_name, config))
        .map_err(|_| InitError::Thread)?
        .join()
        .map_err(|_| InitError::Thread)??;
    let bridge = tracing_opentelemetry::layer()
        .with_tracer(provider.tracer(service_name))
        .with_location(false)
        .with_tracked_inactivity(false)
        .with_filter(filter_fn(|metadata| {
            metadata.is_span()
                && metadata.target() == "telemetry"
                && metadata
                    .fields()
                    .iter()
                    .all(|field| field.name() == "otel.kind")
        }));
    if tracing_subscriber::registry()
        .with(bridge)
        .with(SafeJsonLayer {
            service: service_name,
        })
        .try_init()
        .is_err()
    {
        let _ = provider.shutdown_with_timeout(Duration::from_secs(5));
        return Err(InitError::Subscriber);
    }
    Ok(TelemetryGuard { provider })
}

struct Config {
    endpoint: Option<String>,
    timeout: Duration,
    sampler: Sampler,
}
impl Config {
    fn read(
        mut get: impl FnMut(&str) -> Result<String, std::env::VarError>,
    ) -> Result<Self, InitError> {
        let mut value = |name: &str| get(name).ok().filter(|v| !v.is_empty());
        let endpoint = value("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT");
        if let Some(endpoint) = &endpoint {
            validate_endpoint(endpoint)?;
        }
        let timeout = value("OTEL_EXPORTER_OTLP_TRACES_TIMEOUT")
            .map(|v| v.parse::<u64>())
            .transpose()
            .map_err(|_| InitError::Config("OTEL_EXPORTER_OTLP_TRACES_TIMEOUT"))?
            .unwrap_or(3000);
        if !(1..=10_000).contains(&timeout) {
            return Err(InitError::Config("OTEL_EXPORTER_OTLP_TRACES_TIMEOUT"));
        }
        let sampler = match value("OTEL_TRACES_SAMPLER")
            .as_deref()
            .unwrap_or("parentbased_always_on")
        {
            "parentbased_always_on" => Sampler::AlwaysOn,
            "parentbased_always_off" => Sampler::AlwaysOff,
            "parentbased_traceidratio" => {
                let ratio = value("OTEL_TRACES_SAMPLER_ARG")
                    .and_then(|v| v.parse::<f64>().ok())
                    .filter(|v| (0.0..=1.0).contains(v))
                    .ok_or(InitError::Config("OTEL_TRACES_SAMPLER_ARG"))?;
                Sampler::TraceIdRatioBased(ratio)
            }
            _ => return Err(InitError::Config("OTEL_TRACES_SAMPLER")),
        };
        // These SDK environment fallbacks cannot be overridden through its builder. Reject
        // unsupported knobs instead of silently accepting a second configuration contract.
        if endpoint.is_some() {
            for name in [
                "OTEL_EXPORTER_OTLP_HEADERS",
                "OTEL_EXPORTER_OTLP_COMPRESSION",
                "OTEL_EXPORTER_OTLP_TRACES_COMPRESSION",
                "OTEL_EXPORTER_OTLP_PROTOCOL",
                "OTEL_EXPORTER_OTLP_TRACES_PROTOCOL",
            ] {
                if value(name).is_some() {
                    return Err(InitError::Config(name));
                }
            }
        }
        Ok(Self {
            endpoint,
            timeout: Duration::from_millis(timeout),
            sampler: Sampler::ParentBased(Box::new(sampler)),
        })
    }
}
fn validate_endpoint(endpoint: &str) -> Result<(), InitError> {
    let valid = url::Url::parse(endpoint).ok().is_some_and(|url| {
        matches!(url.scheme(), "http" | "https")
            && url.host_str().is_some()
            && url.username().is_empty()
            && url.password().is_none()
            && url.path() != "/"
            && url.fragment().is_none()
    });
    if valid {
        Ok(())
    } else {
        Err(InitError::Config("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT"))
    }
}
fn build_provider(
    service_name: &'static str,
    config: Config,
) -> Result<SdkTracerProvider, InitError> {
    let mut provider = SdkTracerProvider::builder()
        .with_sampler(config.sampler)
        .with_resource(
            Resource::builder_empty()
                .with_service_name(service_name)
                .build(),
        )
        .with_max_attributes_per_span(32)
        .with_max_events_per_span(32)
        .with_max_links_per_span(16);
    if let Some(endpoint) = config.endpoint {
        let client = reqwest::blocking::Client::builder()
            .timeout(config.timeout)
            .build()
            .map_err(|source| build_error("telemetry_client", source))?;
        let exporter = opentelemetry_otlp::SpanExporter::builder()
            .with_http()
            .with_protocol(opentelemetry_otlp::Protocol::HttpBinary)
            .with_endpoint(endpoint)
            .with_timeout(config.timeout)
            .with_http_client(client)
            .build()
            .map_err(|source| build_error("telemetry_exporter", source))?;
        let processor = BatchSpanProcessor::builder(exporter)
            .with_batch_config(
                BatchConfigBuilder::default()
                    .with_max_queue_size(2048)
                    .with_max_export_batch_size(512)
                    .with_scheduled_delay(Duration::from_secs(5))
                    .build(),
            )
            .build();
        provider = provider.with_span_processor(processor);
    }
    Ok(provider.build())
}
fn build_error(
    operation: &'static str,
    source: impl std::error::Error + Send + Sync + 'static,
) -> InitError {
    InitError::Build(service_errors::Fault::new(
        service_errors::FaultKind::Internal,
        operation,
        source,
    ))
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn configuration_errors_are_safe_and_optional_export_is_explicit() {
        assert!(
            Config::read(|_| Err(std::env::VarError::NotPresent))
                .unwrap()
                .endpoint
                .is_none()
        );
        for input in [
            "http://user:secret@example.com/v1/traces",
            "secret",
            "https://example.com/",
        ] {
            let error = validate_endpoint(input).unwrap_err();
            assert!(!format!("{error:?} {error}").contains("secret"));
        }
        for (name, value) in [
            ("OTEL_TRACES_SAMPLER", "invalid"),
            ("OTEL_EXPORTER_OTLP_TRACES_TIMEOUT", "10001"),
        ] {
            assert!(
                Config::read(|key| if key == name {
                    Ok(value.into())
                } else {
                    Err(std::env::VarError::NotPresent)
                })
                .is_err()
            );
        }
    }
}
