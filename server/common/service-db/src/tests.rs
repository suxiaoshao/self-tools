use super::*;
use std::time::Duration;

#[tokio::test(flavor = "current_thread")]
async fn cancellation_keeps_running_work_bounded_and_runtime_responsive() {
    let executor = Executor(Arc::new(Semaphore::new(1)));
    let (entered, ready) = tokio::sync::oneshot::channel();
    let (release, blocked) = std::sync::mpsc::channel();
    let first = executor.clone();
    let task = tokio::spawn(async move {
        first
            .run("test", move || -> Result<(), Fault> {
                entered.send(()).unwrap();
                blocked.recv().unwrap();
                Ok(())
            })
            .await
    });
    tokio::time::timeout(Duration::from_secs(2), ready)
        .await
        .unwrap()
        .unwrap();
    task.abort();
    assert!(task.await.unwrap_err().is_cancelled());
    assert_eq!(executor.0.available_permits(), 0);
    let queued = executor.run("queued", || Ok::<_, Fault>(()));
    assert!(
        tokio::time::timeout(Duration::from_millis(30), queued)
            .await
            .is_err()
    );
    release.send(()).unwrap();
    tokio::time::timeout(
        Duration::from_secs(2),
        executor.run("next", || Ok::<_, Fault>(())),
    )
    .await
    .unwrap()
    .unwrap();
    assert_eq!(executor.0.available_permits(), 1);
}

#[tokio::test]
async fn panic_and_returned_error_release_the_permit() {
    let executor = Executor(Arc::new(Semaphore::new(1)));
    let result = executor
        .run("panic", || -> Result<(), Fault> {
            panic!("controlled failure")
        })
        .await;
    assert!(matches!(result.unwrap_err().kind, FaultKind::Task));
    let result = executor
        .run("failure", || Err::<(), _>(Fault::internal("controlled")))
        .await;
    assert!(matches!(result.unwrap_err().kind, FaultKind::Internal));
    assert_eq!(executor.0.available_permits(), 1);
    executor.run("next", || Ok::<_, Fault>(())).await.unwrap();
}
