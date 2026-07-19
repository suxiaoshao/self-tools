# 开发设计文档

本目录是仓库所有可实施开发计划的统一发现入口。计划记录调研证据、已确定的设计、跨范围契约、工作包、验证和完成事实；当前稳定架构仍由最接近代码所有者的 README 维护。

创建或审阅计划时使用 [implementation-plan-design skill](../../.agents/skills/implementation-plan-design/SKILL.md)。不要在尚无实际计划时为 package 或 crate 预建空 `docs/dev` 目录。

## 放置规则

选择能够完整拥有改动的最小共同范围：

| 影响范围                                  | 规范计划位置                          |
| ----------------------------------------- | ------------------------------------- |
| 单个前端 package 或 `web/common` 包       | `<package>/docs/dev/<plan>/README.md` |
| 多个前端包                                | `web/docs/dev/<plan>/README.md`       |
| 单个后端 package 或 `server/common` crate | `<crate>/docs/dev/<plan>/README.md`   |
| 多个后端 crate                            | `server/docs/dev/<plan>/README.md`    |
| 跨前后端、数据库、部署或根工具链          | `docs/dev/<plan>/README.md`           |

有 GitHub issue 时使用 `issue-<number>` 作为 `<plan>`；没有 issue 且任务未授权创建时，使用稳定、可描述目标的短横线名称。后续创建 issue 不要求为了改名而破坏既有链接。

跨范围计划只维护全局目标、共享契约、所有者、工作包依赖顺序、数据库/部署顺序和聚合验证。各 package/crate 子计划维护自身精确文件、类型、函数、生成物和测试。父计划必须链接全部子计划，子计划必须反向链接父计划；不要复制两套契约。

## 生命周期

计划状态使用 `Draft`、`Ready`、`In progress`、`Blocked`、`Done` 或 `Superseded`。完成后保留原路径并记录实际验证与偏差；被替代的计划保留原路径并链接后继计划。只有长期约束未来多个任务的架构决定才另建 ADR，实施计划本身不能由 ADR 替代。

## 计划索引

所有规范计划，包括位于 `web/`、`server/`、package 或 crate 下的计划，都必须在这里登记。状态以规范计划文档为准，本索引只维护稳定链接和所有者，避免复制动态进度。

### 当前计划

暂无。

### 已完成或已替代计划

暂无。
