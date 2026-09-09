use async_graphql::InputObject;
#[derive(InputObject, Debug, Clone, Copy)]
pub struct Pagination {
    #[graphql(validator(minimum = 1), default = 1)]
    pub page: i64,
    #[graphql(validator(minimum = 5, maximum = 100), default = 10)]
    pub page_size: i64,
}

impl Pagination {
    pub fn checked(self) -> Result<service_query::PageRange, service_errors::FieldViolation> {
        service_query::PageRange::new(self.page, self.page_size)
    }
}
