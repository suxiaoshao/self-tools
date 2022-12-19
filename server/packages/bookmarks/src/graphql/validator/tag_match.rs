use async_graphql::{CustomValidator, InputValueError};

use crate::graphql::input::TagMatch;

pub struct TagMatchValidator;

impl CustomValidator<TagMatch> for TagMatchValidator {
    fn check(&self, input: &TagMatch) -> Result<(), InputValueError<TagMatch>> {
        if input.match_set.is_empty() {
            return Err(InputValueError::custom("至少选择一个标签"));
        }
        Ok(())
    }
}

#[cfg(test)]
mod test {
    use std::collections::HashSet;

    use async_graphql::CustomValidator;

    use crate::graphql::input::TagMatch;

    use super::TagMatchValidator;
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
