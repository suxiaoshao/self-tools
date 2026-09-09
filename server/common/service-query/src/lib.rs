use std::fmt::Debug;

pub trait Paginate: Debug {
    fn offset(&self) -> i64;
    fn offset_plus_limit(&self) -> i64;
    fn limit(&self) -> i64 {
        self.offset_plus_limit() - self.offset()
    }
}

/// Checked pagination used by application and repository code.
#[derive(Debug, Clone, Copy)]
pub struct PageRange {
    offset: i64,
    limit: i64,
}
impl PageRange {
    pub fn new(page: i64, page_size: i64) -> Result<Self, service_errors::FieldViolation> {
        use service_errors::{FieldViolation, ValidationCode};
        if !(5..=100).contains(&page_size) {
            return Err(FieldViolation {
                path: vec!["pageSize".into()],
                code: ValidationCode::OutOfRange,
                min: Some(5),
                max: Some(100),
            });
        }
        let offset = page
            .checked_sub(1)
            .filter(|_| page >= 1)
            .and_then(|p| p.checked_mul(page_size))
            .filter(|o| o.checked_add(page_size).is_some())
            .ok_or_else(|| FieldViolation {
                path: vec!["page".into()],
                code: ValidationCode::OutOfRange,
                min: Some(1),
                max: None,
            })?;
        Ok(Self {
            offset,
            limit: page_size,
        })
    }
}
impl Paginate for PageRange {
    fn offset(&self) -> i64 {
        self.offset
    }
    fn offset_plus_limit(&self) -> i64 {
        self.offset + self.limit
    }
    fn limit(&self) -> i64 {
        self.limit
    }
}
#[derive(Clone)]
pub struct TagFilter {
    pub match_set: std::collections::HashSet<i64>,
    pub full_match: bool,
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn pagination_checks_arithmetic() {
        assert!(PageRange::new(i64::MAX, 10).is_err());
        assert!(PageRange::new(0, 10).is_err());
        assert!(PageRange::new(100, 10).is_ok());
    }
}
