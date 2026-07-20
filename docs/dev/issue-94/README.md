# Issue #94：仓库代码 Review 与整改跟踪

本文是 Issue #94 的 Review 协调与进度文档。它负责维护审查范围、问题清单、子 Issue 归属、依赖和完成状态；每个整改组的未确认问题保留在对应 GitHub Issue 中，等进入该组的开发设计阶段再讨论。

## 当前状态

- Parent issue: [suxiaoshao/self-tools#94](https://github.com/suxiaoshao/self-tools/issues/94)
- Review branch: `codex/issue-94-ai-repository-code-review`
- Review status: `Completed for the current checklist and repository state`
- Remediation tracking: `0 / 13 child issues completed`
- Production code changes on this branch: `None`
- Last progress refresh: `2026-07-20`
- Review checklist: [`review-checklist.md`](review-checklist.md)
- Confirmed findings: [`review-findings.md`](review-findings.md)

## 目标与边界

Issue #94 负责：

- 维护可重复使用的仓库 Review 清单。
- 保存本轮已确认问题、证据、影响和严重程度。
- 把整改工作归入边界清晰的子 Issue，避免一个 Finding 一个 Issue，也避免形成单个巨型整改分支。
- 维护每个 Review Finding 的处理归属、依赖和进度。
- 在子 Issue 完成、拆分、阻塞或调整边界时同步本表。

Issue #94 不负责：

- 在当前 Review 分支修改生产代码、migration、manifest、生成物、CI 或部署配置。
- 提前决定各整改组的目标架构、公开 API、schema、兼容策略或实现细节。
- 为尚未进入开发设计的子 Issue 预建计划文档或分支。
- 建立脱离具体问题的“补测试覆盖率”或“清理无用代码”总任务。

## 分支与合并策略

已确认采用以下流程：

1. 先将 Issue #94 的 Review 文档分支合并到 `main`，使清单、问题证据和子 Issue 映射成为后续工作的共同基线。
2. 每个子 Issue 在开始开发设计或实现时，从当时最新的 `main` 创建自己的 `codex/issue-<number>-<slug>` 分支。
3. 子 Issue 完成并通过自身验证后，独立提交 PR 合并回 `main`。
4. 存在严格依赖时，等待前置 PR 合并后再从新的 `main` 创建后续分支；不把所有子 Issue 长期堆叠在 Issue #94 分支。

只有当一组改动无法在中间状态保持仓库可构建、数据兼容或可发布时，才为那组明确建立短期集成顺序；默认不使用长期集成分支。

## 子 Issue 进度

进度以 GitHub Issue 状态为事实源。本表记录 Review Finding 的归属和协调状态；未确认问题见每个 Issue 的 `Open questions for implementation design`。

| Wave | Child issue                                                                                                             | Review Finding                                             | 当前进度                    | 依赖与协调                                                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- | --------------------------- | ------------------------------------------------------------------------- |
| 1    | [#95 Repair collection-item migration](https://github.com/suxiaoshao/self-tools/issues/95)                              | RF-001；关联 RF-029/030 的 migration gate                  | `Open — design not started` | 先确认已部署 migration 与现存数据；向 #106、#105 提供 migration 合同      |
| 1    | [#96 Identity, session, WebAuthn and login boundaries](https://github.com/suxiaoshao/self-tools/issues/96)              | RF-002、RF-006、RF-016 认证部分、RF-035、RF-034 login 部分 | `Open — design not started` | 与 #98 协调公开错误与日志边界                                             |
| 1    | [#97 HTTP ingress and egress trust boundaries](https://github.com/suxiaoshao/self-tools/issues/97)                      | RF-003、RF-007                                             | `Open — design not started` | 无前置；SSRF containment 不等待架构重构                                   |
| 1    | [#98 Safe error, logging and tracing contracts](https://github.com/suxiaoshao/self-tools/issues/98)                     | RF-004、RF-005、RF-017、RF-025、RF-031                     | `Open — design not started` | 为 #96、#99、#102、#104 提供安全错误与诊断边界                            |
| 2    | [#99 GraphQL application, repository and async database boundaries](https://github.com/suxiaoshao/self-tools/issues/99) | RF-008、RF-020、RF-034 后端部分                            | `Open — design not started` | collections 部分需结合 #95 数据状态；错误合同与 #98 对齐                  |
| 3    | [#100 GraphQL request cost and pagination](https://github.com/suxiaoshao/self-tools/issues/100)                         | RF-009、RF-013、RF-015                                     | `Open — design not started` | 建议在 #99 提供稳定 application/repository seam 后实施                    |
| 1    | [#101 Database invariants and transactional mutations](https://github.com/suxiaoshao/self-tools/issues/101)             | RF-010、RF-011                                             | `Open — design not started` | 正确性修复可先行；后续 #99 重构必须保留其 invariant                       |
| 1    | [#102 Frontend request state and Item data integrity](https://github.com/suxiaoshao/self-tools/issues/102)              | RF-012、RF-014、RF-016 页面/请求部分                       | `Open — design not started` | RF-012 数据丢失先处理；错误恢复与 #98、模块移动与 #103 协调               |
| 2    | [#103 Frontend workspace and feature ownership](https://github.com/suxiaoshao/self-tools/issues/103)                    | RF-018、RF-019、RF-026、RF-033、RF-034 前端部分            | `Open — design not started` | 保留 #102 的行为测试；为 #105 的最终加载边界提供稳定 owner                |
| 3    | [#104 UI safety, accessibility, i18n and form feedback](https://github.com/suxiaoshao/self-tools/issues/104)            | RF-023、RF-024、RF-016 表单反馈部分                        | `Open — design not started` | 静态 UI 修复可并行；动态错误映射与 #98 对齐                               |
| 3    | [#105 Frontend runtime config, loading and CI gates](https://github.com/suxiaoshao/self-tools/issues/105)               | RF-021、RF-022、RF-030                                     | `Open — design not started` | build/schema gate 可先行；最终分包结合 #103，migration gate 消费 #95 结论 |
| 1    | [#106 Build secrets and deployment readiness](https://github.com/suxiaoshao/self-tools/issues/106)                      | RF-028、RF-029                                             | `Open — design not started` | secret/readiness containment 可先行；migration 发布顺序消费 #95 结论      |
| 3    | [#107 Crawler ownership and deterministic tests](https://github.com/suxiaoshao/self-tools/issues/107)                   | RF-027、RF-032 公网测试部分、RF-034 crawler 部分           | `Open — design not started` | fixture 隔离可先行；trait 边界与 #99 协调                                 |

GitHub parent progress: `0 / 13` child issues completed (`0%`) as of `2026-07-20`.

## 跨 Issue Finding 归属

部分 Finding 本身汇总了多个 owner，不能机械交给单一整改分支：

### RF-016：静默失败与用户恢复

- 认证/WebAuthn promise、浏览器取消和登录恢复：#96。
- GraphQL/page loading、error、retry 和 Item 请求状态：#102。
- 普通表单校验、操作反馈和用户可见错误：#104。

### RF-032：测试缺口

- 不建立独立的“补测试覆盖率”Issue。
- 每个子 Issue 必须把自身安全、数据、状态、性能或边界 invariant 的测试作为完成条件。
- #107 专门拥有现有 crawler 测试依赖真实公网的问题，以及 fixture/live-test 隔离。

### RF-034：公开面与 manifest

- login module、dependency 和 feature：#96。
- bookmarks、collections、GraphQL common/middleware 的 Rust 可见性与公开面：#99。
- 前端 package export、manifest 和通用能力 owner：#103。
- crawler 无消费者公开合同：#107。

## 进度管理规则

每个子 Issue 在本文使用以下状态：

| 状态                         | 含义                                    |
| ---------------------------- | --------------------------------------- |
| `Open — design not started`  | 已确认问题边界，尚未开始开发设计        |
| `Design in progress`         | 正在确认目标设计、未决项、工作包和验证  |
| `Ready`                      | 设计已确认，可以开始实现                |
| `Implementation in progress` | 已创建子 Issue 分支并开始生产改动       |
| `Blocked`                    | 已记录具体外部条件或用户决策阻塞        |
| `Done`                       | 对应 Issue 已关闭，验证和实现引用已记录 |

更新规则：

1. 开始某个子 Issue 前，先刷新其 GitHub 状态和本文进度行。
2. 未确认问题只维护在对应 GitHub Issue；本文不复制答案或提前选择方案。
3. 同一根因下的新问题补充到现有子 Issue，并在本文更新 RF 映射。
4. 不同边界的新问题先回到 #94 分类，再决定是否加入现有组或新建子 Issue。
5. 子 Issue 拆分或合并时，先更新 GitHub 父子关系，再更新本文；不要保留两个重复 owner。
6. 子 Issue 完成时记录 PR、实际验证和剩余限制，并刷新 GitHub parent progress。

## Issue #94 完成条件

- Review 清单和 Findings 已合并到 `main`。
- 35 个 Review Finding 均有明确整改归属或明确的不处理结论。
- 所有子 Issue 均已完成，或由用户明确转移、合并、延期或关闭。
- 本文的 Issue 状态、PR/验证引用和 GitHub parent progress 与实际状态一致。
