//! Bounded synchronous database execution. Transactions belong to the caller's use case.
use diesel::{
    PgConnection,
    r2d2::{ConnectionManager, Pool},
};
use service_errors::{Fault, FaultKind};
use std::sync::Arc;
use tokio::sync::Semaphore;

pub type PgPool = Pool<ConnectionManager<PgConnection>>;

#[derive(Clone)]
pub struct Database {
    pool: PgPool,
    executor: Executor,
}

impl Database {
    pub fn new(pool: PgPool) -> Self {
        let executor = Executor(Arc::new(Semaphore::new(pool.max_size() as usize)));
        Self { pool, executor }
    }

    pub async fn run<T, E, F>(&self, operation: &'static str, work: F) -> Result<T, E>
    where
        T: Send + 'static,
        E: From<Fault> + Send + 'static,
        F: FnOnce(&mut PgConnection) -> Result<T, E> + Send + 'static,
    {
        let pool = self.pool.clone();
        self.executor
            .run(operation, move || {
                let mut connection = pool
                    .get()
                    .map_err(|e| Fault::new(FaultKind::Pool, operation, e))?;
                work(&mut connection)
            })
            .await
    }
}

#[derive(Clone)]
struct Executor(Arc<Semaphore>);
impl Executor {
    async fn run<T, E>(
        &self,
        operation: &'static str,
        work: impl FnOnce() -> Result<T, E> + Send + 'static,
    ) -> Result<T, E>
    where
        T: Send + 'static,
        E: From<Fault> + Send + 'static,
    {
        let permit = self
            .0
            .clone()
            .acquire_owned()
            .await
            .map_err(|e| Fault::new(FaultKind::Task, operation, e))?;
        let span = tracing::Span::current();
        tokio::task::spawn_blocking(move || {
            let _permit = permit;
            let _span = span.enter();
            work()
        })
        .await
        .map_err(|e| Fault::new(FaultKind::Task, operation, e))?
    }
}

#[cfg(test)]
mod tests;
