use std::path::PathBuf;
use std::process;

use clap::{Parser, Subcommand};
use tracing::{Level, event, metadata::LevelFilter};
use tracing_subscriber::{
    Layer, fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt,
};
use xtask::{BuildOptions, Task, run};

#[derive(Debug, Parser)]
#[command(name = "xtask")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    Build {
        #[arg(long = "http-proxy", value_name = "URL")]
        http_proxy: Option<String>,
        #[arg(long = "https-proxy", value_name = "URL")]
        https_proxy: Option<String>,
        #[arg(long = "no-proxy", value_name = "VALUE")]
        no_proxy: Option<String>,
        #[arg(long = "debian-mirror-url", value_name = "URL")]
        debian_mirror_url: Option<String>,
    },
    Compose {
        #[arg(long = "retries", default_value_t = 0, value_name = "N")]
        retries: usize,
    },
    Lint,
    Cert {
        #[arg(long = "out-dir", default_value = "docker/compose/certs")]
        out_dir: PathBuf,
        #[arg(long = "domain", value_name = "DOMAIN")]
        domains: Vec<String>,
    },
}

fn main() {
    tracing_subscriber::registry()
        .with(fmt::layer().with_filter(LevelFilter::INFO))
        .init();

    let cli = Cli::parse();
    let task = match cli.command {
        Commands::Build {
            http_proxy,
            https_proxy,
            no_proxy,
            debian_mirror_url,
        } => Task::Build(BuildOptions {
            http_proxy,
            https_proxy,
            no_proxy,
            debian_mirror_url,
        }),
        Commands::Compose { retries } => Task::Compose { retries },
        Commands::Lint => Task::Lint,
        Commands::Cert { out_dir, domains } => Task::Cert {
            output_dir: out_dir,
            domains,
        },
    };

    event!(Level::INFO, ?task, "xtask start");

    if let Err(err) = run(task.clone()) {
        event!(Level::ERROR, error = %err, "xtask failed");
        process::exit(1);
    }

    event!(Level::INFO, ?task, "xtask done");
}
