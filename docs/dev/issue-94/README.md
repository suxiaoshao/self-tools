# Issue #94：仓库审查记录与问题归属

本轮仓库审查及后续整改已完成。本文保留历史证据入口与问题归属；当前实现、设计和必要验证以各所有者 README 及[开发计划索引](../README.md)为准。Issue 状态、PR 和合并记录由 [GitHub #94](https://github.com/suxiaoshao/self-tools/issues/94) 及对应子 Issue 管理，不在文档中重复维护百分比或流程进度。

## 审查证据

- [审查清单](review-checklist.md)：可复用的审查范围与判断标准。
- [2026-07-19 审查结果](review-findings.md)：35 个 Finding 的原始证据、影响、严重程度和建议边界，是整改前的历史快照，不代表当前代码仍有同样问题。

RF-001 的历史数据恢复不适用：用户确认执行相关迁移前尚无数据，因此没有既有关联丢失或恢复需求。[该决定](https://github.com/suxiaoshao/self-tools/issues/95#issuecomment-5566191954)不表示旧迁移 SQL 已被修改。其余问题按下表的所有者完成整改；这次收尾只核对既有结论，没有重新开展全仓审查。

## 问题归属

| 整改组                                                                                                                  | 历史 Finding                                               |
| ----------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| [#95 Repair collection-item migration](https://github.com/suxiaoshao/self-tools/issues/95)                              | RF-001；关联 RF-029/030 的 migration gate                  |
| [#96 Identity, session, WebAuthn and login boundaries](https://github.com/suxiaoshao/self-tools/issues/96)              | RF-002、RF-006、RF-016 认证部分、RF-035、RF-034 login 部分 |
| [#97 HTTP ingress and egress trust boundaries](https://github.com/suxiaoshao/self-tools/issues/97)                      | RF-003、RF-007                                             |
| [#98 Safe error, logging and tracing contracts](https://github.com/suxiaoshao/self-tools/issues/98)                     | RF-004、RF-005、RF-017、RF-025、RF-031                     |
| [#99 GraphQL application, repository and async database boundaries](https://github.com/suxiaoshao/self-tools/issues/99) | RF-008、RF-020、RF-034 后端部分                            |
| [#100 GraphQL request cost and pagination](https://github.com/suxiaoshao/self-tools/issues/100)                         | RF-009、RF-013、RF-015                                     |
| [#101 Database invariants and transactional mutations](https://github.com/suxiaoshao/self-tools/issues/101)             | RF-010、RF-011                                             |
| [#102 Frontend request state and Item data integrity](https://github.com/suxiaoshao/self-tools/issues/102)              | RF-012、RF-014、RF-016 页面/请求部分                       |
| [#103 Frontend workspace and feature ownership](https://github.com/suxiaoshao/self-tools/issues/103)                    | RF-018、RF-019、RF-026、RF-033、RF-034 前端部分            |
| [#104 UI safety, accessibility, i18n and form feedback](https://github.com/suxiaoshao/self-tools/issues/104)            | RF-023、RF-024、RF-016 表单反馈部分                        |
| [#105 Frontend runtime config, loading and CI gates](https://github.com/suxiaoshao/self-tools/issues/105)               | RF-021、RF-022、RF-030                                     |
| [#106 Build secrets and deployment readiness](https://github.com/suxiaoshao/self-tools/issues/106)                      | RF-028、RF-029                                             |
| [#107 Crawler ownership and deterministic tests](https://github.com/suxiaoshao/self-tools/issues/107)                   | RF-027、RF-032 公网测试部分、RF-034 crawler 部分           |

## 跨组边界

- **RF-016**：认证／WebAuthn 恢复归 #96，请求与页面状态归 #102，表单反馈归 #104。
- **RF-032**：各组覆盖自身关键不变量；crawler 的 fixture 与公网测试隔离归 #107，不另建泛化的补测试任务。
- **RF-034**：login 公开面归 #96，其他后端边界归 #99，前端边界归 #103，crawler 公开面归 #107。

后续新问题依据实际所有者确定范围；不要求回到本历史审查记录更新状态或重启已完成的审查。
