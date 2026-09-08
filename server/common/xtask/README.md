# xtask

`xtask` 是仓库的构建、容器编排和本地证书工具。`build` 调用 Docker CLI/Buildx；`compose` 使用 Docker API。CLI 参数以 `cargo run -p xtask -- <subcommand> --help` 与 [`src/main.rs`](src/main.rs) 为准。

## 构建

```bash
cargo run -p xtask -- build --tag my-release
```

默认 tag 为 `latest`。本地与 CI 共用 `docker/docker-bake.hcl`，从仓库源码构建 Rust builder 和五个服务，需要本机 Docker CLI 与 Buildx。根 `.dockerignore` 是本地和 CI 唯一的输入过滤规则，先由 Buildx 过滤再上传，不自行归档仓库。规则采用默认排除，允许 Cargo/源码/IDL/migration/必要构建资源，并排除允许目录中的 `.env`、私钥、证书和本地输出。

代理与 Debian mirror 通过显式参数传入；loopback 代理转换为容器可访问的地址。不接受含凭据的代理或 mirror 地址，secret 不能通过 build args 传递；CLI 自身的宿主代理与传给构建容器的地址分开。`build` 只构建/加载镜像，不启动业务服务。

## 编排

```bash
cargo run -p xtask -- compose
```

输入为 [`docker/compose/docker-compose.yml`](../../../docker/compose/docker-compose.yml)。运行前必须已具备指定镜像、迁移后的数据库卷和正确 schema；不自动拉镜像或运行 migration。

- 项目 `.env` 仅为显式声明的变量供值。服务环境从自己的 `env_file` 开始，再应用 `environment`；仓库 Compose 使用逐键 `environment`，没有整份共享 env_file。null 优先读取进程环境，再读项目文件；缺失不注入、空字符串保留。不支持 `${…}` 插值。
- `x-required-env` 检查必填非空变量。镜像、配置、归属、依赖和外部卷检查通过后才修改容器。不存在的 external volume 拒绝自动创建；`x-exclusive` 卷如果仍被其他运行容器占用则拒绝部署。
- 只替换具有匹配项目/服务 label 的受管容器。在内存比较 image ID、实际环境、命令、healthcheck、挂载、端口、网络和 restart policy；不把密码或密码哈希写入 label。旧明文 signature label、旧额外环境变量会触发重建清除。
- 端口支持 `host-port:container-port` 和 `IPv4:host-port:container-port`，保留 host IP；其他形式报错，不能默默绑定所有接口。卷名和挂载依据 Compose，不删除持久卷。
- 支持列表依赖和详细 `service_started` / `service_healthy`。healthcheck 使用 CMD 数组，时间支持整数 s/ms。未知字段/条件拒绝解析。按依赖启动，并等待当前服务的健康状态；不把 running 当作 healthy。
- 每次等待最多 90 秒，停止、重启循环、unhealthy 或超时均失败，且停止后续依赖服务的部署。可显式用 `--retries` 重试；最终保留具体失败原因。此命令不提供持续自愈或零停机更新。

替换容器会停止旧进程。失败时保留 volume，不自动执行 migration down；回退须选定旧镜像且 schema 兼容。数据库升级和切换说明见 [Docker README](../../../docker/README.md)。

## PostgreSQL 大版本迁移

```bash
cargo run -p xtask -- migrate-postgres --user postgres --backup-dir /absolute/private/path/pg18-backup
```

默认预览，不访问 Docker。执行须显式添加 `--execute --writers-stopped`，要求 Unix、Docker CLI，以及已存在的备份父目录。Rust 负责容器/新卷与私密文件编排，容器内 `pg_dumpall` / `psql` 负责 SQL 导出恢复；保留源库，不自动切换。停写、认证、验证和回退约束见 [迁移说明](../../../docker/postgres-migration.md)。

## 证书

```bash
cargo run -p xtask -- cert --out-dir docker/compose/certs
```

仅生成 CA/站点证书和私钥，不导入系统信任、不修改 hosts、不改 gateway 挂载。生成位置与实际证书挂载可能不同，应显式配置 `GATEWAY_TLS_CERT` / `GATEWAY_TLS_KEY`。

`lint` 是保留的空入口，不能用于验证。修改 CLI、Compose 解析和行为时同步接口与文档；Rust 使用受影响的 `cargo test -p xtask` / `cargo clippy -p xtask`。Docker 配置稳定性回归需显式提供 `XTASK_DOCKER_TEST_IMAGE`（本地 PostgreSQL image ID），再运行 `cargo test -p xtask docker_configuration_stays_stable_without_secret_labels -- --ignored`；测试创建独立容器/网络，成功后清理。
