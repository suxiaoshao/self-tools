mod trace_id;
mod trace_log;
use self::{trace_id::TraceIdLayer, trace_log::TraceLogLayer};
use tower::{
    ServiceBuilder,
    layer::util::{Identity, Stack},
};
pub fn trace_layer() -> ServiceBuilder<Stack<TraceLogLayer, Stack<TraceIdLayer, Identity>>> {
    ServiceBuilder::new()
        .layer(TraceIdLayer)
        .layer(trace_log::TraceLogLayer)
}
pub use self::trace_id::TraceIdExt;
