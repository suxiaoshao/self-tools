use std::{thread, time::Duration};

use tokio::runtime::Builder as RuntimeBuilder;
use tracing::{event, Level};

mod compose_types;
mod context;
mod error;
mod tasks;

pub use error::XtaskError;

pub type TaskResult = Result<(), XtaskError>;

#[derive(Debug, Clone, Copy)]
pub enum Task {
    Build,
    Compose,
    Lint,
}

pub fn run(task: Task) -> TaskResult {
    match task {
        Task::Build => block_on(tasks::build::run()),
        Task::Compose => run_compose_with_retry(),
        Task::Lint => tasks::lint::run(),
    }
}

fn run_compose_with_retry() -> TaskResult {
    let max_attempts = 100;

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
