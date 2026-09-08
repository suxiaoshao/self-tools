# 后端

`server/` 是本仓库的 Rust 子系统。Cargo workspace 定义在仓库根目录
`Cargo.toml`，成员来自 `server/packages/*` 与 `server/common/*`。

本文只维护后端的服务边界、跨 crate 契约、数据与生成链路。crate、依赖和 target
以各级 `Cargo.toml` 与 `cargo metadata` 为准；网关实现细节见
[`packages/gateway/README.md`](packages/gateway/README.md)，本地镜像和容器编排见
[`common/xtask/README.md`](common/xtask/README.md)。

## 服务拓扑

| 服务          | 协议与监听地址                 | 入口                                       | 下游与运行时契约                                          |
| ------------- | ------------------------------ | ------------------------------------------ | --------------------------------------------------------- |
| `gateway`     | Pingora HTTP/HTTPS，地址可配置 | 对外入口；按 host 与 path 路由             | `login`、`bookmarks`、`collections` 与前端开发服务        |
| `auth`        | Volo Thrift，`0.0.0.0:80`      | 仅供内部服务通过 `auth:80` 调用            | `AUTH_PG`、`USERNAME`、`PASSWORD`、`SECRET`               |
| `login`       | Axum HTTP，`0.0.0.0:8000`      | 主站 `/api/auth/*`                         | 通过公共 `thrift` crate 调用 `auth:80`                    |
| `bookmarks`   | Axum HTTP，`0.0.0.0:8080`      | `/api/bookmarks/graphql`、`/fetch-content` | `auth:80`；PostgreSQL URL 来自 `BOOKMARKS_PG`             |
| `collections` | Axum HTTP，`0.0.0.0:8080`      | 主站 `/api/collections/graphql`            | `auth:80`；PostgreSQL URL 来自 `COLLECTIONS_PG`           |
| PostgreSQL    | Compose 中的 PostgreSQL 服务   | 不经过 `gateway`                           | auth、bookmarks、collections 使用彼此独立的数据库连接 URL |

`gateway` 不代理 Thrift；认证 RPC 留在容器网络内。登录与 WebAuthn HTTP 请求先到
`login`，两个 GraphQL POST 入口在执行 resolver 前调用一次 `auth.Check`。具体 host、路径优先级和前端 fallback
见网关 README。

## 服务包

- `packages/auth`：实现认证 Thrift server，负责单管理员登录、服务端 session、Passkey 和短期 challenge。
- `packages/login`：提供登录和 WebAuthn HTTP API，把凭证认证委托给 `auth`。
- `packages/bookmarks`：书签与小说领域的 GraphQL API，并提供正文抓取入口。
- `packages/collections`：集合与条目领域的 GraphQL API。
- `packages/gateway`：基于 Pingora 的 HTTP/HTTPS 入口、TLS 终止与反向代理。

每个服务的监听地址、路由和环境变量读取以 `src/main.rs`、`src/router.rs` 与直接相关
源码为准；Dockerfile 的 `EXPOSE` 只是镜像元数据，不能替代运行时源码和 Compose
拓扑。

## 公共 crate

| crate            | 职责                                                           |
| ---------------- | -------------------------------------------------------------- |
| `service-errors` | 与协议无关的业务拒绝/故障、输入问题与公开错误代码              |
| `service-query`  | 校验后的分页范围、查询组合与纯查询条件                         |
| `telemetry`      | OpenTelemetry SDK 生命周期、可信传播与白名单 JSON 日志         |
| `graphql-common` | GraphQL 标量、输入 adapter、公开错误和校验结果投影             |
| `middleware`     | 按 Cargo feature 组合 CORS、HTTP trace 与 GraphQL trace        |
| `novel_crawler`  | 起点、晋江等小说站点的抓取模型与实现                           |
| `thrift`         | 认证 IDL、Volo 生成入口、导出类型和固定的 `auth:80` 客户端发现 |
| `service-health` | 只读就绪检查、运行镜像中的显式 schema 迁移与版本校验           |
| `xtask`          | 镜像构建、Compose 编排和本地证书等仓库开发工具                 |

