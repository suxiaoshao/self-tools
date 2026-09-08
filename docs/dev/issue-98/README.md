# Issue #98：端到端错误、日志与链路追踪

状态：**Done**。五个工作包的实现与必要验证已完成，可交付试用。对应 [Issue #98](https://github.com/suxiaoshao/self-tools/issues/98)，现状证据基线为 `b80809c`，详见 [调研记录](research.md)。

## 目标与边界

从 Rust 用例到 Thrift、HTTP/GraphQL 和前端，明确区分成功、预期业务拒绝、系统故障与调用结果未知；公开响应可被有类型地处理，内部保留可定位的原因链。日志与跨服务 trace 使用统一上下文，覆盖正常完成和失败退出。

已确认：交互式 mutation 使用 SDL 业务结果；通用结构共享、领域原因由领域持有；空列表正常成功；删除目标已不存在可视为目标达成；反馈由操作/页面负责；读取可受控重试，写入不自动重放；Thrift 使用声明异常区分业务拒绝和受控远端故障；接入标准 tracing SDK、OTLP 可选。

本轮不新增持久化幂等机制或追踪后端。数据库模型、认证安全策略、图片代理资源/目标限制按现有业务合同保留；为错误分类和原子性修正受影响用例。允许同步破坏性修改协议、生成物和消费者，删除旧转换链，不维持旧错误码或兼容别名。不新增部署编排动作。

## 文档与所有权

| 文档                          | 唯一负责的内容                                    | 实现所有者                                               |
| ----------------------------- | ------------------------------------------------- | -------------------------------------------------------- |
| 本文                          | 范围、Rust 分层、不变量、工作顺序与验证           | server / web                                             |
| [浏览器 API 与消费者](api.md) | GraphQL 结果、查询空值、HTTP 错误、前端识别和恢复 | graphql-common / login / bookmarks / collections / web   |
| [认证 RPC](rpc.md)            | Thrift IDL、认证失败映射与调用方转换              | thrift / auth / login / GraphQL handler / service-health |
| [日志与 tracing](tracing.md)  | SDK、跨协议传播、完成记录、配置和删除项           | telemetry / middleware / gateway / 各服务入口            |

稳定架构已同步至 [server README](../../../server/README.md)、[web README](../../../web/README.md)、[gateway README](../../../server/packages/gateway/README.md) 和 [docker README](../../../docker/README.md)。

新增内部 Rust crate `server/common/service-errors` 只拥有以下跨服务基础类型和公开故障分类；`server/common/telemetry` 只拥有 SDK 初始化、关联上下文及安全诊断输出。两者不依赖业务服务、Thrift 生成物或 GraphQL。HTTP 与 GraphQL 的投影分别放在 middleware 和 graphql-common，领域业务拒绝留在各服务。前端新增内部包 `web/common/request-errors`，拥有 HTTP/GraphQL 非 SDL 错误的运行时解码及标准化类型，不依赖 portal 或 UI。

现有 `server/common/thrift` 保持生成绑定与 RPC 客户端入口所有权，不成为领域模型事实源。bookmarks/collections 的 model、service 不再返回 `GraphqlError`；公开 Object/InputObject 与领域输入/结果分离，GraphQL resolver 负责最后投影。auth 的 application/repository 同样不直接使用 Thrift 的 Context、Session、Options 等生成类型。

## Rust 错误与事务

以下是新的跨 crate 契约；字段的安全性与协议含义分别由 API 和 tracing 文档约束：

```rust
pub type BoxError = Box<dyn std::error::Error + Send + Sync + 'static>;
pub type UseCaseResult<T, R> = Result<T, UseCaseError<R>>;

pub enum UseCaseError<R> {
    Rejected(R),
    Fault(Fault),
}

pub enum FaultKind {
    Database, Pool, Task, Network, Timeout, Protocol, Internal,
}

pub struct Fault {
    pub kind: FaultKind,
    pub operation: &'static str,
    pub source: BoxError,
}

pub enum ValidationCode { Required, InvalidFormat, TooLong, OutOfRange }
pub struct FieldViolation {
    pub path: Vec<String>,
    pub code: ValidationCode,
    pub min: Option<i64>,
    pub max: Option<i64>,
}
```

`Fault` 和 `UseCaseError<R>` 实现 `Error`/安全 `Display`，`source()` 保留底层对象，不能从 Display 自动生成公开响应。包装保留具体错误的动态类型和原因链；领域 adapter 可以用具体错误枚举组织本地来源。故障不要求 `Clone`，仅在 async-graphql 的进程内 source 确有共享需求时使用 Arc。缺失内部上下文等无第三方 source 的情况用有类型的本地原因表达。

数据库唯一键和外键错误在具体用例中结合约束身份解释。目录 path 冲突、小说/作者/标签来源标识冲突、重复评论、已读章节、重复凭据分别映射为已定义业务分支；不能把所有 UniqueViolation 归为 PasskeyExists。未识别约束、连接池、任务退出、损坏的持久化数据属于故障。允许用 SQLSTATE/约束名分类，禁止匹配数据库文案或把 SQL、绑定值、约束原文公开。

数据库事务中的业务拒绝保持 `Err(Rejected(...))`，事务结束后才转换为 GraphQL payload 或 RPC exception。读改写和多表删除的业务写入以一个事务完成；先查询后修改产生的竞争结果仍需正确分类，不能因先前 exists 为真就把后续零行变化一概归为 Internal。受影响的目录递归删除、记录/小说/作者关联删除与批量阅读记录特别复用或补齐原子性覆盖。认证 ceremony 消费和限流预算按既有安全规则生效，不承诺随数据库回滚。

`novel_crawler` 保留 reqwest/JSON/time 的 source；nom 借用输入错误转换为拥有位置/错误种类的诊断，不能为了 `'static` 保存整段抓取内容。提交草稿的可验证输入矛盾属于字段校验拒绝；插入后返回的数据库映射缺失（当前 SavaDraftError 路径）、抓取网络、上游协议和解析器失配属于故障。不能仅按旧错误名推断业务含义。xtask/启动错误仍面向操作者使用 anyhow 上下文与退出码，不套浏览器文案或公开 envelope。

## 关键不变量

1. 正常空列表、详情不存在、查询故障三者可区分；合法分页超过末页返回空数据，页码/大小本身不合法才是输入错误。
2. 已收到 mutation 成功分支后，后续刷新失败不撤销该成功状态、不触发重放；业务拒绝不关闭表单或导航。
3. 写入超时、响应损坏或取消等待不能证明写入没发生；核对失败继续显示未确认状态。只有明确成功或当前目标已达成才执行对应 UI 成功动作。
4. 同一业务拒绝只通过一个协议通道返回；GraphQL typed result 不再重复写 `errors` 或触发全局 toast。
5. 数据库事务拒绝/故障不提交部分业务写入；诊断保留原因但不泄露秘密或用户内容。
6. 会话 generation 与取消隔离继续生效；凭证错误、来源拒绝、重新认证要求和系统故障不能机械触发全局登出。
7. 每跳创建独立 span；上游服务和 auth RPC 共享 trace，公共 request ID 在同一入口请求内一致。无导出器时关联仍有效。

## 实施顺序

各工作包完成其受影响构建与关键回归后即可交付对应链路试用。包间依赖用于避免接口悬空，不要求预先执行全仓验收。

| 工作包                | 所有者与入口                                                                                                  | 必须完成的修改                                                                                              | 完成条件                                                                                               |
| --------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| W1 基础边界           | 新 service-errors、telemetry；根 Cargo.toml；middleware；新 request-errors                                    | 接入类型、SDK/安全上下文、公开错误解码；确认版本/features；补包 manifest 和 exports                         | 基础类型、无导出器关联、未知/恶意响应解码的定向检查通过；无业务 crate 反向依赖                         |
| W2 认证纵向链路       | auth application/repository/service；thrift IDL/build；login；两 GraphQL handler；service-health；portal Auth | 按 RPC/API 合同同步所有生产者和调用方；删除旧 AuthFailure 和字符串归并；落实会话影响、结果核对与 generation | RPC 生成完成；成功/业务拒绝/远端故障/传输失败可分别处理；既有认证安全与持久化关键回归通过              |
| W3 collections 链路   | collections model/service/graphql/router；web collections；graphql-common；custom-graphql                     | 有类型 mutation、nullable 详情/关联、事务删除、分页空结果；操作和页面分别反馈；替换 ErrorLink 全局提示      | SDL 与 operations/codegen 同步；新建、更新、删除、部分查询和结果未知的关键流程可试用                   |
| W4 bookmarks 链路     | bookmarks model/service/graphql/router；novel_crawler；web bookmarks                                          | 按 API 操作表迁移全部 mutation、抓取/草稿错误、分页、详情与关联消费者                                       | 所有旧 GraphqlError 消费退出；草稿与阅读记录原子性、重复/缺失资源结果和页面恢复通过                    |
| W5 tracing 与清理收口 | gateway；HTTP/GraphQL/RPC adapters；各 main；Docker/xtask Compose 配置消费者；编辑器 Proxy                    | 完成各跳传播、body/RPC 完成记录、可选 OTLP 配置；去掉重复解析器、旧 trace-id、原始载荷日志和递归 Proxy      | gateway→HTTP→auth 的同 trace/不同 span 及失败关联通过；默认无后端可启动，OTLP 故障不影响业务；文档同步 |

W2/W3 依赖 W1；W4 复用 W3 的共享 GraphQL/前端边界；W5 的协议适配随各链路接入，最后统一核对退出路径。W1 引入的计划能力必须随代码和 manifest 一起落地，不发布空库或未实现命令。

生成顺序固定为 Rust schema/IDL → 客户端 schema 快照/生成绑定 → 手写 operation → 现有 codegen → 消费者。Thrift 通过 `cargo check -p thrift` 触发现有 build.rs；GraphQL 使用 `pnpm --filter collections generate` / `pnpm --filter bookmarks generate`。两个服务均已注册 `--export-schema`，从 schema 的 `sdl()` 导出并断言客户端快照一致。

## 验证与交付证据

| 不变量/变更              | 最小充分证据                                                                                                                 | 何时执行                                                   |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 错误分流、原因与安全投影 | 定向序列化/解码案例：业务拒绝、嵌套故障、未知码、伪造详情；含秘密与用户内容的输入不得进入响应或捕获日志                      | W1–W4 对应边界变更时                                       |
| 认证事务与恢复           | 复用 auth 的持久化生命周期测试，补业务拒绝回滚、已消费 ceremony 不重放、删除当前凭据的会话影响；前端保留 generation/取消覆盖 | W2；数据库测试需专用 `AUTH_TEST_PG` 和已应用相同 migration |
| 业务原子性               | 复用目标服务现有测试；确有缺口时补创建后关联失败回滚、删除关联回滚、阅读记录拒绝无部分写入                                   | W3/W4；数据库故障注入需专用测试库，不能借用个人业务数据    |
| schema 与消费者          | 服务端 SDL 对齐快照；两个包现有 generate；变更返回分支的 operation 验证和目标前端类型检查                                    | W3/W4                                                      |
| 真实反馈                 | 单条代表链路覆盖空列表/详情不存在/主查询故障/关联局部失败、拒绝不关表单、成功后刷新失败、响应丢失核对                        | 每条纵向链路交付试用时；有 UI 行为改动才做必要浏览器验证   |
| trace 与资源             | 内存 exporter 验证父子树、RPC 故障、Future/body 提前结束、未采样关联；本地 OTLP 接收器验证编码与配置，不要求部署追踪产品     | W1/W5                                                      |

执行受影响包的 `cargo check`、`cargo clippy -p <package>` 和定向 `cargo test -p <package> <filter>`；前端使用现有 typecheck、构建和目标 Vitest 配置，选择实际受影响范围。新增数据库测试开关必须在实现时注册并文档化；不预先声明不存在的命令。commit/push 发生时等待项目 hooks，不预跑或绕过全部 CI。外部条件阻塞时记录具体未验证链路。

五个工作包已完成：

- W1：service-errors、service-query、telemetry 与 request-errors 落地；有类型 source、安全投影、
  无 exporter/未采样关联及恶意响应解码回归通过。
- W2：Thrift IDL/生成绑定、auth 应用边界、login HTTP、GraphQL 认证入口与 portal Auth 同步；
  专用 PostgreSQL 下的持久化、事务拒绝和会话安全回归通过。
- W3/W4：全部 28 个 mutation、nullable 查询、事务操作和消费者迁移；两个服务的
  --export-schema、SDL 快照断言与客户端 generate 完成。专用数据库验证目录、关联删除回滚、
  草稿重复来源回滚、批量阅读记录拒绝无部分写入、重复删除、空分页及类型化业务结果。
- W5：gateway/HTTP/GraphQL/RPC 使用真实 SDK 上下文；公网 header 不影响入口 root；
  日志与 span 过滤敏感载荷，body 错误/取消/丢弃和 RPC 取消只记录一次完成或中断。
  真实 Thrift 测试验证 gateway→HTTP→auth 的同 trace 与独立 span，GraphQL 位于入口认证之后。
  本地 OTLP 接收器验证 HTTP/protobuf、静态头、无 exporter、超时隔离与敏感字段不泄露。

受影响 Rust 包通过构建/Clippy；前端通过类型检查、oxlint、21 条定向测试和 portal 生产构建。
浏览器使用合成 API 响应，分别在 bookmarks/collections 确认空列表、拒绝保留表单、成功后刷新
失败不重放、响应丢失保留输入并阻止提交；详情验证不存在、主查询故障、关联部分失败保留正文，
以及删除响应丢失后的只读核对达成目标且 mutation 只发送一次。浏览器没有写入个人业务数据。

使用临时自签证书和隔离端口启动 gateway，验证 HTTPS 故障 envelope、requestId 与 header 一致、
外部关联值被替换及 SIGTERM 正常退出（约 5 秒）；login 实际 HTTP 拒绝和 SIGTERM 退出通过。
Pingora 的 5 分钟默认宽限等待改为 0，保留最多 5 秒 runtime 排空，再执行最多 5 秒 SDK shutdown。
Compose 五服务可选键解析和 xtask 环境继承回归通过；默认不依赖 OTLP 后端。

实现中的所有权调整：纯分页/查询组合移入 service-query，graphql-common 保留输入转换与
已有调用方的 re-export；auth RPC client 和 GraphQL span 同属 HTTP server 的子级，保持原有
先认证后执行 GraphQL 的边界；不为形成串行 trace 图改变认证流程。

本轮没有执行生产部署、Linux 镜像构建或外部小说站点抓取验收。生产构建仍有既有大 chunk 提示，
浏览器仍有主题/语言菜单既有 Base UI button 语义警告；这些不影响本轮结果恢复流程。

## 协调发布

GraphQL 返回类型、HTTP 错误形状和 Thrift 异常是破坏性变更。作为同一发布单元更新 auth、login、bookmarks、collections、gateway 与前端；不支持任意旧新混用，不增加永久兼容层。切换时先停止外部业务流量，停止旧消费者，再启动匹配版本的内部服务和前端，完成就绪后恢复入口；已打开旧页面遇未知契约提示刷新，不能继续提交。回退按整组镜像/前端回退。本轮没有数据库 schema 迁移或幂等数据迁移。
