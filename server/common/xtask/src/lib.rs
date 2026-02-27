use std::path::PathBuf;
use std::{thread, time::Duration};

use tokio::runtime::Builder as RuntimeBuilder;
use tracing::{Level, event};

mod compose_types;
mod context;
mod error;
mod tasks;

pub use error::XtaskError;

pub type TaskResult = Result<(), XtaskError>;

#[derive(Debug, Clone, Default)]
pub struct BuildOptions {
    pub http_proxy: Option<String>,
    pub https_proxy: Option<String>,
    pub no_proxy: Option<String>,
    pub debian_mirror_url: Option<String>,
}

#[derive(Debug, Clone)]
pub enum Task {
    Build(BuildOptions),
    Compose {
        retries: usize,
    },
    Lint,
    Cert {
        output_dir: PathBuf,
        domains: Vec<String>,
    },
}

pub fn run(task: Task) -> TaskResult {
    match task {
        Task::Build(options) => block_on(tasks::build::run(options)),
        Task::Compose { retries } => run_compose_with_retry(retries),
        Task::Lint => tasks::lint::run(),
        Task::Cert {
            output_dir,
            domains,
        } => tasks::cert::run(output_dir, domains),
    }
}

fn run_compose_with_retry(retries: usize) -> TaskResult {
    let max_attempts = retries.saturating_add(1);

    for attempt in 1..=max_attempts {
        let result = block_on(tasks::compose::run_once());
        if result.is_ok() {
            if attempt > 1 {
                event!(Level::INFO, attempt, "compose eventually succeeded");
            }
            return Ok(());
        }

        if attempt < max_attempts {
            event!(Level::WARN, attempt, "compose attempt failed, retrying");
            thread::sleep(Duration::from_secs(1));
        }
    }

    Err(XtaskError::ComposeFailed {
        attempts: max_attempts,
    })
}

fn block_on<F>(future: F) -> TaskResult
where
    F: std::future::Future<Output = TaskResult>,
{
    RuntimeBuilder::new_current_thread()
        .enable_all()
        .build()
        .map_err(XtaskError::Runtime)?
        .block_on(future)
}
