use bollard::{
    body_full,
    query_parameters::{BuildImageOptionsBuilder, BuilderVersion},
    Docker,
};
use futures_util::TryStreamExt;
use tracing::{event, Level};

use crate::{
    context::{build_context_tar, workspace_root},
    TaskResult,
};

pub async fn run() -> TaskResult {
    let root = workspace_root();
    let docker = Docker::connect_with_local_defaults()?;
    let context = build_context_tar(&root)?;

    let builds = [
        (
            "./docker/server/collections.Dockerfile",
            "suxiaoshao/collections",
        ),
        ("./docker/server/auth.Dockerfile", "suxiaoshao/auth"),
        ("./docker/server/login.Dockerfile", "suxiaoshao/login"),
        (
            "./docker/server/bookmarks.Dockerfile",
            "suxiaoshao/bookmarks",
        ),
        ("./docker/server/gateway.Dockerfile", "suxiaoshao/gateway"),
    ];

    for (index, (dockerfile, image)) in builds.into_iter().enumerate() {
        event!(Level::INFO, dockerfile, image, "building image");

        let session = format!("xtask-build-{index}");
        let options = BuildImageOptionsBuilder::new()
            .dockerfile(dockerfile.trim_start_matches("./"))
            .t(image)
            .rm(true)
            .version(BuilderVersion::BuilderBuildKit)
            .session(&session)
            .build();

        docker
            .build_image(options, None, Some(body_full(context.clone().into())))
            .try_collect::<Vec<_>>()
            .await?;
    }

    Ok(())
}
