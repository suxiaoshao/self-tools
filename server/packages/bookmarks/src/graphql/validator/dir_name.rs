use async_graphql::CustomValidator;

pub struct DirNameValidator;

impl CustomValidator<String> for DirNameValidator {
    fn check(&self, input: &String) -> Result<(), String> {
        let len = input.chars().count();
        if len > 255 {
            return Err("不能大于255字符".to_string());
        }
        if len < 1 {
            return Err("不能小于1个字符".to_string());
        }
        if input == "." || input == ".." {
            return Err("不能为\"..\" \".\"".to_string());
        }
        if input.chars().all(|x| x == ' ') {
            return Err("不能为空".to_string());
        }
        if input
            .chars()
            .any(|x| x == '/' || x == '\n' || x == '\r' || x == '\t')
        {
            Err("不能含有/和换行符等特殊字符".to_string())
        } else {
            Ok(())
        }
    }
}

#[cfg(test)]
mod test {
    use async_graphql::CustomValidator;

    use super::DirNameValidator;
    #[test]
    fn test_validate_folder() {
        let validator = DirNameValidator;
        let input = " abc".to_string();
        assert!(validator.check(&input).is_ok());
        let input = "2a中sadsd ".to_string();
        assert!(validator.check(&input).is_ok());
        let input = "1234 5678".to_string();
        assert!(validator.check(&input).is_ok());
        let input = "asGk22_Q".to_string();
        assert!(validator.check(&input).is_ok());

        // 不能含有/和换行符等特殊字符
        let input = "!@#$/%^&*".to_string();
        assert!(validator.check(&input).is_err());
        // 不能为.
        let input = ".".to_string();
        // 不能为..
        assert!(validator.check(&input).is_err());
        let input = "..".to_string();
        assert!(validator.check(&input).is_err());
        // 不能为空
        let input = "   ".to_string();
        assert!(validator.check(&input).is_err());
        // 字符小于1
        let input = "".to_string();
        assert!(validator.check(&input).is_err());
        // 字符大于255
        let input = "abcdeabcdeabcdeabcdeabcdecabcdeab";
        let input = format!(
            "{}{}{}{}{}{}{}{}",
            input, input, input, input, input, input, input, input
        );
        assert!(validator.check(&input).is_err());
    }
}
