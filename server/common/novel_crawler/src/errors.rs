use thiserror::Error;

#[derive(Error, Debug)]
pub enum NovelError {
    #[error("crawler network failure")]
    NetworkError(#[from] reqwest::Error),
    #[error("crawler document structure mismatch")]
    ParseError,
    #[error("crawler parser failure")]
    Nom(#[source] NomDiagnostic),
    #[error("crawler JSON failure")]
    Json(#[from] serde_json::Error),
    #[error("crawler time failure")]
    TimeParseError(#[from] time::error::Parse),
    #[error("crawler numeric field failure")]
    Number(#[from] std::num::ParseIntError),
}
/// Owned parser location relative to the end of its input; never stores borrowed page text.
#[derive(Debug, Error)]
#[error("parser failed ({kind:?}, remaining bytes: {remaining_bytes})")]
pub struct NomDiagnostic {
    pub kind: Option<nom::error::ErrorKind>,
    pub remaining_bytes: usize,
}
impl From<nom::Err<nom::error::Error<&str>>> for NovelError {
    fn from(error: nom::Err<nom::error::Error<&str>>) -> Self {
        let diagnostic = match error {
            nom::Err::Error(error) | nom::Err::Failure(error) => NomDiagnostic {
                kind: Some(error.code),
                remaining_bytes: error.input.len(),
            },
            nom::Err::Incomplete(_) => NomDiagnostic {
                kind: None,
                remaining_bytes: 0,
            },
        };
        Self::Nom(diagnostic)
    }
}
pub(crate) type NovelResult<T> = Result<T, NovelError>;

#[cfg(test)]
mod tests {
    use super::*;
    use std::error::Error;
    #[test]
    fn parser_causes_are_owned_and_do_not_retain_page_text() {
        let error = NovelError::from(nom::Err::Failure(nom::error::Error::new(
            "secret manuscript",
            nom::error::ErrorKind::Tag,
        )));
        let source = error
            .source()
            .unwrap()
            .downcast_ref::<NomDiagnostic>()
            .unwrap();
        assert_eq!(source.remaining_bytes, 17);
        assert!(!format!("{error:?}").contains("secret"));
        let json = serde_json::from_str::<serde_json::Value>("{").unwrap_err();
        assert!(
            NovelError::from(json)
                .source()
                .unwrap()
                .is::<serde_json::Error>()
        );
    }
}
