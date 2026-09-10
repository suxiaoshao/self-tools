# 开发设计文档

本目录是仓库所有可实施开发计划的统一发现入口。计划记录调研证据、已确定的设计、跨范围契约、工作包、验证和完成事实；当前稳定架构仍由最接近代码所有者的 README 维护。

创建或审阅计划使用 [implementation-plan-design skill](../../.agents/skills/implementation-plan-design/SKILL.md)；目录、命名、父子关系和生命周期见 [布局规则](../../.agents/skills/implementation-plan-design/references/documentation-layout.md)。

## 计划索引

所有规范计划，包括位于 `web/`、`server/`、package 或 crate 下的计划，都必须在这里登记。状态以规范计划文档为准，本索引只维护稳定链接和所有者，避免复制动态进度。

| 计划                                                                                | 规范所有者                                      | 目的                                                                      |
| ----------------------------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------- |
| [Issue #96：统一登录、Session 与通行密钥管理](issue-96/README.md)                   | auth / login / portal                           | 明确认证持久化、同源 Cookie 与两种登录流程。                              |
| [Issue #97：两站图片代理与 CORS 来源边界](issue-97/README.md)                       | bookmarks / middleware                          | 明确图片目标限制、资源预算和可信 Origin 合同。                            |
| [Issue #98：端到端错误、日志与链路追踪](issue-98/README.md)                         | server / web / gateway                          | 明确业务结果、错误恢复、协议转换和跨服务诊断合同。                        |
| [Issue #99：GraphQL 应用边界与同步数据库执行隔离](issue-99/README.md)               | bookmarks / collections / service-db            | 收回 transport 的数据库与适配器访问，统一有界 blocking 执行和事务所有权。 |
| [Issue #100：GraphQL 查询成本与稳定分页](issue-100/README.md)                       | bookmarks / collections / graphql-common / web  | 统一 SQL 筛选与稳定分页、批量关联读取及请求成本限制。                     |
| [Issue #101：层级写入与删除一致性](issue-101/README.md)                             | bookmarks / collections / database              | 明确父子关系事实源、有限层级遍历、路径更新与删除原子性。                  |
| [Issue #103：前端包与领域所有权](issue-103/README.md)                               | web workspace / portal / common / lint          | 明确共享能力与领域所有者、公开入口及可执行依赖边界。                      |
| [Issue #104：操作安全、可访问性与表单反馈](../../web/docs/dev/issue-104/README.md)  | web / portal / bookmarks / collections / common | 统一删除确认、交互语义、翻译与字段反馈。                                  |
| [Issue #105：前端配置、加载边界与构建检查](issue-105/README.md)                     | web / gateway / CI                              | 集中同源路径、按需加载与生产产物和生成漂移检查。                          |
| [Issue #107：crawler 所有权与确定性测试](../../server/docs/dev/issue-107/README.md) | novel_crawler / bookmarks                       | 使用同步借用读取已抓取章节，收敛公开接口并隔离公网测试。                  |
| [Issue #125：导航入口与页面操作栏统一](../../web/docs/dev/issue-125/README.md)      | web / portal / bookmarks / collections / ui     | 合并导航入口和页面操作，统一高度、表单及回退组合约定。                    |
