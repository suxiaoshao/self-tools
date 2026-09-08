# 日志与跨服务追踪契约

本文件从属于 [规范计划](README.md)，拥有 W1/W5 的上下文、SDK、协议适配及部署配置。RPC 载体见 [C5](rpc.md)，浏览器错误关联见 [C3](api.md#c3http-与-graphql-的非业务错误)。

## C6：共享核心与依赖

新增 `server/common/telemetry`，依赖标准 OpenTelemetry API/SDK、tracing bridge 与 JSON 日志格式器；不依赖 Pingora、Thrift 生成绑定或业务服务。HTTP/GraphQL adapter 由 middleware 持有，Pingora 生命周期适配由 gateway 持有，RPC 注入/提取由 thrift/auth 边界持有。公共导出如下，具体 span 操作使用 SDK/bridge 原生 API，不再包装一套自制 trace/span 模型：

```rust
pub struct RequestCorrelation { pub request_id: String }
pub struct PropagationFields {
    pub traceparent: String,
    pub tracestate: Option<String>,
    pub request_id: String,
}
pub enum IngressTrust { Public, Internal }
pub struct TelemetryGuard { /* 持有 SDK provider */ }

pub fn init(service_name: &'static str) -> Result<TelemetryGuard, InitError>;
pub fn extract(fields: &PropagationFields, trust: IngressTrust)
    -> (opentelemetry::Context, RequestCorrelation);
pub fn inject(context: &opentelemetry::Context, correlation: &RequestCorrelation)
    -> PropagationFields;
impl TelemetryGuard {
    pub fn shutdown(self) -> Result<(), ShutdownError>;
}
```

RequestCorrelation 在提取完成后放入请求扩展；缺失载体由 adapter 传空字段，核心生成必要值。requestId 固定为服务端生成的 32 位非零小写十六进制字符串；trace ID 与 span ID 使用 SDK 的值。它们不能充当认证身份或幂等键。

目标依赖为 `opentelemetry 0.32.0`、`opentelemetry_sdk 0.32.1`、`opentelemetry-otlp 0.32.0`、`tracing-opentelemetry 0.33.0`；根 workspace 声明 caret 范围，Cargo.lock 由 Cargo 更新。bridge 的 [发布依赖](https://docs.rs/crate/tracing-opentelemetry/0.33.0)匹配 OTel 0.32 和现有 tracing 0.1/tracing-subscriber 0.3；OTLP 的 reqwest 0.13 与本仓版本族一致。实施时以实际解析版本及编译为准，不把文档核对视为编译通过。

API/SDK 关闭 default features，只启用 trace 及实际桥接必需项；bridge 关闭 metrics 等默认附加功能。OTLP 选择 **HTTP/protobuf + reqwest blocking client + rustls**，在 SDK 的有界批处理线程中导出，避免 gateway 同步 main 额外依赖调用线程上的 Tokio runtime。目标 OTLP features：`trace`、`http-proto`、`reqwest-blocking-client`、`reqwest-rustls`，关闭默认项。`http-proto` 在该版本会传递启用 metrics feature，但本计划不初始化 metrics/logs provider，不为此改写上游库。[OTLP feature 依据](https://docs.rs/crate/opentelemetry-otlp/latest/features)。

reqwest blocking client 的创建不能直接嵌入异步 runtime。telemetry::init 在短生命周期的普通初始化线程内构造该 client/provider，再返回可跨线程使用的 provider；全局 subscriber 仍只注册一次。async 服务通过 spawn_blocking 调用有界 shutdown；同步 gateway 直接调用。不改 auth 的 volo runtime 或各服务现有 runtime 配置，也不在每次请求中启动导出线程。

无导出目的地时仍建立真实 SdkTracerProvider 和 span 上下文，不替换为 NoopTracerProvider；不注册网络 exporter，日志照常包含关联 ID。采样默认 parent-based always-on，SDK 仍使用有界 span 属性/事件数。无 exporter 的父子关系、上下文有效性和日志 ID 一致性用实际 SDK 测试确认。

## 传播和信任边界

协议遵循 [W3C Trace Context](https://www.w3.org/TR/2021/REC-trace-context-1-20211123/)，解析与注入调用标准 propagator，不保留两份手写验证器。项目策略如下：

| 边界                    | 行为                                                                                                                                                                 |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 公网 gateway 入站       | 新建服务端 root trace/requestId；丢弃外部 traceparent、tracestate、x-request-id 和 baggage 的传播影响。当前没有浏览器 tracing 产品需求，不信任外部强制采样或关联标识 |
| 内部 HTTP/RPC 入站      | 校验并提取完整 traceparent/tracestate；创建 server 子 span；有效 requestId 沿用，无效/缺失时新建。无效 traceparent 新建 root 并丢弃对应 tracestate，不拒绝业务       |
| gateway → 内部 HTTP     | 创建 client span，注入该 client span 的上下文；不照抄公网或父服务的 parent-id                                                                                        |
| HTTP/GraphQL → auth RPC | 以当前 span 建立 client span，经 Context 注入；auth 建立 server span，业务/数据库工作在其下运行                                                                      |
| 外部 crawler/图片上游   | 记录本地 client span，但不向第三方注入内部 trace/request 标识、tracestate 或 baggage                                                                                 |
| HTTP 返回浏览器         | 只公开 X-Request-ID 供查日志，不返回内部 traceparent/tracestate；JSON/GraphQL 错误关联 ID 与 header 一致                                                             |

“内部”由部署拓扑和固定 adapter 入口决定，不能由来访 header 自行声明。现有 Compose 只公开 gateway 的业务入口；直接本地服务调试没有上下文时生成本地 root。Ready 等没有业务 Context 的内部探针创建独立的就绪 span，不改其请求/响应合同。

同一入口请求的 requestId 在各服务不变；每跳 spanId 不同，traceId 相同。业务拒绝与系统故障可发生在同一 trace 的不同层，不能用 requestId 替代 spanId。异步 future、spawn_blocking、RPC 调用与流式 body 显式携带上下文；不得把同步 enter guard 跨 await 使用。删除旧 `trace-id` header、TraceIdExt 的字符串兼容链及 gateway/middleware 各自的随机 ID/解析器。

## C7：完成记录与安全诊断

服务输出逐行 JSON。稳定字段为 `timestamp`、`level`、`service`、`event`、`trace_id`、`span_id`、`request_id`；事件按场景使用以下字段，字段不存在时省略，不用空字符串伪造身份：

| event               | 附加字段                                                          | 完成含义                                                                             |
| ------------------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `http.completed`    | method、route、status、duration_ms、outcome                       | 正常 body EOF 才算发送完成；HEAD/空体在协议完成时结束                                |
| `http.interrupted`  | method、route、status（若已发送）、duration_ms、stage             | response future 故障、body 错误或提前 drop；stage 区分 headers/body，不能记录为成功  |
| `rpc.completed`     | rpc_service、rpc_method、duration_ms、outcome、code（若有）       | success/rejected/fault/transport_error；声明业务异常仍是 rejected                    |
| `graphql.completed` | operation_type、operation_name、duration_ms、outcome、error_count | success/rejected/fault/partial；HTTP 200 不覆盖 GraphQL 故障，成功空列表仍为 success |
| `fault`             | operation、cause_kind、cause_code、可选安全分类字段               | 由拥有原因的边界输出一次详细诊断，调用方只补自己的完成记录                           |

outcome/code 使用封闭集合。operation、route、rpc_method 使用程序常量或已匹配路由模板，不记录实际 URI/path 参数。GraphQL operation_name 只允许本仓已知操作名；未知或匿名操作记固定 `other`/`anonymous`，不回显原名；日志只使用 schema 字段名，不记录客户端 alias/path 值。span 名称也使用同一规则。

安全诊断可包含底层错误类型、受控代码、SQLSTATE、静态约束类别、解析阶段/位置和耗时；保留原 source 对象供进程内处理，但不直接遍历 Display/Debug 输出。未知来源只输出类型/分类。禁止请求/响应 body、GraphQL query/variables/data、Cookie/Authorization、账号或凭据、URL query、数据库连接串、任意请求头、编辑器对象进入默认日志或 span 属性；不使用会自动记录所有参数的 instrument 宏。

应用事件与 span 只接收允许的 target/字段集合，不直接转发任意第三方 tracing 事件；SDK 内部日志也不能递归导出或泄露 exporter endpoint/headers。已知启动事件可以保留安全字段，未审核字段不进入新格式器。SDK/导出失败使用独立、限频的安全 stderr 摘要，不触发网络日志递归。

HTTP adapter 的完成 guard 持有到 body 结束；RPC/GraphQL guard 覆盖正常结束、错误和 future 取消，正常同一阶段最多一个完成事件。客户端取消通常记 interrupted，不声称服务端事务已回滚。进程强制终止不承诺最后事件送达。GraphQL C1 拒绝由 resolver 记录安全业务分类供 operation 汇总，不依赖扫描返回的用户 data。

删除 GraphQL 文本展开、成功 data 和 extensions.source 的日志；删除 gateway 完整 query string 日志；移除 collections CustomEdit 的递归 Proxy 包装与 bookmarks utils/proxy 的失效导出，保留编辑器 value/focus 行为。

## C8：初始化、导出与部署配置

五个服务 main 统一调用 telemetry::init，各自静态 service_name 为 gateway/login/auth/bookmarks/collections。默认 stdout 日志与 SDK 上下文随服务启用；不要求 Collector/Jaeger/Tempo 存在，不启动新容器。xtask 保留面向终端的格式和退出码，不强制接入业务 trace SDK。

Help、CheckReady 和 Migrate 模式继续走各自入口，不启动网络 exporter；只在 Serve 模式初始化业务 telemetry。就绪请求被已运行服务接收时可以产生受控的本地 span，探针命令本身不额外发送遥测。

| 环境变量                             | 项目合同                                                                                                                          |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` | 未设置或空：不启用网络导出；设置时必须是完整 http(s) traces 接收 URL，包含 `/v1/traces` 等实际路径，不自动拼接。拒绝 URL userinfo |
| `OTEL_EXPORTER_OTLP_TRACES_HEADERS`  | 可选 exporter 认证/静态头；用 SDK 格式解析，仅随 telemetry 发送，不进入日志；没有 endpoint 时忽略                                 |
| `OTEL_EXPORTER_OTLP_TRACES_TIMEOUT`  | 毫秒，默认 3000，允许 1–10000；只影响 telemetry 导出，不是业务 timeout                                                            |
| `OTEL_TRACES_SAMPLER`                | 支持 `parentbased_always_on`（默认）、`parentbased_always_off`、`parentbased_traceidratio`                                        |
| `OTEL_TRACES_SAMPLER_ARG`            | ratio 模式必需，范围 0–1；内部父采样继承，公网入口先重建 root                                                                     |

初始化显式设置 service.name，启用 sampler/config 的受支持值；不从未声明变量隐式启用 exporter 或日志/指标采集。批处理队列上限 2048 spans，每批至多 512，最长调度间隔 5 秒；队列满丢弃遥测并做限频摘要，不阻塞请求。无效 telemetry 配置导致启动时的安全配置错误；运行中后端断连、导出失败不改变业务响应、认证状态或 readiness。

正常退出先结束/排空服务工作，再调用 provider 有界 shutdown，最多等待 5 秒；超时不无限阻止退出。[SDK 提供 shutdown_with_timeout](https://docs.rs/opentelemetry_sdk/latest/opentelemetry_sdk/trace/struct.SdkTracerProvider.html)。gateway 使用锁定 Pingora 的 `run(RunArgs::default())` 返回后显式 shutdown，避免 run_forever 的 process::exit 跳过清理。保持当前前台部署；不新增 daemon/fork 模式。auth/HTTP 服务在自己的停止路径中显式收口，异常启动失败也释放 provider。

可选变量同步到 Compose 的五服务 environment，不能放入必需环境项或健康依赖；xtask 从 Compose 生成配置的消费者按实际入口同步，支持默认全空启动。镜像只增加 Rust 依赖产物，不增加端口、volume 或追踪后端。操作文档说明：默认可按 requestId 查 stdout；集中调用树需用户自行提供 OTLP 后端地址，当前计划不提供该产品的部署。

必要验证：真实 SDK 的无 exporter/未采样 span 关联；一条 gateway→HTTP→auth 的父子关系（auth RPC client 与认证后创建的 GraphQL span 同为 HTTP server 子级）；未知外部标识不能注入；HTTP body 中断与 RPC fault 完成记录；含敏感输入的日志捕获；本地 OTLP 测试接收器验证导出、队列/超时不影响业务；gateway 与普通 HTTP 服务退出能完成有界 shutdown。使用局部测试接收器即可，不以新增持久化追踪后端作为验收条件。