公共能力进入 `server/common/` 的前提是有多个明确消费者和稳定职责；不要仅为减少单个
服务文件长度而创建公共 crate。

## `auth:80` Thrift 契约

- `common/thrift/idl/auth.thrift` 是 RPC 接口的事实源；`volo.yml` 与 `build.rs`
  驱动代码生成，生成代码进入 Cargo `OUT_DIR`，不要手改生成结果。
- `packages/auth/src/main.rs` 当前绑定端口 `80`。
- `common/thrift/src/lib.rs` 当前解析主机名 `auth` 并连接端口 `80`；`login`、
  `bookmarks` 和 `collections` 都通过这个客户端调用认证服务。
- 修改 IDL、主机名或端口时，必须同步服务端、公共客户端、全部调用方、Compose
  拓扑、测试和相关文档，不能只改其中一侧。

## 管理员、会话与通行密钥

`auth` 为单实例、单管理员服务。启动读取非空 `USERNAME`、`PASSWORD`、`SECRET`，
用 HMAC-SHA256 配置指纹检测变化；账号、密码或 SECRET 改变后重启会撤销所有 session，
Passkey 保留。密码不进入数据库、token、HTTP JSON 或日志。旧 JWT/localStorage 登录失效，
旧内存 Passkey 需要重新注册，不保留兼容入口。

Session 使用 32 字节随机 token，数据库只保存 SHA-256；实际认证请求延长 30 天闲置期限，
90 天绝对期限不延长。退出撤销当前 session；删除 Passkey 同时撤销由它建立的 session。
添加、命名和删除 Passkey 要求 5 分钟内完成密码或 Passkey 验证，密码始终保留为恢复入口。
Passkey 完整库数据存 PostgreSQL；challenge 只在 auth 内存中保留 5 分钟、最多 256 个，
绑定浏览器 Cookie、用途及已登录 session，完成时一次性消费。服务重启后 challenge 重新开始。
密码尝试共享每分钟 10 次预算，challenge 开始共享每分钟 60 次预算，不支持多副本协调。

