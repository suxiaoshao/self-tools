# self-tools

一个以 React/TypeScript 前端和 Rust 后端组成的 monorepo，用于维护个人工具站点、配套服务与部署编排。

## 文档导航

文档按所有权分层维护，避免在根文档重复保存容易漂移的包级细节。

| 范围                                               | 文档                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------ |
| 前端 workspace、模块接入、GraphQL client 与共享 UI | [`web/README.md`](web/README.md)                                         |
| 后端 workspace、服务拓扑、Thrift、GraphQL 与数据库 | [`server/README.md`](server/README.md)                                   |
| Rust gateway 的路由、配置与 TLS                    | [`server/packages/gateway/README.md`](server/packages/gateway/README.md) |
| `xtask` 的镜像构建、容器编排与证书生成             | [`server/common/xtask/README.md`](server/common/xtask/README.md)         |
| Docker 镜像、Compose 资源与本地部署前置条件        | [`docker/README.md`](docker/README.md)                                   |
| 开发设计计划、跨包协调与完成记录                   | [`docs/dev/README.md`](docs/dev/README.md)                               |
| AI/Codex 在仓库中的工作政策                        | [`AGENTS.md`](AGENTS.md)                                                 |

## 仓库结构

```text
.
├── web/                    # pnpm workspace：入口应用、业务模块与公共包
├── server/                 # Cargo workspace：服务、公共 crate 与 xtask
├── docker/                 # 镜像、Compose 与部署资源
├── docs/dev/               # 文档先行的开发计划索引与跨仓计划
├── package.json            # 前端仓库级脚本事实源
├── pnpm-workspace.yaml     # pnpm workspace 边界
└── Cargo.toml              # Cargo workspace 边界
```

## 环境要求

- Node.js LTS 与根 `package.json` 声明版本的 pnpm
- Rust stable（`cargo`）
- Docker daemon（仅镜像构建、容器编排与相关验证需要）

## 快速开始

安装依赖：

```bash
pnpm install
cargo fetch
```

启动前端入口：

```bash
pnpm --filter portal dev
```

启动单个后端服务时使用其 Cargo package 名称：

```bash
cargo run -p <package>
```

服务依赖、端口、环境变量和本地联调条件见 [`server/README.md`](server/README.md)。

## 开发命令

不要在文档中维护 `package.json` 的完整副本。使用以下入口查看当前可执行命令：

```bash
pnpm run
cargo metadata --no-deps --format-version 1
cargo run -p xtask -- --help
```

仓库级常用验证入口是 `pnpm lint`、`pnpm test`、`pnpm build`、`cargo clippy --all` 和 `cargo test --workspace`；应按实际改动范围选择，而不是无条件执行全部命令。更细的生成与验证要求见对应子系统文档和 [`AGENTS.md`](AGENTS.md)。

## CI 与部署

- GitHub Actions 的实际触发条件与步骤以 [`.github/workflows/`](.github/workflows/) 为准。
- 镜像构建和 Compose 编排是两个独立阶段，详见 [`xtask` 文档](server/common/xtask/README.md)。
- 容器、证书、volume、域名解析及外部服务等前置条件见 [`docker/README.md`](docker/README.md)。
