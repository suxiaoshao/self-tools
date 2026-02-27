# self-tools

一个前后端分离的 monorepo，包含个人工具站点及其后端微服务。

## 技术栈

- 前端：React 19、TypeScript、RSBuild、Apollo Client、pnpm workspace
- 后端：Rust、Axum、async-graphql、Volo Thrift、Diesel
- 数据库：PostgreSQL
- 部署：Docker / Docker Compose

## 仓库结构

```text
.
├── web/
│   ├── packages/
│   │   ├── portal/         # 主应用（RSBuild）
│   │   ├── bookmarks/      # 书签/小说管理前端模块
│   │   └── collections/    # 集合管理前端模块
│   └── common/             # 前端公共包（i18n、table、graphql、time 等）
├── server/
│   ├── packages/
│   │   ├── auth/           # 认证 Thrift 服务（80）
│   │   ├── login/          # 登录/WebAuthn HTTP 服务（8000）
│   │   ├── bookmarks/      # GraphQL 服务（8080）
│   │   └── collections/    # GraphQL 服务（8080）
│   └── common/             # Rust 公共库（thrift、middleware、xtask 等）
└── docker/
    ├── compose/            # docker-compose 与 .env
    ├── server/             # 各后端服务 Dockerfile
    └── web/                # 历史 nginx 相关文件（当前网关使用 gateway 服务）
```

## 环境要求

- Node.js LTS
- pnpm
- Rust stable（`cargo`）
- Docker（可选，用于一键编排）

## 安装依赖

```bash
pnpm install
cargo fetch
```

## 前端开发

启动 portal：

```bash
cd web/packages/portal
pnpm dev
```

常用命令（仓库根目录）：

```bash
pnpm lint        # format + oxlint + tsc --build
pnpm test        # jest
pnpm build       # 构建 web/packages/*
```

## 后端开发

在仓库根目录运行：

```bash
cargo build --workspace
cargo test --workspace
cargo clippy --all
```

单服务运行示例：

```bash
cargo run -p auth
cargo run -p login
cargo run -p bookmarks
cargo run -p collections
```

说明：

- `auth` 通过 Thrift 暴露在 `0.0.0.0:80`
- `login` HTTP 服务端口 `8000`
- `bookmarks` / `collections` GraphQL 服务端口 `8080`

## 环境变量

`docker/compose/.env` 中可见的变量名包括：

- `USERNAME`
- `PASSWORD`
- `SECRET`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `BOOKMARKS_PG`
- `COLLECTIONS_PG`
- `POSTGRES_HOST_AUTH_METHOD`

另外后端服务使用 Docker 服务名进行内部调用（如 `auth`）。

## Docker 运行

说明：当前入口网关是 `gateway` Rust 服务（镜像 `suxiaoshao/gateway`），不是 Nginx。

### 方式 1：使用 Docker Compose

```bash
cd docker/compose
docker compose up -d
```

### 方式 2：使用 Rust xtask（构建镜像 / 按 compose 启动）

```bash
cargo run -p xtask -- build
cargo run -p xtask -- compose
```

`xtask` 其他常用命令：

```bash
cargo run -p xtask -- lint
cargo run -p xtask -- cert --out-dir docker/compose/certs
```

## GraphQL 代码生成

```bash
cd web/packages/bookmarks && pnpm generate
cd web/packages/collections && pnpm generate
```

## CI 与发布

- PR 到 `main` 触发：前端 lint/test + Rust clippy/test（`.github/workflows/ci.yaml`）
- Push 到 `main` 且命中路径变更时，分别构建并推送后端镜像：
  - `auth`
  - `login`
  - `bookmarks`
  - `collections`

## 备注

当前前端请求地址和部分构建配置绑定了 `*.sushao.top` 域名（例如登录与 GraphQL 地址）。
如需纯本地联调，建议先统一抽离 API 基址配置再运行。
