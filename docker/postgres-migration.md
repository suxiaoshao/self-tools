# PostgreSQL 16 → 18 迁移

`cargo run -p xtask -- migrate-postgres` 使用 Rust xtask 和 Docker CLI，不要求宿主机安装 PostgreSQL 工具。执行环境为 Unix（需要 0700/0600 文件权限），备份目录的父目录必须已存在。目标为 PostgreSQL 18.6，默认镜像 `postgres:18.6-bookworm`；默认镜像同时固定 digest；已有镜像直接复用，缺失时拉取，执行会解析 image ID 并检查为 18 系列。默认仅预览，不访问 Docker。

```bash
cargo run -p xtask -- migrate-postgres \
  --user YOUR_EXISTING_SUPERUSER \
  --backup-dir /absolute/private/path/pg18-backup
```

`--user` 必须是旧实例已有的超级用户，使用容器内本地 socket 认证；命令不从仓库配置提取密码，也不支持交互密码输入。需要自定义认证时先在容器内配置受保护的 libpq 凭据。备份包含角色密码散列和全部业务数据，必须保存在仓库外；目录为 0700、文件为 0600，执行日志也属于私密备份。

执行前停止所有应用写入及外部数据库客户端写入，保留旧 PostgreSQL 运行；包括 auth（会话续期也会写库）、bookmarks、collections。保持停写直到切换，行数比较无法检测等量替换或字段更新，不能替代停写。预留备份与新数据卷的空间。

确认停写后在上述命令添加 `--execute --writers-stopped`。这两个参数仅表示操作者满足前置条件，命令不会自动停止应用。执行过程：

1. 拒绝非 16 源库、非超级用户、自定义 tablespace、已经存在的目标容器/volume；备份目录也必须全新。
2. 用源实例的 `pg_dumpall` 备份全部数据库、角色、所有权和授权，保留原有密码散列；检查备份前后数据库和用户表行数。扩展必须在目标镜像中可用，否则恢复会失败，不忽略错误。
3. 创建无网络、无宿主端口的新容器和新 volume。18 的挂载点为 `/var/lib/postgresql`，PGDATA 为 `/var/lib/postgresql/18/docker`，不挂载旧 volume。
4. 在新实例中通过 `psql ON_ERROR_STOP` 恢复；任何失败均退出并保留备份和现场。比较数据库/用户表清单与行数，再运行 ANALYZE。
5. 将随机的临时初始化角色禁用登录并清除密码。该角色可能仍拥有模板数据库，因此保留，不能随意删除。
6. 写入 `result.json`，记录解析的 image ID、目标 volume 与验证结果。源数据库、容器和 volume 全程保留。

命令成功只表示逻辑恢复和行数检查通过。正式切换前仍需核对扩展、关键约束、sequence、服务 schema 检查及业务读写。可先在独立环境演练；恢复结果不会自动加入现有业务网络。

切换时使用 `result.json` 的目标镜像和新 volume，更新 Compose 的 PGDATA/挂载路径及服务发现，停止旧 PostgreSQL 后启动新配置。禁止直接把 18 镜像套在 16 的旧目录上。仓库 Compose 已配置新路径和 `postgres18-data` 外部卷。切换前必须停止 staging 容器（默认 `postgres18-staging`），再启动 Compose 中的 postgres，避免两个进程打开同一卷。命令不自动执行服务 schema migration。

新实例尚未接受写入时，可以停止新实例并用旧镜像、旧卷恢复服务。新实例开始写入后，旧卷已不是最新数据，不能直接切回；必须停写并制定反向同步或备份恢复方案。命令失败后不删除现场，重试需使用新的目标名、volume 和备份目录。

验证记录：隔离的 16 → 18.6 虚构数据演练通过，覆盖数据库/表行数、外键关联、会话字节、序列状态和角色密码散列；尚未对实际业务数据执行迁移或切换。

依据：[PostgreSQL 版本政策](https://www.postgresql.org/support/versioning/)、[pg_dumpall](https://www.postgresql.org/docs/18/app-pg-dumpall.html)、[官方 Docker 镜像](https://github.com/docker-library/docs/blob/master/postgres/README.md)。
