# 开发设计文档

本目录是仓库所有可实施开发计划的统一发现入口。计划记录调研证据、已确定的设计、跨范围契约、工作包、验证和完成事实；当前稳定架构仍由最接近代码所有者的 README 维护。

创建或审阅计划使用 [implementation-plan-design skill](../../.agents/skills/implementation-plan-design/SKILL.md)；目录、命名、父子关系和生命周期见 [布局规则](../../.agents/skills/implementation-plan-design/references/documentation-layout.md)。

## 计划索引

所有规范计划，包括位于 `web/`、`server/`、package 或 crate 下的计划，都必须在这里登记。状态以规范计划文档为准，本索引只维护稳定链接和所有者，避免复制动态进度。

### 当前计划

| 计划                                                                  | 规范所有者                                     | 目的                                                                      |
| --------------------------------------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------- |
| [Issue #96：统一登录、Session 与通行密钥管理](issue-96/README.md)     | auth / login / portal                          | 明确认证持久化、同源 Cookie 与两种登录流程。                              |
| [Issue #97：两站图片代理与 CORS 来源边界](issue-97/README.md)         | bookmarks / middleware                         | 明确图片目标限制、资源预算和可信 Origin 合同。                            |
| [Issue #98：端到端错误、日志与链路追踪](issue-98/README.md)           | server / web / gateway                         | 明确业务结果、错误恢复、协议转换和跨服务诊断合同。                        |
| [Issue #99：GraphQL 应用边界与同步数据库执行隔离](issue-99/README.md) | bookmarks / collections / service-db           | 收回 transport 的数据库与适配器访问，统一有界 blocking 执行和事务所有权。 |
| [Issue #100：GraphQL 查询成本与稳定分页](issue-100/README.md)         | bookmarks / collections / graphql-common / web | 统一 SQL 筛选与稳定分页、批量关联读取及请求成本限制。                     |

### 已完成或已替代计划

暂无。
