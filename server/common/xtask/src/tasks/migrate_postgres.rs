//! Stage a logical PostgreSQL upgrade without switching or modifying the source.
mod docker;
use crate::{TaskResult, XtaskError, context::workspace_root};
use docker::{Docker, private_file};
use std::{
    collections::BTreeMap,
    fs,
    io::Write,
    path::{Path, PathBuf},
    thread,
    time::Duration,
};

const IMAGE: &str = "postgres:18.6-bookworm@sha256:1c59e2c3c818eaa0f0628f695b36e7c9e362d6b219b36a54a32df645cbd7e1af";

#[derive(Clone, Debug, clap::Args)]
pub struct Options {
    #[arg(long, default_value = "postgres")]
    source: String,
    /// Existing source superuser; local socket authentication must already work.
    #[arg(long)]
    user: String,
    #[arg(long, default_value = "postgres18-staging")]
    target: String,
    #[arg(long, default_value = "postgres18-data")]
    volume: String,
    #[arg(long, default_value = IMAGE)]
    image: String,
    /// New directory outside this repository; its parent must exist.
    #[arg(long)]
    backup_dir: PathBuf,
    #[arg(long)]
    execute: bool,
    /// Assert all application and external writers remain stopped until cutover.
    #[arg(long, requires = "execute")]
    writers_stopped: bool,
}

fn stopped(reason: &'static str) -> XtaskError {
    XtaskError::Migration(reason)
}

fn valid_name(name: &str) -> bool {
    name.as_bytes()
        .first()
        .is_some_and(u8::is_ascii_alphanumeric)
        && name
            .bytes()
            .all(|c| c.is_ascii_alphanumeric() || b"_.-".contains(&c))
}

fn backup_path(path: &Path, root: &Path) -> Result<PathBuf, XtaskError> {
    let absolute = std::path::absolute(path)?;
    let parent = absolute
        .parent()
        .ok_or_else(|| stopped("invalid backup directory"))?
        .canonicalize()?;
    let name = absolute
        .file_name()
        .ok_or_else(|| stopped("invalid backup directory"))?;
    let backup = parent.join(name);
    if backup.starts_with(root.canonicalize()?) {
        return Err(stopped(
            "backup directory must be outside repository/build context",
        ));
    }
    if backup.symlink_metadata().is_ok() {
        return Err(stopped(
            "backup directory already exists; use a new directory",
        ));
    }
    Ok(backup)
}

pub fn run(options: Options) -> TaskResult {
    for name in [&options.source, &options.target, &options.volume] {
        if !valid_name(name) {
            return Err(stopped(
                "container and volume names must be simple Docker names",
            ));
        }
    }
    if options.source == options.target {
        return Err(stopped("source and target must differ"));
    }
    let backup = backup_path(&options.backup_dir, &workspace_root())?;
    if !options.execute {
        println!(
            "Preview: dump all databases/roles from {}; restore to NEW {}",
            options.source, options.target
        );
        println!(
            "Image: {}; NEW volume: {}; private backup: {}",
            options.image,
            options.volume,
            backup.display()
        );
        println!("No Docker commands executed. Execution requires --execute --writers-stopped.");
        return Ok(());
    }
    if !options.writers_stopped {
        return Err(stopped(
            "stop all application/external writers, then pass --writers-stopped",
        ));
    }
    execute(&options, &backup)
}

