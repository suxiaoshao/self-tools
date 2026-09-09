mod public_error;
mod result;
pub use public_error::*;
pub use result::*;
mod date_time;
mod paginate;
mod tag_match;

pub use date_time::DateTime;
pub use paginate::Pagination;
pub use paste::paste;
pub use tag_match::{TagMatch, TagMatchValidator};

#[macro_export]
macro_rules! list {
    ($type:ident) => {
        $crate::paste! {
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
