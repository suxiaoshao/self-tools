use std::path::PathBuf;
use std::process;

use clap::{Parser, Subcommand};
use tracing::{event, metadata::LevelFilter, Level};
use tracing_subscriber::{
    fmt, prelude::__tracing_subscriber_SubscriberExt, util::SubscriberInitExt, Layer,
};
use xtask::{run, Task};

#[derive(Debug, Parser)]
#[command(name = "xtask")]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Debug, Subcommand)]
enum Commands {
    Build,
    Compose,
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
        Commands::Build => Task::Build,
        Commands::Compose => Task::Compose,
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
