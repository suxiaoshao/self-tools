# xtask

`xtask` 是本仓库面向 Docker 的开发编排工具。它从仓库根目录解析固定资源，并通过 Docker API 完成镜像构建、Compose 状态收敛和本地证书生成。

## 事实源

- CLI 入口与参数：[`src/main.rs`](src/main.rs) 和 `cargo run -p xtask -- --help`
- 任务分派：[`src/lib.rs`](src/lib.rs)
- 行为实现：[`src/tasks/`](src/tasks/)
- Compose 输入：[`../../../docker/compose/docker-compose.yml`](../../../docker/compose/docker-compose.yml)

参数和默认值可能变化，不在本文复制完整选项表。使用下列命令查看当前接口：

```bash
cargo run -p xtask -- --help
cargo run -p xtask -- <subcommand> --help
```

## 子命令边界

### `build`

- 以仓库根目录作为 Docker build context，使用 `docker/server/*.Dockerfile` 依次构建服务镜像。
- 支持通过显式 CLI 参数传入代理与 Debian mirror；本机 loopback 代理会转换为 Docker build 可访问的主机名。
- 只构建镜像，不创建网络、volume 或容器，也不启动服务。

### `compose`

- 读取 `docker/compose/docker-compose.yml`，并在存在时读取 `docker/compose/.env`。
- 当前实现会先把这份 `.env` 复制给每一个受管理容器，再叠加服务声明的 `env_file` 和 `environment`。这与 Docker Compose CLI 的服务级 `env_file` 边界不同；在实现修正前，应把 `.env` 中的每个值都视为会暴露给全部容器。
- 按 `depends_on` 解析服务顺序，确保命名 volume、默认 network 和容器处于声明状态。
- 容器配置或镜像签名变化时会重建容器；已有但停止的容器会被启动。
- 不构建或拉取镜像。运行前必须确保 Compose 引用的镜像可用；本地源码变化通常需要先执行 `build`。

### `cert`

- 生成本地 CA、站点证书和私钥，并写入所选输出目录。
- 只负责生成文件，不会导入系统信任、修改 hosts、调整 gateway 配置或挂载证书。
- 默认输出目录与当前 Compose 的证书挂载位置不同；用于本地 gateway 前，需显式配置 volume 以及 `GATEWAY_TLS_CERT`、`GATEWAY_TLS_KEY`。

### `lint`

当前是保留的空实现，不执行 Rust lint，不能作为验证入口。Rust 代码验证使用仓库根目录的 Cargo 命令；若将来实现该子命令，应同步更新本文和验证政策。

## 常见工作流

构建当前源码对应的服务镜像，再收敛容器状态：

```bash
cargo run -p xtask -- build
cargo run -p xtask -- compose
```

生成本地证书：

```bash
cargo run -p xtask -- cert --out-dir docker/compose/certs
```

Docker、Compose、证书挂载和域名解析的前置条件见 [`../../../docker/README.md`](../../../docker/README.md)。

## 修改与验证

- 新增或调整任务时，同步更新 CLI 定义、`Task` 分派、实现、测试和本文。
- `compose` 只支持 [`src/compose_types.rs`](src/compose_types.rs) 建模的 Compose 字段；扩展 `docker-compose.yml` 前先确认解析与运行语义。
- 至少运行 `cargo test -p xtask` 和 `cargo clippy --all`；涉及 Docker 实际行为时，再在 Docker daemon 可用的环境中执行受影响子命令。
- 不要用 `--no-verify` 或跳过失败检查；外部环境阻止验证时，明确记录未验证边界。
