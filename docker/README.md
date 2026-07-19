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
| `postgres`    | PostgreSQL                                 | 使用命名 volume `postgres`                                   |
| `auth`        | Thrift 认证服务                            | 依赖 `postgres`，读取 `.env`                                 |
| `login`       | HTTP 登录服务                              | 依赖 `auth`                                                  |
| `bookmarks`   | GraphQL 服务                               | 依赖 `auth`、`postgres`，读取 `.env`                         |
| `collections` | GraphQL 服务                               | 依赖 `auth`、`postgres`，读取 `.env`                         |

协议、监听端口、服务发现和数据库变量由 [`../server/README.md`](../server/README.md) 说明；gateway 的 host/path 路由由 [`../server/packages/gateway/README.md`](../server/packages/gateway/README.md) 说明。

## 配置与本地状态

- `compose/.env` 是本机配置且被 Git 忽略。直接使用 Docker Compose CLI 时，YAML 中的 `env_file` 决定服务级注入；当前 `xtask compose` 则会把该文件的全部值注入每个受管理容器。不要提交凭据或在文档中保存真实值，并在修正 `xtask` 行为前按更宽的暴露范围评估敏感信息。
- Compose 当前把宿主机 `/private/etc/letsencrypt` 挂载到容器 `/etc/letsencrypt`；gateway 默认从该容器目录下读取证书。
- `xtask cert` 默认写入 `compose/certs`，该目录也被 Git 忽略，但不会被当前 Compose 自动挂载。使用生成证书时需要同步调整 volume 和 gateway 证书路径配置。
- `postgres` 数据保存在命名 volume 中。修改 volume 名称、挂载点或数据库初始化策略前，必须明确已有数据的迁移与回滚方式。
- gateway 的 main upstream 默认通过 `host.docker.internal:3000` 访问 portal；collections fallback 指向 `host.docker.internal:3001`，但当前 workspace 没有提供对应的开发脚本或 Vite 入口，属于必须由外部环境提供或显式覆盖的遗留前置条件。本地 DNS、域名和端口仍需由运行环境提供。

## 运行方式

优先使用 [`xtask`](../server/common/xtask/README.md) 作为仓库工作流入口：

```bash
cargo run -p xtask -- build
cargo run -p xtask -- compose
```

`build` 生成镜像，`compose` 读取现有镜像并收敛 network、volume 和容器；两者不是等价命令。直接执行 `docker compose` 只适合明确需要 Compose CLI 原生行为的任务，并应以 [`compose/docker-compose.yml`](compose/docker-compose.yml) 为配置入口。

## 修改与验证

- 服务镜像变化时，同步检查对应 Dockerfile、`xtask build` 的镜像清单、Compose image 和 CI 发布工作流。
- 服务依赖、env、port 或 volume 变化时，同步检查 Compose、`xtask` 的解析能力、gateway/服务配置及文档。
- TLS 或域名变化时，同步检查 gateway 路由、证书路径、挂载和本地信任；生成证书不等于完成系统信任配置。
- 实际构建或编排需要可用的 Docker daemon。无法运行时应完成静态配置检查，并明确报告未执行的外部验证。
