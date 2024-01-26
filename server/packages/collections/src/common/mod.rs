/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-26 06:08:25
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 13:58:52
 * @FilePath: /self-tools/server/packages/collections/src/common/mod.rs
 */
use std::{cmp::Ordering, fmt::Debug};

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

pub trait Queryable {
    type Item;
    type Error;
    type Query;
    async fn len(&self, query: &Self::Query) -> Result<i64, Self::Error>;
    async fn query<P: Paginate>(
        &self,
        query: &Self::Query,
        pagination: P,
    ) -> Result<Vec<Self::Item>, Self::Error>;
}

pub struct QueryStack<T, P> {
    left: T,
    right: P,
}

impl<I, E, Q, T> QueryStack<T, ()>
where
    T: Queryable<Item = I, Error = E, Query = Q>,
{
    pub fn new(left: T) -> Self {
        Self { left, right: () }
    }
    pub fn add_query<P: Queryable<Item = I, Error = E, Query = Q>>(
        self,
        right: P,
    ) -> QueryStack<T, P> {
        QueryStack {
            left: self.left,
            right,
        }
    }
}

impl<I, E, Q, T, P> QueryStack<T, P>
where
    T: Queryable<Item = I, Error = E, Query = Q>,
    P: Queryable<Item = I, Error = E, Query = Q>,
{
    #[allow(dead_code)]
    pub fn add_query<X: Queryable<Item = I, Error = E, Query = Q>>(
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

impl<I, E, Q, T> Queryable for QueryStack<T, ()>
where
    T: Queryable<Item = I, Error = E, Query = Q>,
{
    type Item = I;

    type Error = E;

    type Query = Q;

    async fn len(&self, query: &Self::Query) -> Result<i64, Self::Error> {
        self.left.len(query).await
    }

    async fn query<P: Paginate>(
        &self,
        query: &Self::Query,
        pagination: P,
    ) -> Result<Vec<Self::Item>, Self::Error> {
        self.left.query(query, pagination).await
    }
}

impl<I, E, Q, T, P> Queryable for QueryStack<T, P>
where
    T: Queryable<Item = I, Error = E, Query = Q>,
    P: Queryable<Item = I, Error = E, Query = Q>,
{
    type Item = I;

    type Error = E;

    type Query = Q;

    async fn len(&self, query: &Self::Query) -> Result<i64, Self::Error> {
        let left_len = self.left.len(query).await?;
        let right_len = self.right.len(query).await?;
        Ok(left_len + right_len)
    }

    async fn query<Pagination: Paginate>(
        &self,
        query: &Self::Query,
        pagination: Pagination,
    ) -> Result<Vec<Self::Item>, Self::Error> {
        let left_len = self.left.len(query).await?;
        let offset = pagination.offset();
        let offset_plus_limit = pagination.offset_plus_limit();
        match (left_len.cmp(&offset), left_len.cmp(&offset_plus_limit)) {
            (_, Ordering::Greater | Ordering::Equal) => {
                let left = self.left.query(query, pagination).await?;
                Ok(left)
            }
            (Ordering::Less | Ordering::Equal, _) => {
                let right_offset = Offset::new(offset - left_len, pagination.limit());
                let right = self.right.query(query, right_offset).await?;
                Ok(right)
            }
            (Ordering::Greater, Ordering::Less) => {
                let left_offset = Offset::new(offset, left_len - offset);
                let right_offset = Offset::new(0, offset_plus_limit - left_len);
                let mut left = self.left.query(query, left_offset).await?;
                let right = self.right.query(query, right_offset).await?;
                left.extend(right);
                Ok(left)
            }
        }
    }
}
