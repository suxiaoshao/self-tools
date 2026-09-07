# 后端

`server/` 是本仓库的 Rust 子系统。Cargo workspace 定义在仓库根目录
`Cargo.toml`，成员来自 `server/packages/*` 与 `server/common/*`。

本文只维护后端的服务边界、跨 crate 契约、数据与生成链路。crate、依赖和 target
以各级 `Cargo.toml` 与 `cargo metadata` 为准；网关实现细节见
[`packages/gateway/README.md`](packages/gateway/README.md)，本地镜像和容器编排见
[`common/xtask/README.md`](common/xtask/README.md)。

## 服务拓扑

| 服务          | 协议与监听地址                 | 入口                             | 下游与运行时契约                                          |
| ------------- | ------------------------------ | -------------------------------- | --------------------------------------------------------- |
| `gateway`     | Pingora HTTP/HTTPS，地址可配置 | 对外入口；按 host 与 path 路由   | `login`、`bookmarks`、`collections` 与前端开发服务        |
| `auth`        | Volo Thrift，`0.0.0.0:80`      | 仅供内部服务通过 `auth:80` 调用  | `USERNAME`、`PASSWORD`、`SECRET`                          |
| `login`       | Axum HTTP，`0.0.0.0:8000`      | 认证 host 下的 `/api/*`          | 通过公共 `thrift` crate 调用 `auth:80`                    |
| `bookmarks`   | Axum HTTP，`0.0.0.0:8080`      | `/graphql`、`/fetch-content`     | `auth:80`；PostgreSQL URL 来自 `BOOKMARKS_PG`             |
| `collections` | Axum HTTP，`0.0.0.0:8080`      | collections host 下的 `/graphql` | `auth:80`；PostgreSQL URL 来自 `COLLECTIONS_PG`           |
| PostgreSQL    | Compose 中的 PostgreSQL 服务   | 不经过 `gateway`                 | `bookmarks` 与 `collections` 使用彼此独立的数据库连接 URL |

`gateway` 不代理 Thrift；认证 RPC 留在容器网络内。登录与 WebAuthn HTTP 请求先到
`login`，GraphQL guard 再按需要调用 `auth`。具体 host、路径优先级和前端 fallback
见网关 README。

## 服务包

- `packages/auth`：实现认证 Thrift server，负责登录、token 签发与校验。
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
| `graphql-common` | GraphQL 标量、分页、查询组合与校验等共享能力                   |
| `middleware`     | 按 Cargo feature 组合 CORS、HTTP trace 与 GraphQL trace        |
| `novel_crawler`  | 起点、晋江等小说站点的抓取模型与实现                           |
| `thrift`         | 认证 IDL、Volo 生成入口、导出类型和固定的 `auth:80` 客户端发现 |
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

## GraphQL 边界

`bookmarks` 与 `collections` 使用 async-graphql 的 code-first 模式：服务端 schema
由各包 `src/graphql.rs`、`src/graphql/**` 及其引用的 Rust 类型构建，`/graphql`
同时承载 POST 请求和开发用 playground。

前端的 `web/packages/bookmarks/schema.graphql` 与
`web/packages/collections/schema.graphql` 是客户端代码生成使用的本地 schema
快照，各包 `generate` script 只读取该快照与前端 operation。仓库当前没有注册把
Rust schema 自动导出到这些文件的脚本。因此服务端 GraphQL contract 变化时，需要
显式更新对应前端 schema 快照，再运行该前端包已有的 `generate` script，并检查
`src/gql/` diff；不要手改生成的客户端文件。

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

失败返回空 body，429 携带 `Retry-After: 1`；上游响应头、错误正文、Cookie 和原始错误不透传。成功图片缓存一小时，失败不缓存。bookmarks 图片日志仅包含来源类别、状态、耗时等有限字段；gateway 的该路径日志也隐藏 query。GraphQL 原有日志策略另行维护。

login、bookmarks、collections 使用共享 `CORS_ALLOWED_ORIGINS`：

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
- 全量验证入口为 `cargo clippy --all` 和 `cargo test --workspace`；manifest
  变化还应执行 `cargo metadata --no-deps --format-version 1`。
- GraphQL、Thrift、migration 或 Diesel schema 变化时，除 Rust 检查外，还要验证
  对应生成链路和实际消费者；涉及数据库的验证应使用明确的测试数据库，不能默认连接
  生产数据。
- 需要 Docker、证书、端口、域名或外部站点的验证，应先确认前置条件；无法执行时准确
  记录未验证的边界和原因。
