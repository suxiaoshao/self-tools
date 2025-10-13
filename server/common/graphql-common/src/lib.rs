mod paginate;
mod tag_match;

pub use paginate::{Paginate, Pagination, QueryStack, Queryable};
pub use paste::paste;
pub use tag_match::{TagMatch, TagMatchValidator};

#[macro_export]
macro_rules! list {
    ($type:ident) => {
        use graphql_common::paste;
        paste! {
            #[derive(SimpleObject)]
            pub(crate) struct [<$type List>]{
                data:Vec<$type>,
                total:i64
            }
            impl [<$type List>] {
                pub fn new(data: Vec<$type>, total: i64) -> Self {
                    Self {
                        data,
                        total
                    }
                }
            }
        }
    };
}
