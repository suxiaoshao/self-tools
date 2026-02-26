use std::{
    collections::HashMap,
    fs, io,
    path::{Path, PathBuf},
};

use tar::Builder as TarBuilder;
use walkdir::WalkDir;

use crate::error::XtaskError;

pub fn workspace_root() -> PathBuf {
    Path::new(env!("CARGO_MANIFEST_DIR"))
        .ancestors()
        .nth(3)
        .expect("invalid xtask path")
        .to_path_buf()
}

pub fn load_env_file(path: &Path) -> Result<HashMap<String, String>, XtaskError> {
    if !path.exists() {
        return Ok(HashMap::new());
    }

    let content = fs::read_to_string(path)?;
    let mut env = HashMap::new();

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }

        if let Some((key, value)) = trimmed.split_once('=') {
            env.insert(key.trim().to_string(), value.trim().to_string());
        }
    }

    Ok(env)
}

pub fn build_context_tar(root: &Path) -> Result<Vec<u8>, XtaskError> {
    let mut archive = TarBuilder::new(Vec::new());

    for entry in WalkDir::new(root)
        .follow_links(false)
        .into_iter()
        .filter_entry(|entry| !should_skip(entry.path(), root))
    {
        let entry = entry.map_err(io::Error::other)?;
        let path = entry.path();

        if path == root {
            continue;
        }

        let rel = path.strip_prefix(root).map_err(io::Error::other)?;

        if path.is_file() {
            archive.append_path_with_name(path, rel)?;
        } else if path.is_dir() {
            archive.append_dir(rel, path)?;
        }
    }

    archive.finish()?;
    archive.into_inner().map_err(XtaskError::Io)
}

fn should_skip(path: &Path, root: &Path) -> bool {
    path.strip_prefix(root)
        .ok()
        .and_then(|rel| rel.components().next())
        .map(|component| {
            let part = component.as_os_str().to_string_lossy();
            part == ".git" || part == "target"
        })
        .unwrap_or(false)
}
