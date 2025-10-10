use async_graphql::InputObject;
use async_graphql::{CustomValidator, InputValueError};
use std::collections::HashSet;
use tracing::{Level, event};

#[derive(InputObject)]
pub struct TagMatch {
    pub match_set: HashSet<i64>,
    pub full_match: bool,
}

pub struct TagMatchValidator;

impl CustomValidator<TagMatch> for TagMatchValidator {
    fn check(&self, input: &TagMatch) -> Result<(), InputValueError<TagMatch>> {
        if input.match_set.is_empty() {
            event!(Level::WARN, "至少选择一个标签");
            return Err(InputValueError::custom("至少选择一个标签"));
        }
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use super::TagMatchValidator;
    use crate::TagMatch;
    use async_graphql::CustomValidator;
    use std::collections::HashSet;
    #[test]
    fn test_validate_folder() {
        let validator = TagMatchValidator;
        let input = TagMatch {
            match_set: {
                let mut set = HashSet::new();
                set.insert(1);
                set
            },
            full_match: false,
        };
        assert!(validator.check(&input).is_ok());
        let input = TagMatch {
            match_set: {
                let mut set = HashSet::new();
                set.insert(1);
                set
            },
            full_match: true,
        };
        assert!(validator.check(&input).is_ok());
        let input = TagMatch {
            match_set: { HashSet::new() },
            full_match: false,
        };
        assert!(validator.check(&input).is_err());
        let input = TagMatch {
            match_set: { HashSet::new() },
            full_match: true,
        };
        assert!(validator.check(&input).is_err());
    }
}