浏览器统一请求主站 `/api/auth/*`，Cookie 为 `__Host-st_session` / `__Host-st_ceremony`，
均使用 Secure、HttpOnly、SameSite=Strict、Path=/，不设置 Domain。所有认证 fetch 与
GraphQL POST 携带 `X-Self-Tools-Request: 1`；修改请求还要求精确 Origin 和 JSON Content-Type。
`AUTH_ORIGIN` 在 auth/login/两个 GraphQL 服务中一致，默认 `https://sushao.top`；
WebAuthn RP ID 默认由其 host 推导，可显式用 `AUTH_RP_ID` 指定由库校验的 RP。
HTTP 层校验 Cookie 结构与唯一性，auth 统一判定 session token：不可用值按未登录处理，
查询 session 返回 null，受保护操作返回 401；密码/Passkey 登录可替换无效旧 Cookie，退出仍成功。
重复 Cookie、来源违规及损坏的 ceremony 绑定继续严格拒绝。查询 session 不写回 Cookie。
login 不授予跨域 CORS；`CORS_ALLOWED_ORIGINS` 不能替代认证 API 的同源校验。
HTTP/RPC 的完整端点与错误码见 [认证设计](../docs/dev/issue-96/README.md#http-api)。

认证数据库必须由部署者先创建独立库和角色，并通过 `AUTH_PG` 配置。以
`server/packages/auth` 为 cwd，使用进程环境 `DATABASE_URL` 指向该库后执行：

```bash
diesel migration run
diesel print-schema
```

`auth/diesel.toml` 指向 `src/repository/schema.rs`，migration 是手写事实源；部署前显式执行，
服务启动不自动改表。同步 Diesel 操作通过最多 4 个 blocking 任务和连接处理。
过期 session 在启动和登录时清理，持久化 Passkey 格式无法读取时拒绝启动。
升级须协调部署 auth/login/GraphQL/gateway 与 portal，业务数据库及 volume 无迁移。
认证 migration 的 down 会丢失新 session 和 Passkey，不作为日常回滚。

签名与数据库关键回归使用专用 `self_tools_auth_test` 库，先应用相同 migration，设置
`AUTH_TEST_PG` 后运行 `cargo test -p auth persistent_sessions_and_signed_passkey_lifecycle -- --ignored`。
该测试只允许指定名称的独立测试库，会清空其中三张认证表；不指向业务或实际认证数据库。

## 部署入口与就绪检查

五个服务支持 `--check-ready`，检查已经运行的本地服务并用退出码报告结果；不创建会话、注册凭据或迁移 schema。HTTP 服务的内部 `/health/ready` 只返回 204/503，不返回内部 cause。gateway 对该路径只允许 loopback 请求，避免通过外部路由转发到内部健康接口。

- auth 的 `Ready` RPC 查询实际连接池和本镜像要求的 migration 版本；无认证状态变更。
- login 检查 HTTP 入口和 auth；bookmarks/collections 检查实际 HTTP、数据库连接池/schema 和 auth。
- gateway 检查自身 HTTP、三个 API upstream，以及 TLS 端口可连接。证书在正常启动时加载；探针不承担证书到期、完整 TLS 协议或宿主前端可用性验证。
- auth/bookmarks/collections 支持 `--migrate`，读取各自数据库 URL，用嵌入 migration 在会话 advisory lock 下显式升级。已有未知 migration 时拒绝降级，不提供自动 down。正常启动和就绪检查均只读取 migration 记录；缺失、未应用或比镜像更新的 schema 拒绝就绪。

超时预算集中在 `service-health/src/budget.rs`，沿调用链递增：数据库检查 5s → auth RPC 6s（远端 DNS 另限 1s）→ API HTTP 探测 9s → gateway 本地 HTTP 11s，加 TLS 连接最多共 13s。HTTP 预算覆盖 DNS、连接、写请求和读响应的全过程，gateway 的三个 upstream 并行检查。Compose 的服务 healthcheck 为 15s，留出 CLI 启动余量；xtask 每个服务最多等待 90s。调整预算须同步外层探测与 Compose，避免健康但较慢的依赖被提前判失败。

共享实现位于 `common/service-health`；`migrations/` 为唯一版本事实源，build.rs 跟踪其改动。Diesel schema 生成仍使用服务目录中的 `diesel print-schema`。数据库迁移检查回归需要专用 `self_tools_health_test` 库和 `SERVICE_HEALTH_TEST_PG`，通过 `cargo test -p service-health --all-features schema_gate_is_read_only_and_migration_is_explicit -- --ignored` 显式运行。

## GraphQL 边界

`bookmarks` 与 `collections` 使用 async-graphql 的 code-first 模式：服务端 schema
由各包 `src/graphql.rs`、`src/graphql/**` 及其引用的 Rust 类型构建。主站
`/api/bookmarks/graphql` 和 `/api/collections/graphql` 分别承载 POST 和开发用 playground。
POST 必须通过精确 Origin、自定义 header 与 session 检查；401/403/503 在 resolver 前返回。
字段 guard 消费入口验证结果，不再重复调用 RPC。

前端的 `web/packages/bookmarks/schema.graphql` 与
`web/packages/collections/schema.graphql` 是客户端代码生成使用的本地 schema
快照，各包 generate script 只读取该快照与前端 operation。两个服务均支持
`cargo run -p <collections|bookmarks> -- --export-schema`，无需数据库或 auth；更新对应
schema.graphql 后运行 `pnpm --filter <collections|bookmarks> generate`。
快照回归断言与 Rust schema 一致。
不要手改 `src/gql/` 生成文件。

collections 的 model/service 仅使用应用类型；GraphQL adapter 投影写入标识和业务拒绝。
目录层级变更、条目和关联写入在事务内按固定表顺序取得写锁，避免缺少父目录外键时出现
悬空目录，以及 exists 检查后的并发删除造成错误分类。事务拒绝保持 Err；正常超末页为空列表。
专用数据库回归：先以 `COLLECTIONS_PG` 执行 `--migrate`，再以相同 URL 设置
`COLLECTIONS_TEST_PG`，运行 `cargo test -p collections collections_transactions_and_typed_results -- --ignored`。
此测试清空专用库中的 collections 表，不得指定个人业务库。

bookmarks 的 model/service 只使用应用类型。草稿、多表删除、目录操作和批量阅读记录在事务中
提交，业务拒绝保持 Err 并回滚。先用 BOOKMARKS_PG 执行 --migrate，再以相同 URL 设置
BOOKMARKS_TEST_PG，运行 `cargo test -p bookmarks bookmarks_transactions_and_typed_results -- --ignored`。
该测试清空专用库的 bookmarks 表，不能使用个人业务库。

## 安全错误与 tracing

service-errors 拥有 UseCaseError、保留 source 的 Fault 和公开故障分类；领域拥有业务拒绝。
HTTP/GraphQL 只输出受控 code、requestId 和结构化详情，不能从 source 构造响应。
28 个 GraphQL mutation 使用 SDL union，系统故障走 errors；详情缺失为 null，关联故障保留
其他可用字段。完整合同见 [浏览器 API](../docs/dev/issue-98/api.md)。service-query 拥有纯分页/查询类型。

五个服务统一使用 telemetry SDK 和白名单 JSON 日志。gateway 建立公网 root，内部 HTTP/Thrift
校验载体并建立独立 server/client span；GraphQL span 在入口认证后创建，与 auth RPC client
同属 HTTP server 的子级。requestId 在同一入口请求中一致。日志不含 body、用户输入、凭据、
完整 URL 或原始 source；无 exporter 仍可关联 stdout。HTTP body/RPC future 提前结束记 interrupted。
HTTP 服务处理 SIGINT/SIGTERM 后排空请求并执行有界 SDK shutdown；auth 使用 Volo 的停止流程。

真实 SDK/RPC 集成回归：迁移后的专用 AUTH_TEST_PG 下运行
`cargo test -p auth gateway_http_graphql_and_real_auth_rpc_share_trace -- --ignored`，
使用临时 loopback Thrift listener 验证成功、部分 GraphQL 故障和远端故障的父子关系。
`cargo test -p telemetry real_otlp_protobuf_and_failure_isolation` 使用临时本地 OTLP 接收器
验证 HTTP/protobuf、无 exporter、超时隔离及敏感字段过滤。
可选配置见 [Docker README](../docker/README.md#可选追踪导出)。

## 数据库、migration 与 Diesel schema

- 数据库结构演进的事实源位于各服务的 `migrations/`；每个 migration 都应提供可审阅
  的 `up.sql` 与 `down.sql`，并明确已有数据与回滚影响。
- `bookmarks` 从 `BOOKMARKS_PG` 建立连接池，`collections` 从
  `COLLECTIONS_PG` 建立连接池。两者在构建 GraphQL schema 时创建连接池。
- `collections/diesel.toml` 直接把 Diesel schema 输出到
  `src/model/schema.rs`。
- `bookmarks/diesel.toml` 把原始输出写到 `src/model/schema/pre_schema.rs`；运行时使用
  的 `src/model/schema.rs` 还集成了 `custom_type.rs` 中的 PostgreSQL enum 映射和
  项目级调整。生成后必须有意识地核对并合并差异，不能用 `pre_schema.rs` 直接覆盖
  运行时 schema。
- 当前服务启动路径不自动执行 migration。应用 migration 与刷新 Diesel schema 是
  显式开发/部署步骤，执行前应确认 Diesel CLI、目标数据库 URL 和当前工作目录对应
  正确服务。

修改数据库结构时，应按 `migration -> 目标数据库 -> Diesel schema -> model/service ->
GraphQL contract -> 前端 schema/codegen` 的依赖方向检查所有消费者。

## 图片代理与跨域来源

bookmarks 的 `GET /fetch-content?url=...` 仅代理起点和晋江已核验的封面与作者图片。具体主机、路径和参数规则由 `packages/bookmarks/src/router/fetch_content/policy.rs` 维护；扩展来源须先提供官方页面样本，再补允许/拒绝测试。`i0-static.jjwxc.net` 支持受限 authorspace 静态路径和 `authorimagespace.php`（仅 Base64 数字作者 ID 与图片文件名）；该历史来源已由用户确认并完成 HTTPS 抽样。已有数据库中的原始图片 URL 不改写，HTTP/协议相对地址仅在命中规则后升级为 HTTPS。

代理公开访问，不接受登录凭据作为授权输入，也不向上游转发请求头。只连接经校验的公网地址，禁止重定向、环境代理和自动重试；要求部署环境支持正常 DNS 与直连 HTTPS。连接超时 3 秒、全程 10 秒、单图最多 5 MiB。单进程最多 16 个下载，全局令牌桶容量 32、每秒补充 8 个；多副本分别计算。完整收集后根据文件签名返回 JPEG/PNG/GIF/WebP，不解码或转码，不支持 SVG/HTML。该预算限制下载缓冲和上游请求，不是进程总内存或带宽硬配额。

失败返回空 body，429 携带 `Retry-After: 1`；上游响应头、错误正文、Cookie 和原始错误不透传。成功图片缓存一小时，失败不缓存。图片下载建立 image.http span；HTTP 完成日志遵循统一安全字段规则，不记录目标 URL 或 query。

bookmarks、collections 的图片或其他遗留跨域入口使用共享 `CORS_ALLOWED_ORIGINS`：

```dotenv
CORS_ALLOWED_ORIGINS=https://sushao.top
```

未设置时仅信任 `https://sushao.top`；设置后覆盖默认值，逗号分隔完整 Origin。显式空值不授予任何跨域来源。开发直连须显式加入例如 `http://localhost:3000`。不支持通配符、任意子域或隐式 localhost；非法配置在监听前使启动失败。仍允许业务需要的 GET/POST/PUT、Content-Type/Authorization 和 credentials。CORS 控制浏览器跨域读取，不代替认证，也不能限制普通图片标签或非浏览器客户端的访问。

代理默认测试不访问公网。公开来源抽样需显式运行：

```bash
cargo test -p bookmarks live_image_sources -- --ignored --nocapture
```

该测试需要公网 DNS 和直连 HTTPS；使用合成 IP 的本机代理环境会被目标地址规则拒绝。不要为了测试通过关闭生产 IP 校验。完整设计与验证状态见 [#97 计划](../docs/dev/issue-97/README.md)。

## 实现约定

- 新增 Rust 模块时不使用 `mod.rs`；使用 `foo.rs` 与 `foo/` 并存的模块结构。
- 先修改手写事实源，再刷新生成物；不要在生成文件里绕过 IDL、migration、GraphQL
  schema 或 operation。
- 跨服务重构应一次性更新公开接口和全部调用方，不保留两套事实源或没有退出计划的
  临时兼容层。
- 追踪跨层问题时，从服务入口沿 router、GraphQL/RPC handler、service、model、
  数据库与容器依赖完整核对。

## 命令与验证

- workspace 成员、crate 名和依赖以根 `Cargo.toml`、目标 crate 的 `Cargo.toml` 与
  `cargo metadata --no-deps --format-version 1` 为准。
- Rust 源码改动使用 `cargo clippy -p <package>`；行为或测试改动使用
  `cargo test -p <package>`，范围按根 `AGENTS.md` 选择。
- 全量入口为 `cargo clippy --all` 和 `cargo test --workspace`，执行范围遵循根 `AGENTS.md`。
  `cargo metadata --no-deps --format-version 1` 用于需要检查 workspace/target 结构时，
  无需在 Cargo 已验证 manifest 后仅为重复解析再执行一次。
- GraphQL、Thrift、migration 或 Diesel schema 变化时，除 Rust 检查外，还要验证
  对应生成链路和实际消费者；涉及数据库的验证应使用明确的测试数据库，不能默认连接
  生产数据。
- 需要 Docker、证书、端口、域名或外部站点的验证，应先确认前置条件；无法执行时准确
  记录未验证的边界和原因。
