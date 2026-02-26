# AGENTS.md

本文件用于指导在本仓库内工作的 AI/Codex 代理。

## 目标

在不破坏现有架构的前提下，快速且可验证地完成代码修改、调试与文档维护。

## 仓库速览

- 前端 workspace：`web/packages/*`、`web/common/*`（pnpm）
- 后端 workspace：`server/packages/*`、`server/common/*`（cargo workspace）
- 部署相关：`docker/compose`、`docker/server`、`docker/web`

## 关键事实（写代码前先记住）

- `portal` 是唯一有 `rsbuild.config.ts` 的前端入口应用。
- `bookmarks` 与 `collections` 前端包是被 `portal` 引入的 workspace 包。
- `auth` 是 Thrift 服务（端口 80），由 `thrift` 公共库中的客户端按主机名 `auth:80` 发现。
- `login` 在 `8000`，`bookmarks`/`collections` 在 `8080`。
- `bookmarks` 依赖环境变量 `BOOKMARKS_PG`，`collections` 依赖 `COLLECTIONS_PG`。
- 前端存在硬编码线上域名（`sushao.top` 相关）。

## shadcn/ui 查询规则（必须遵循）

- 遇到任何 `shadcn/ui` 相关问题（组件选型、API 用法、迁移、CLI、registry），先查：`https://ui.shadcn.com/llms.txt`。
- `llms.txt` 作为 shadcn/ui 组件与文档入口索引；应先从其中定位目标组件文档，再进行实现或修改。
- 若本地实现与文档不一致，优先按文档修正，并在说明中注明参考链接。

## 推荐工作流

1. 先阅读目标包的入口与配置：
   - 前端：`package.json`、`rsbuild.config.ts`、`src/main.tsx`
   - 后端：`Cargo.toml`、`src/main.rs`、`router/`、`graphql/`
2. 只改与任务相关的最小范围文件。
3. 修改后至少执行与变更相关的检查：
   - 前端：`pnpm lint`、`pnpm test`
   - 后端：`cargo test -p <pkg>`，必要时 `cargo clippy --all`
4. 输出结果时给出：改动文件、关键行为变化、验证命令。

## 常用命令

根目录执行：

```bash
pnpm install
pnpm lint
pnpm run knip
pnpm test
pnpm build

cargo build --workspace
cargo test --workspace
cargo clippy --all

cargo run -p xtask -- build
cargo run -p xtask -- compose
cargo run -p xtask -- cert --out-dir docker/compose/certs
```

证书相关补充（本地联调）：

- `xtask cert` 会生成本地 CA 与站点证书文件：`ca.pem`、`fullchain.pem`、`privkey.pem`。
- 需将 `ca.pem` 导入系统信任后，再重启浏览器与 Nginx 容器。

单服务调试：

```bash
cargo run -p auth
cargo run -p login
cargo run -p bookmarks
cargo run -p collections
```

## Knip 规则

- 本仓库使用根目录 `knip.json` 作为唯一 Knip 配置入口。
- `pnpm lint` 已串联执行 `pnpm run knip`，默认命令为 `knip --config knip.json`。
- 以下目录中的 `unused exports/types` 作为生成代码或基础 UI 噪音处理，统一忽略：
  - `**/src/gql/**`
  - `**/src/components/ui/**`
- 对仅用于打包、代码生成、语言服务或命令行的依赖，优先通过 `knip.json` 的忽略配置维护，不要直接删除依赖。

## 完成后验证（必须执行）

- 完成任何代码修改后，必须运行对应验证命令，确认“初步通过”。
- 修改了 Rust 代码：必须重新运行 `cargo clippy --all`。
- 修改了 Rust 测试相关代码（测试文件、测试逻辑或影响测试行为的实现）：必须运行 `cargo test`（建议至少 `cargo test --workspace`，或最小相关包 `cargo test -p <pkg>`）。
- 修改了前端代码：必须运行 `pnpm lint`。
- 修改了前端测试相关代码（测试文件、测试配置或影响测试行为的实现）：必须运行 `pnpm test`。
- 在任务汇报中需要注明实际执行过的验证命令与结果；若未执行，必须说明原因。

## 修改约束

- 修改或新增代码文件时，统一使用 `UTF-8` 编码。
- 修改或新增代码文件时，统一使用 Linux 换行符（`LF`，`\n`）。
- 不要凭空添加仓库中不存在的脚本命令（例如 `scripts/*.sh`）。
- 不要把线上域名硬编码扩散到新文件；若需要新接口地址，优先引入可配置项。
- 不要改变 `thrift` 服务发现机制（`auth` 主机名）除非任务明确要求。
- 涉及 Diesel schema/migration 时，必须同步检查对应 `migrations/` 与 `model/schema.rs`。
- 未经要求不要重构大范围目录结构。

## 文档与提交要求

- 文档应优先写“可直接执行”的命令。
- 若某条命令依赖外部条件（Docker、证书、域名），必须显式标注。
- 提交说明应包含影响范围：前端/后端/部署。

## 故障排查提示

- 登录失败：先检查 `auth` 是否可在容器网络内以主机名 `auth` 访问。
- GraphQL 连接失败：确认 `BOOKMARKS_PG`/`COLLECTIONS_PG` 与服务端口映射。
- 前端本地联调异常：优先排查硬编码线上 URL 与本地环境不一致。
