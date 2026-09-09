# Docker 与本地编排

本目录拥有服务镜像、Compose 拓扑和相关部署资源。当前运行入口是 Rust `gateway`，不是 `docker/web` 中的 Nginx 镜像。

## 目录所有权

- [`server/`](server/)：后端服务和 gateway 的 Dockerfile，以及共享 Rust builder 镜像配置。
- [`compose/docker-compose.yml`](compose/docker-compose.yml)：当前容器、依赖、端口、环境文件、volume 与证书挂载的事实源。
- [`test/`](test/)：独立的 Docker 测试镜像资源，不属于常规 Compose 拓扑。
- [`web/`](web/)：遗留 Nginx 构建与配置；当前 Compose 和 `xtask build` 均不使用它。

## 当前 Compose 拓扑

| 服务          | 镜像/职责                                  | 依赖与持久化                                                 |
| ------------- | ------------------------------------------ | ------------------------------------------------------------ |
| `web`         | `suxiaoshao/gateway`，暴露 HTTP/HTTPS 入口 | 依赖 `login`、`bookmarks`、`collections`，挂载宿主机证书目录 |
| `postgres`    | PostgreSQL                                 | 使用外部 volume `postgres18-data`                            |
| `auth`        | Thrift 认证服务                            | 依赖 `postgres`，仅注入所需配置                              |
| `login`       | HTTP 登录服务                              | 依赖 `auth`                                                  |
| `bookmarks`   | GraphQL 服务                               | 依赖 `auth`、`postgres`，仅注入所需配置                      |
| `collections` | GraphQL 服务                               | 依赖 `auth`、`postgres`，仅注入所需配置                      |

协议、监听端口、服务发现和数据库变量由 [`../server/README.md`](../server/README.md) 说明；gateway 的 host/path 路由由 [`../server/packages/gateway/README.md`](../server/packages/gateway/README.md) 说明。

auth 运行镜像安装 `libpq5`、`libssl3t64` 与 `ca-certificates`，供 PostgreSQL 和 WebAuthn 使用；login 已不持有 WebAuthn，不再安装其原生运行包。

bookmarks 运行镜像安装 `libpq5` 与 `ca-certificates`：前者提供 PostgreSQL 客户端库，后者提供图片 HTTPS client 所需的系统信任根；缺少 CA 证书会使 client 初始化失败并阻止服务启动。

## 配置与数据库

复制 [示例配置](compose/.env.example) 到 `compose/.env` 后填写自己的值。文件只作为配置来源，各容器由 YAML 的 `environment` 逐键选择；gateway/login 不接收数据库或管理员密码。Compose 的变量和 xtask 的 `x-required-env` 声明是服务需求的事实源。不要在 build args、label 或 Git 中保存凭据。

PostgreSQL 固定为 18.6-bookworm 及对应镜像 digest，使用外部卷 `postgres18-data` 挂载到 `/var/lib/postgresql`，PGDATA 为 `/var/lib/postgresql/18/docker`。宿主端口仅绑定 `127.0.0.1:5432`；容器内使用 `postgres:5432`。升级旧 16 实例须使用 [迁移命令](postgres-migration.md) 先恢复到新卷，不能将 18 镜像用于旧数据目录。原 `postgres` 卷保留，不自动改名或删除。

TLS 证书目录只读挂载到 gateway。`xtask cert` 输出不自动接入该挂载。main upstream 默认是宿主 `3000` 的 portal，collections fallback 的 `3001` 是需要另行提供或覆盖的外部前置条件；服务健康不代表前端已经启动。

## 可选追踪导出

默认无需追踪后端，五个业务服务均启用 SDK 上下文和安全 JSON stdout 日志，可按 X-Request-ID 关联。
[示例配置](compose/.env.example) 的 OTEL_EXPORTER_OTLP_TRACES_ENDPOINT 接收完整
HTTP/protobuf traces URL（含 /v1/traces）；空值不创建 exporter。
OTEL_EXPORTER_OTLP_TRACES_HEADERS 使用 SDK 的 key=value 逗号分隔格式，可包含认证信息，
只发给 exporter，不打印。OTEL_EXPORTER_OTLP_TRACES_TIMEOUT 单位毫秒，默认 3000。
OTEL_TRACES_SAMPLER 支持 parentbased_always_on（默认）、parentbased_always_off、
parentbased_traceidratio；比例模式用 OTEL_TRACES_SAMPLER_ARG 指定 0–1。

