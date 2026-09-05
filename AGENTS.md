# AGENTS.md

## 实现约束

- 在用户目标内，以正确性、架构一致性和长期维护成本选择最佳方案。模块拆分与重构由职责、依赖方向和所有权决定；文件大小或 diff 大小不单独决定改动边界。
- 修改前确认 Git 状态，沿相关入口、状态、请求、持久化、生成物及部署路径确定生产者和消费者。跨包重构同步受影响的接口、调用方、配置、生成物、测试、部署和所有者文档，避免两套事实源或无退出计划的兼容层。
- 生成物须先修改手写事实源，再通过现有生成入口更新。新增命令须同时实现并接入 manifest 或 CLI，不能把计划中的命令写成既有入口。
- Rust 模块使用同名文件与目录结构，禁止新增 `mod.rs`。
- shadcn/ui 组件、API、迁移、CLI 或 registry 工作从 `https://ui.shadcn.com/llms.txt` 定位官方文档，结合 `.agents/skills/shadcn/` 与 `web/README.md`；更新前区分本地定制与过期实现。

## 文档与命令入口

按实际影响读取对应文档与必要实现，已读且未变化的内容不重复加载：

| 范围                                          | 文档                                |
| --------------------------------------------- | ----------------------------------- |
| 环境与快速开始                                | `README.md`                         |
| 前端 workspace、GraphQL client、共享 UI       | `web/README.md`                     |
| 后端 workspace、服务、Thrift、GraphQL、数据库 | `server/README.md`                  |
| gateway 路由与 TLS                            | `server/packages/gateway/README.md` |
| xtask 与 Docker 编排                          | `server/common/xtask/README.md`     |
| 镜像、Compose、volume、证书与部署             | `docker/README.md`                  |
| 开发计划与跨包协调                            | `docs/dev/README.md`                |

架构与所有权查 README；脚本查根目录及目标包 `package.json`，Rust workspace 与 target 查 `Cargo.toml` 或 `cargo metadata`，CLI 参数查 `--help` 与实现。可执行事实优先于文档示例，当前改动涉及的文档漂移须同步修正。

## 文档先行

- 新功能，以及涉及公开契约、schema、数据库、安全、依赖或工具链、生成物、部署拓扑、多个 package/crate 的非平凡改动，修改生产代码前使用 `.agents/skills/implementation-plan-design/` 创建或更新计划；局部且不改变行为或契约的修正可免建计划。
- 计划放入能完整拥有改动的最小共同范围的 `docs/dev/`，由根 `docs/dev/README.md` 索引；跨范围契约和执行顺序、所有者子计划、双向链接及 Ready/Done 生命周期按该 skill 执行。事实或设计发生实质变化时先同步计划，不制造空子计划或重复章节。

## 验证与协作

- 依据实际影响选择现有包级或目标级 lint、测试、构建和 Clippy 入口；共享契约、workspace、工具链或集成变更覆盖所有受影响层级，不能仅验证叶子包。优先复用关键不变量的已有覆盖。
- schema、operation 等生成输入变更须运行所有者文档指定的生成入口并检查差异，再验证受影响层级；xtask、Docker 和部署改动按对应 README 检查静态配置，环境允许时运行实际任务。文档与配置使用适用的解析、格式检查及 `git diff --check`。
- 适用 CI、用户指定验证和 Git hooks 须完成；commit、push 等命令等待 hooks 结束，不用 `--no-verify` 或其他方式绕过失败。外部条件阻塞验证时，说明命令、原因和未验证范围。
- Issue 遵循 `.github/ISSUE_TEMPLATE/` 的匹配模板；创建分支前确认目标 issue 与命名约定。
- 汇报实际修改、行为变化、关键取舍和验证结果；跨前后端、数据库或部署的改动分别说明影响，命令有外部依赖时标明前置条件。
