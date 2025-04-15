/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-23 00:41:46
 * @FilePath: /self-tools/server/common/middleware/src/lib.rs
 */
#[cfg(feature = "cors")]
mod cors;
#[cfg(feature = "graphql-trace")]
mod graphql_trace;
#[cfg(feature = "trace")]
mod trace;
#[cfg(feature = "cors")]
pub use cors::get_cors;

#[cfg(feature = "graphql-trace")]
pub use graphql_trace::*;
#[cfg(feature = "trace")]
pub use trace::*;