这些键只作为五服务的可选 environment，不属于 x-required-env，不影响 readiness；
xtask 按现有 null 环境键规则读取，无值时不注入。不增加容器、端口、volume 或追踪后端。
错误配置阻止服务启动，运行中导出故障不改变业务响应；批处理有界，停止时 SDK 最多等待 5 秒。
集中调用树需要自行提供 OTLP 后端。

## 构建、迁移与部署

`cargo run -p xtask -- build --tag <release>` 使用共享 `docker/docker-bake.hcl`、Buildx 和根 `.dockerignore` 构建，Rust builder 从仓库源码一并构建。CI 同时发布 latest 与提交 SHA 标签；部署回退应记录并使用明确的 image ID/digest 或提交标签，不依赖 latest 指向旧版本。Compose 的 image 字段是运行版本事实源。

五个服务共享的 Cargo registry 和 target 缓存使用 `sharing=locked`，避免 Buildx 并行构建时同时解包依赖或写入编译产物。

CI 通过 `TAG=github.sha` 生成提交标签，再用 Bake 的 `tags+=` 追加 `latest`；标签不能用逗号拼成单个字符串。Rust builder 使用官方 `rust` 镜像自带的 Debian 软件源安装 clang、cmake、pkg-config 和 mold，不混入其他发行版的软件源。

部署前准备专用数据库/角色及连接配置。三个服务镜像都支持显式迁移，以下命令需要正确镜像、数据库容器和 Compose 网络已存在：

```bash
docker compose -f docker/compose/docker-compose.yml run --rm --no-deps auth /auth --migrate
docker compose -f docker/compose/docker-compose.yml run --rm --no-deps bookmarks /bookmarks --migrate
docker compose -f docker/compose/docker-compose.yml run --rm --no-deps collections /collections --migrate
cargo run -p xtask -- compose
```

迁移嵌入运行镜像，源码在服务各自的 `migrations/`；普通启动只检查 schema，不自动改表。首次环境可先用 Compose 启动 postgres，再显式迁移。执行编排前先停止迁移命令创建的 staging PostgreSQL，避免同时打开同一数据卷。

`xtask compose` 预检所有配置和镜像，检查外部数据卷，再按 postgres → auth → API/login → gateway 等待就绪。healthcheck 失败或超时返回非零，阻止继续部署依赖它的服务；不自动删除 volume 或回退 schema。健康接口与 CLI 的检查范围见 [后端说明](../server/README.md#部署入口与就绪检查)。直接使用 Docker Compose CLI 时，同样依赖 YAML 的 healthcheck / depends_on；xtask 的扩展预检不由 Docker Compose CLI 执行。

更新会短暂停止受影响容器。回退先停写并核对 schema 兼容，再恢复旧镜像；新数据库接收写入后不能直接切回旧卷。需要恢复备份时先保留故障现场，按 [迁移说明](postgres-migration.md) 处理。

## 修改与验证

- 服务镜像变化时，同步检查对应 Dockerfile、`docker-bake.hcl` 的镜像清单、Compose image 和 CI 发布工作流。
- 服务依赖、env、port 或 volume 变化时，同步检查 Compose、`xtask` 的解析能力、gateway/服务配置及文档。
- TLS 或域名变化时，同步检查 gateway 路由、证书路径、挂载和本地信任；生成证书不等于完成系统信任配置。
- 是否实际构建或编排取决于本轮验证与交付范围，遵循根 `AGENTS.md`；需要执行时先确认 Docker daemon 等前置条件。必要的外部验证无法运行时，说明具体未验证范围，不为可选场景持续排障。

## PostgreSQL 大版本迁移辅助

[迁移命令说明](postgres-migration.md) 提供 16 → 18 的独立备份/恢复入口，默认预览；不会自动修改当前 Compose 或切换运行数据库。
