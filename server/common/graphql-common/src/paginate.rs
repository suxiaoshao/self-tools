use std::{cmp::Ordering, fmt::Debug};

use async_graphql::InputObject;

pub trait Paginate: Debug {
    fn offset(&self) -> i64;
    fn offset_plus_limit(&self) -> i64;
    fn limit(&self) -> i64 {
        self.offset_plus_limit() - self.offset()
    }
}

#[derive(Debug)]
struct Offset {
    offset: i64,
    limit: i64,
}

impl Paginate for Offset {
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

impl Offset {
    fn new(offset: i64, limit: i64) -> Self {
        Self { offset, limit }
    }
}

#[allow(async_fn_in_trait)]
pub trait Queryable {
    type Item;
    type Error;

    async fn len(&self) -> Result<i64, Self::Error>;
    async fn is_empty(&self) -> Result<bool, Self::Error> {
        self.len().await.map(|len| len == 0)
    }
    async fn query<P: Paginate>(&self, pagination: P) -> Result<Vec<Self::Item>, Self::Error>;
}

pub struct QueryStack<T, P> {
    left: T,
    right: P,
}

impl<I, E, T> QueryStack<T, ()>
where
    T: Queryable<Item = I, Error = E>,
{
    pub fn new(left: T) -> Self {
        Self { left, right: () }
    }
    pub fn add_query<P: Queryable<Item = I, Error = E>>(self, right: P) -> QueryStack<T, P> {
        QueryStack {
            left: self.left,
            right,
        }
    }
}

impl<I, E, T, P> QueryStack<T, P>
where
    T: Queryable<Item = I, Error = E>,
    P: Queryable<Item = I, Error = E>,
{
    pub fn add_query<X: Queryable<Item = I, Error = E>>(
        self,
        right: X,
    ) -> QueryStack<T, QueryStack<P, X>> {
        QueryStack {
            left: self.left,
            right: QueryStack {
                left: self.right,
                right,
            },
        }
    }
}

impl<I, E, T> Queryable for QueryStack<T, ()>
where
    T: Queryable<Item = I, Error = E>,
{
    type Item = I;

    type Error = E;

    async fn len(&self) -> Result<i64, Self::Error> {
        self.left.len().await
    }

    async fn query<P: Paginate>(&self, pagination: P) -> Result<Vec<Self::Item>, Self::Error> {
        self.left.query(pagination).await
    }
}

impl<I, E, T, P> Queryable for QueryStack<T, P>
where
    T: Queryable<Item = I, Error = E>,
    P: Queryable<Item = I, Error = E>,
{
    type Item = I;

    type Error = E;

    async fn len(&self) -> Result<i64, Self::Error> {
        let (left_len, right_len) = tokio::try_join!(self.left.len(), self.right.len())?;
        Ok(left_len + right_len)
    }

    async fn query<Pagination: Paginate>(
        &self,
        pagination: Pagination,
    ) -> Result<Vec<Self::Item>, Self::Error> {
        let left_len = self.left.len().await?;
        let offset = pagination.offset();
        let offset_plus_limit = pagination.offset_plus_limit();
        match (left_len.cmp(&offset), left_len.cmp(&offset_plus_limit)) {
            (_, Ordering::Greater | Ordering::Equal) => {
                let left = self.left.query(pagination).await?;
                Ok(left)
            }
            (Ordering::Less | Ordering::Equal, _) => {
                let right_offset = Offset::new(offset - left_len, pagination.limit());
                let right = self.right.query(right_offset).await?;
                Ok(right)
            }
            (Ordering::Greater, Ordering::Less) => {
                let left_offset = Offset::new(offset, left_len - offset);
                let right_offset = Offset::new(0, offset_plus_limit - left_len);
                let (mut left, right) =
                    tokio::try_join!(self.left.query(left_offset), self.right.query(right_offset))?;
                left.extend(right);
                Ok(left)
            }
        }
    }
}

#[derive(InputObject, Debug, Clone, Copy)]
pub struct Pagination {
    #[graphql(validator(minimum = 1), default = 1)]
    pub page: i64,
    #[graphql(validator(minimum = 5, maximum = 100), default = 10)]
    pub page_size: i64,
}

impl Paginate for Pagination {
    fn offset(&self) -> i64 {
        (self.page - 1) * self.page_size
    }
    fn offset_plus_limit(&self) -> i64 {
        self.offset() + self.page_size
    }
    fn limit(&self) -> i64 {
        self.page_size
    }
}