fn token() -> String {
    rand::random::<[u8; 32]>()
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn write_json(path: &Path, value: &impl serde::Serialize) -> TaskResult {
    let mut file = private_file(path)?;
    serde_json::to_writer_pretty(&mut file, value)
        .map_err(|_| stopped("cannot write migration metadata"))?;
    file.sync_all()?;
    Ok(())
}

type Inventory = BTreeMap<String, BTreeMap<String, u64>>;
fn inventory(docker: &Docker, container: &str, user: &str) -> Result<Inventory, XtaskError> {
    let databases: Vec<String> = serde_json::from_str(&docker.sql(container, user, "postgres",
        "SELECT coalesce(json_agg(datname ORDER BY datname),'[]') FROM pg_database WHERE NOT datistemplate;")?)
        .map_err(|_| stopped("invalid database inventory"))?;
    let mut result = BTreeMap::new();
    for database in databases {
        // PostgreSQL quotes identifiers, including unusual schema/table names.
        let queries: Vec<String> = serde_json::from_str(&docker.sql(container, user, &database,
            "SELECT coalesce(json_agg(format('SELECT count(*) FROM %I.%I',n.nspname,c.relname) ORDER BY n.nspname,c.relname),'[]') FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE c.relkind IN ('r','m') AND n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_toast%';")?)
            .map_err(|_| stopped("invalid table inventory"))?;
        let mut counts = BTreeMap::new();
        for query in queries {
            let count = docker
                .sql(container, user, &database, &query)?
                .parse()
                .map_err(|_| stopped("invalid row count"))?;
            counts.insert(query, count);
        }
        result.insert(database, counts);
    }
    Ok(result)
}

fn execute(o: &Options, backup: &Path) -> TaskResult {
    docker::private_directory(backup)?;
    let docker = Docker::new(backup)?;
    let containers = docker.capture(&["container", "ls", "-a", "--format", "{{.Names}}"])?;
    let volumes = docker.capture(&["volume", "ls", "--format", "{{.Name}}"])?;
    if containers.lines().any(|v| v == o.target) || volumes.lines().any(|v| v == o.volume) {
        return Err(stopped(
            "target container or volume already exists; refusing reuse",
        ));
    }
    let source_version = docker.sql(&o.source, &o.user, "postgres", "SHOW server_version_num;")?;
    if source_version.parse::<u32>().ok().map(|v| v / 10000) != Some(16) {
        return Err(stopped("this helper requires a PostgreSQL 16 source"));
    }
    if docker.sql(
        &o.source,
        &o.user,
        "postgres",
        "SELECT rolsuper FROM pg_roles WHERE rolname=current_user;",
    )? != "t"
    {
        return Err(stopped(
            "source user must be superuser to preserve roles and ownership",
        ));
    }
    if docker.sql(
        &o.source,
        &o.user,
        "postgres",
        "SELECT count(*) FROM pg_tablespace WHERE spcname NOT IN ('pg_default','pg_global');",
    )? != "0"
    {
        return Err(stopped(
            "custom tablespaces require an explicit mapping; not supported",
        ));
    }
    let before = inventory(&docker, &o.source, &o.user)?;
    let partial = backup.join("cluster.sql.partial");
    let dump = private_file(&partial)?;
    docker.to_file(
        &["exec", &o.source, "pg_dumpall", "-w", "-U", &o.user],
        &dump,
    )?;
    dump.sync_all()?;
    fs::rename(partial, backup.join("cluster.sql"))?;
    if inventory(&docker, &o.source, &o.user)? != before {
        return Err(stopped(
            "source row counts changed during backup; keep writers stopped and retry with new paths",
        ));
    }
    write_json(&backup.join("source-counts.json"), &before)?;
    let inspect = ["image", "inspect", &o.image, "--format", "{{.Id}}"];
    if !docker.succeeds(&inspect)? {
        docker.logged(&["pull", &o.image])?;
    }
    let image_id = docker.capture(&inspect)?;
    let version = docker.capture(&[
        "run",
        "--rm",
        "--network",
        "none",
        "--entrypoint",
        "postgres",
        &image_id,
        "--version",
    ])?;
    if !version.contains("PostgreSQL) 18.") {
        return Err(stopped("target image must contain PostgreSQL 18"));
    }
    let bootstrap = format!("migration_{}", &token()[..16]);
    let env_path = backup.join("bootstrap.env");
    let mut env_file = private_file(&env_path)?;
    writeln!(
        env_file,
        "POSTGRES_USER={bootstrap}\nPOSTGRES_PASSWORD={}\nPOSTGRES_DB=postgres\nPGDATA=/var/lib/postgresql/18/docker",
        token()
    )?;
    env_file.sync_all()?;
    // Remove credentials on both normal and error exits after this point.
    let bootstrap_env = docker::TemporaryFile(env_path);
    let reservation = token();
    docker.logged(&[
        "volume",
        "create",
        "--label",
        &format!("self-tools.migration-run={reservation}"),
        &o.volume,
    ])?;
    if docker.capture(&[
        "volume",
        "inspect",
        &o.volume,
        "--format",
        "{{index .Labels \"self-tools.migration-run\"}}",
    ])? != reservation
    {
        return Err(stopped(
            "target volume was reserved by another process; refusing to mount it",
        ));
    }
    docker.logged(&[
        "run",
        "-d",
        "--name",
        &o.target,
        "--network",
        "none",
        "--env-file",
        bootstrap_env
            .0
            .to_str()
            .ok_or_else(|| stopped("backup path must be UTF-8"))?,
        "--mount",
        &format!("type=volume,src={},dst=/var/lib/postgresql", o.volume),
        &image_id,
    ])?;
    drop(bootstrap_env);
    let mut ready = false;
    for _ in 0..90 {
        if docker.succeeds(&[
            "exec",
            &o.target,
            "pg_isready",
            "-h",
            "127.0.0.1",
            "-U",
            &bootstrap,
            "-d",
            "postgres",
        ])? {
            ready = true;
            break;
        }
        thread::sleep(Duration::from_secs(1));
    }
    if !ready {
        return Err(stopped("target did not become ready in 90 seconds"));
    }
    docker.restore_file(
        &[
            "exec",
            "-i",
            &o.target,
            "psql",
            "-X",
            "-w",
            "-U",
            &bootstrap,
            "-d",
            "postgres",
            "-v",
            "ON_ERROR_STOP=1",
        ],
        fs::File::open(backup.join("cluster.sql"))?,
    )?;
    let after = inventory(&docker, &o.target, &o.user)?;
    write_json(&backup.join("target-counts.json"), &after)?;
    if before != after {
        return Err(stopped(
            "database/table counts differ; target is NOT ready for cutover",
        ));
    }
    docker.logged(&[
        "exec",
        &o.target,
        "vacuumdb",
        "-w",
        "-U",
        &o.user,
        "--all",
        "--analyze-in-stages",
    ])?;
    docker.sql(
        &o.target,
        &o.user,
        "postgres",
        &format!("ALTER ROLE \"{bootstrap}\" NOLOGIN PASSWORD NULL;"),
    )?;
    write_json(
        &backup.join("result.json"),
        &serde_json::json!({
            "source": o.source, "target": o.target, "volume": o.volume,
            "image_id": image_id, "version": version, "bootstrap_role_disabled": bootstrap,
            "restored_and_counts_match": true, "cutover_performed": false,
        }),
    )?;
    println!(
        "Restore and row-count checks passed. Private backup: {}",
        backup.display()
    );
    println!(
        "Target remains network-isolated. Source and its volume are unchanged. No cutover performed."
    );
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn restricts_resource_names() {
        for name in ["", "-option", "name,src=old", "a/b", "a\nb"] {
            assert!(!valid_name(name));
        }
        assert!(valid_name("postgres18-staging_1"));
    }
    #[test]
    fn rejects_backup_inside_repository() {
        let root = workspace_root();
        assert!(backup_path(&root.join("must-not-create-migration-backup"), &root).is_err());
    }

    #[cfg(unix)]
    #[test]
    fn private_backup_rejects_reuse_and_symlink_into_repository() {
        use std::os::unix::fs::{PermissionsExt, symlink};
        let base = std::env::temp_dir().join(format!("xtask-migration-{}", token()));
        docker::private_directory(&base).unwrap();
        let root = base.join("repository");
        fs::create_dir(&root).unwrap();
        symlink(&root, base.join("alias")).unwrap();
        assert!(backup_path(&base.join("alias/backup"), &root).is_err());
        let backup = backup_path(&base.join("backup"), &root).unwrap();
        docker::private_directory(&backup).unwrap();
        assert!(backup_path(&backup, &root).is_err());
        assert_eq!(
            fs::metadata(&backup).unwrap().permissions().mode() & 0o777,
            0o700
        );
        let file = backup.join("cluster.sql");
        private_file(&file).unwrap();
        assert_eq!(
            fs::metadata(&file).unwrap().permissions().mode() & 0o777,
            0o600
        );
        assert!(private_file(&file).is_err());
        fs::remove_dir_all(base).unwrap();
    }
}
