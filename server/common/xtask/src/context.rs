use std::{
    collections::HashMap,
    fs,
    path::{Path, PathBuf},
};

use nom::{
    IResult, Parser,
    bytes::complete::{tag, take_while1},
    character::complete::{char, space0, space1},
    combinator::{all_consuming, opt, rest},
    sequence::{delimited, separated_pair, terminated},
};

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
        if let Some((key, value)) = parse_env_assignment_line(line) {
            env.insert(key, value);
        }
    }

    Ok(env)
}

fn parse_env_assignment_line(line: &str) -> Option<(String, String)> {
    let trimmed = line.trim();
    if trimmed.is_empty() || is_comment_line(trimmed) {
        return None;
    }

    let (_, (key, value)) = all_consuming(env_assignment_parser).parse(trimmed).ok()?;
    Some((key.trim().to_string(), value.trim().to_string()))
}

fn is_comment_line(line: &str) -> bool {
    all_consuming(comment_line_parser).parse(line).is_ok()
}

fn comment_line_parser(input: &str) -> IResult<&str, ()> {
    let (input, _) = space0.parse(input)?;
    let (input, _) = char('#').parse(input)?;
    let (input, _) = rest.parse(input)?;
    Ok((input, ()))
}

fn env_assignment_parser(input: &str) -> IResult<&str, (&str, &str)> {
    let (input, _) = space0.parse(input)?;
    let (input, _) = opt(terminated(tag("export"), space1)).parse(input)?;
    separated_pair(env_key_parser, delimited(space0, char('='), space0), rest).parse(input)
}

fn env_key_parser(input: &str) -> IResult<&str, &str> {
    take_while1(|c: char| c != '=' && !c.is_whitespace()).parse(input)
}

#[cfg(test)]
mod tests {
    use super::parse_env_assignment_line;

    #[test]
    fn parses_basic_env_assignment() {
        let parsed = parse_env_assignment_line("BOOKMARKS_PG=postgres://postgres:5432/bookmarks");
        assert_eq!(
            parsed,
            Some((
                "BOOKMARKS_PG".to_string(),
                "postgres://postgres:5432/bookmarks".to_string(),
            ))
        );
    }

    #[test]
    fn parses_export_prefixed_env_assignment() {
        let parsed = parse_env_assignment_line("export SECRET = sushao");
        assert_eq!(parsed, Some(("SECRET".to_string(), "sushao".to_string())));
    }

    #[test]
    fn ignores_comment_or_empty_line() {
        assert_eq!(parse_env_assignment_line("   "), None);
        assert_eq!(parse_env_assignment_line("   # comment"), None);
    }
}
