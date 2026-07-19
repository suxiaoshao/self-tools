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
- 运行服务或测试前先用 Cargo 元数据确认 package，避免在文档中维护另一份完整命令
  清单。
- 修改 Rust 源码后，执行 `cargo clippy --all` 和至少受影响包的
  `cargo test -p <package>`。
- 修改公共 crate、workspace 配置或跨服务 contract 时，执行
  `cargo test --workspace`；manifest 变化还应执行
  `cargo metadata --no-deps --format-version 1`。
- GraphQL、Thrift、migration 或 Diesel schema 变化时，除 Rust 检查外，还要验证
  对应生成链路和实际消费者；涉及数据库的验证应使用明确的测试数据库，不能默认连接
  生产数据。
- 需要 Docker、证书、端口、域名或外部站点的验证，应先确认前置条件；无法执行时准确
  记录未验证的边界和原因。
