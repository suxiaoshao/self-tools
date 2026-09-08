//! Subprocess output stays in the private backup, never in public errors.
use super::stopped;
use crate::{TaskResult, XtaskError};
use std::{
    fs::{self, File, OpenOptions},
    io::Write,
    path::{Path, PathBuf},
    process::{Command, Output, Stdio},
};

pub fn private_directory(path: &Path) -> TaskResult {
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        fs::DirBuilder::new().mode(0o700).create(path)?;
        Ok(())
    }
    #[cfg(not(unix))]
    {
        let _ = path;
        Err(stopped("migration requires Unix private file permissions"))
    }
}

pub fn private_file(path: &Path) -> Result<File, XtaskError> {
    let mut options = OpenOptions::new();
    options.write(true).create_new(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.mode(0o600);
    }
    Ok(options.open(path)?)
}

pub struct TemporaryFile(pub PathBuf);
impl Drop for TemporaryFile {
    fn drop(&mut self) {
        let _ = fs::remove_file(&self.0);
    }
}

pub struct Docker {
    log: File,
}
impl Docker {
    pub fn new(backup: &Path) -> Result<Self, XtaskError> {
        Ok(Self {
            log: private_file(&backup.join("migration.log"))?,
        })
    }
    fn command(&self, args: &[&str]) -> Result<Command, XtaskError> {
        let mut command = Command::new("docker");
        command
            .args(args)
            .stdin(Stdio::null())
            .stderr(self.log.try_clone()?);
        Ok(command)
    }
    fn checked(output: Output) -> Result<Output, XtaskError> {
        if output.status.success() {
            Ok(output)
        } else {
            Err(stopped(
                "Docker operation failed; inspect private migration.log",
            ))
        }
    }
    pub fn capture(&self, args: &[&str]) -> Result<String, XtaskError> {
        let output = Self::checked(self.command(args)?.output()?)?;
        String::from_utf8(output.stdout)
            .map(|s| s.trim().to_owned())
            .map_err(|_| stopped("invalid Docker output"))
    }
    pub fn succeeds(&self, args: &[&str]) -> Result<bool, XtaskError> {
        Ok(self
            .command(args)?
            .stdout(self.log.try_clone()?)
            .status()?
            .success())
    }
    pub fn logged(&self, args: &[&str]) -> TaskResult {
        Self::checked(self.command(args)?.stdout(self.log.try_clone()?).output()?)?;
        Ok(())
    }
    pub fn to_file(&self, args: &[&str], file: &File) -> TaskResult {
        Self::checked(self.command(args)?.stdout(file.try_clone()?).output()?)?;
        Ok(())
    }
    pub fn restore_file(&self, args: &[&str], file: File) -> TaskResult {
        Self::checked(
            self.command(args)?
                .stdin(file)
                .stdout(self.log.try_clone()?)
                .output()?,
        )?;
        Ok(())
    }
    pub fn sql(
        &self,
        container: &str,
        user: &str,
        database: &str,
        query: &str,
    ) -> Result<String, XtaskError> {
        let mut child = self
            .command(&[
                "exec",
                "-i",
                container,
                "psql",
                "-X",
                "-w",
                "-U",
                user,
                "-d",
                database,
                "-At",
                "-v",
                "ON_ERROR_STOP=1",
            ])?
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .spawn()?;
        let written = child
            .stdin
            .take()
            .expect("piped stdin")
            .write_all(query.as_bytes());
        let output = Self::checked(child.wait_with_output()?)?;
        written?;
        String::from_utf8(output.stdout)
            .map(|s| s.trim().to_owned())
            .map_err(|_| stopped("invalid SQL output"))
    }
}
