# Issue #100：GraphQL 查询成本与稳定分页

状态：**Done**。SQL 查询、关联批量读取与成本校验已实现，必要回归通过。
对应 [Issue #100](https://github.com/suxiaoshao/self-tools/issues/100)，代码基线 `a764175`。

## 目标与范围

在 #99 建立的 application / repository / service-db 边界内，将小说与条目查询的筛选、计数、分页放入 SQL；为分页确定稳定顺序，将嵌套字段的逐对象 SQL 改为批量查询，并在 resolver 执行前限制过深、过宽和昂贵的 GraphQL 组合。前端只删除确认未消费的字段，保持当前列表、详情、编辑和抓取流程。

保留页码分页、GraphQL SDL、现有 nullable/typed-result、HTTP 认证与错误契约。当前每个 POST 已只调用一次认证 RPC，字段 guard 只读 Auth；本轮为它补计数回归，不重写认证客户端或 DNS。#101 的写入不变量、#103 的前端包边界、#105 的构建/CI 体系、#107 的 crawler API 与公网测试隔离不并入本计划。

这里限制查询形状、分页返回行数及关联查询次数，不宣称建立与业务数据量无关的全局 CPU、响应字节或公网抓取上限。已有 `allCollections`、`allTags`、`allAuthors`、完整章节与抓取草稿仍完整返回；不静默截断，也不为本轮另造游标或选择器产品流程。它们通过加权复杂度限制组合放大，单字段返回量仍随实际数据增长。

## 实现入口

| 入口                                                                                                                                                                                          | 当前行为                                                                  |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| [bookmarks Application::query_novels](../../../server/packages/bookmarks/src/application.rs)、[collections Application::query_items](../../../server/packages/collections/src/application.rs) | SQL 完成筛选、计数和分页；单次调用使用只读快照。                          |
| 两服务 `application/repository/query.rs`                                                                                                                                                      | 递归 CTE 读取所选集合子树，按根计数计算 any/all，空交集不会被后续根恢复。 |
| 两服务 `application/repository/{author,tag,collection,item}.rs` 中实际分页入口                                                                                                                | 按唯一 id 排序；混合列表保持集合优先，两类分别稳定排序。                  |
| [bookmarks objects](../../../server/packages/bookmarks/src/graphql/objects.rs)、[collections output](../../../server/packages/collections/src/graphql/types/output.rs)                        | 关联字段通过请求级 loader 调用 application 批量读取。                     |
| 两服务 `src/graphql.rs` 与 `graphql-common::cost`                                                                                                                                             | resolver 执行前校验深度、复杂度、字段出现数和根字段数。                   |
| [Item 列表](../../../web/packages/collections/src/features/Item/List/index.tsx)                                                                                                               | 列表不再选择正文；编辑入口继续通过独立 getEditItem 读取。                 |
| bookmarks Novel 列表/详情、Author 列表                                                                                                                                                        | 已删除重复 description 和未消费的 url；重复字段精简不计为响应字节优化。   |

只读扫描两个前端包中 52 个手写 operation（排除生成物及测试）得到最大字段深度 4、最大字段出现数 42。以所有列表统一乘 100 的保守静态估算，fetchAuthor 约 100,909、getNovel 约 1,527；这是阈值设计依据，不是 async-graphql 实测成本或性能基准。实施时用真实 schema validation 固化兼容回归。

## 查询与分页合同

### 保留 wire contract，明确排序

沿用 `Pagination { page, pageSize }` 与 `{ data, total }`，page 从 1 开始，pageSize 继续为 5..=100，由 service-query::PageRange 校验算术范围。无新增 sort、cursor、hasNextPage 或环境配置。

| 查询                                                             | 排序与范围                                                                                             |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| queryNovels、queryItems、queryAuthors、queryTags、getCollections | 按对应实体 `id ASC`，再 SQL OFFSET/LIMIT。                                                             |
| collectionAndItem                                                | 保持集合优先、条目在后；两类各自 `id ASC`。无父集合时仍只列根集合；时间过滤与 total 范围沿用现有入口。 |
| chapters / firstChapter / lastChapter                            | 维持 time 主排序，补 id 为唯一次排序；首章 `(time ASC, id ASC)`，末章 `(time DESC, id DESC)`。         |
| 其他批量关联列表                                                 | 无既有业务顺序时 `id ASC`；ancestors 仍从根到直接父级，不按 id 重新排列。                              |

稳定排序保证同一数据快照下顺序确定，不承诺并发新增/删除期间跨多个页请求仍是同一快照。单次分页用例的验证、count、page 使用同一连接内的只读 REPEATABLE READ 事务，使 total 与 data 一致；不取得写表锁，不跨 await 持有连接。越过末页返回空 data 和实际 total，空库 total 为 0。

### 把筛选留在数据库

bookmarks 与 collections 的查询 SQL 分别由各自私有 repository 拥有，不建立跨服务通用业务查询 DSL。优先 Diesel；复杂递归查询可用带绑定参数的 SQL，禁止把输入或 ID 拼接进 SQL 字符串。

- 标签 any/all 分别使用 PostgreSQL 数组重叠/包含语义；状态条件与标签条件、集合条件取 AND。保持现有输入验证、空筛选与未知 ID 的错误投影。
- 集合筛选先以选中的根 ID 构造递归 CTE `(root_id, collection_id)`，包含根本身及所有后代；使用去重 UNION，避免重复路径或脏环造成无限展开。它只读取所需子树，不把整张层级/关系表送回 Rust。
- any：实体关联到任一选中根的子树即可；all：实体必须分别关联到每个选中根的子树。以 `COUNT(DISTINCT root_id) = 去重后的选中根数` 或等价 NOT EXISTS 表达，重叠子树与重复关联不放大结果。
- 子树根不存在继续按已有 missing resources 拒绝；批量验证，不能按输入 ID 数量逐个发 SQL。full_match 中途空交集不得被后面的根恢复，这是本轮查询正确性修复。
- count 与 page 复用同一过滤定义。page SQL 限制返回实体行数；删除旧内存分页、全表映射及退出的递归 helper，保留仍有真实消费者的函数。

混合列表保留现有“两类计数 + 有界读取”的方式，最多读取一页集合与条目的总量；无需为了合并查询而引入新的公共 union 或 schema。已有主键支持 id 排序；本轮不预设索引迁移。只在代表性查询计划证明确有必要时，再将具体索引及数据/回滚影响补入本计划。

## 批量关联与所有权

依赖方向仍为 `graphql -> application -> private repository -> service-db`。GraphQL 的 request loader 只持有 `Arc<Application>`，调用拥有输入/输出的批量用例，不能持有连接池、ORM record、SQL 或 crawler。

采用当前 async-graphql 7.2.1 的 DataLoader，在两个服务 manifest 启用 `dataloader` feature，不升级版本或新增独立 loader 库。每个请求独立创建 loader 集合；查询请求内使用 HashMapCache，mutation 请求禁用缓存；请求之间不共享。列表生产者按 lookahead 为实际选中的关联一次提交整页键，再由字段读取缓存。只依赖默认 1ms 窗口在实测中会将同一页拆批，因此不能据此承诺固定 SQL 预算。缓存保留缺失值和安全字段错误，预取失败不会将根字段变为失败，也不会触发第二次数据库读取。

不把每个业务实体变成通用 CRUD trait。目标批量用例接收去重 ID 集合，返回按 ID 索引的领域 DTO（值可用 Arc 避免复制大章节/正文）。repository 一次查一组键，禁止批量函数内部循环调用单键 SQL。

| 所有者                  | 批量读取组与消费者                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| bookmarks application   | 作者/小说按 ID：Novel.author、Chapter.author/novel、详情及同请求重复查询。                                                      |
| bookmarks application   | 小说的 tags、collections、comments；author -> novels；collection -> children。按关联键 JOIN 或数组绑定读取并分组。              |
| bookmarks application   | chapters 按 novel ID 批量读取，阅读状态在 SQL 中关联；首末章和 wordCount/readPercentage 按组选取/聚合，不能载入全部章节后统计。 |
| 两服务 application      | ancestors 使用携带起始 ID 与访问路径的递归查询，按起始 ID 分组；有环的键返回原安全故障，其他键保留结果。                        |
| collections application | item -> collections 批量 JOIN，服务 queryItems 与详情嵌套字段。                                                                 |

统计共享一个按小说 ID 的读取组，避免 wordCount/readPercentage 重复扫描。first/last 合并读取首末记录，只有实际选择对应字段才调度该组；单独查询小说基础信息不预取作者、章节、统计或公网数据。Crawler 草稿维持 #99 的按需行为，不放进 SQL DataLoader。

单对象缺失保留 `None`，关联空列表保留 `Some([])`；不因一个缺失键让整批结果失败。SQL 故障影响该批所消费的关联字段，仍沿 #98 的 code/requestId 与 GraphQL path 投影，不把所有关联捆为一个会整体失效的 detail 巨型 DTO。DataLoader 的私有适配层先把应用错误安全投影为可 Clone 的 GraphQL Error（内部 cause 仍由 Arc 承载），再以每键 Result 缓存；不将 cause/debug 字符串返回浏览器。

DataLoader 的 `max_batch_size` 是触发调度的阈值，不能当作 SQL 键数量的硬上限。单个批次在 application/repository 中按最多 500 个唯一键分块；同组各块使用同一 blocking 用例依次读取并合并。小于等于 100 个父对象的代表性页面应在一个块内完成；不为每个键提交独立 blocking 任务。已有 service-db 的许可、取消与 tracing 语义继续适用。

## GraphQL 成本与拒绝合同

复用当前框架的 [深度/复杂度校验](https://async-graphql.github.io/async-graphql/en/depth_and_complexity.html) 与 [DataLoader](https://async-graphql.github.io/async-graphql/en/dataloader.html)。已核对本地锁定版本的 schema.rs：限制进入 validation 扩展链；现有 middleware::Logger 将校验故障安全投影为 INVALID_REQUEST。无需匹配框架错误文本。

两个服务使用同一组显式常量，放入 graphql-common；业务字段权重仍由对应 GraphQL 所有者定义。初始设计值为：

| 预算               | 目标值与计算方式                                                                                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 字段深度           | 业务根字段子树为 8；query 根的 `__schema` / `__type` 子树为 16，以容纳标准 introspection 的 `ofType` 链。请求扩展逐子树检查，框架 limit_depth 保留 16 的全局上限；fragment 不增加深度。 |
| 加权复杂度         | 200,000；标量为 1，普通对象为 `1 + child_complexity`；分页 root 为 `1 + pageSize * child_complexity`，其 data 包装不再重复乘。                                                          |
| 现有无分页列表     | `1 + 100 * child_complexity`；100 是组合成本权重，不是返回条数上限。抓取入口额外加 1,000，防止大量低选择成本的公网请求组合。                                                            |
| 展开后的字段出现数 | 256；根字段最多 20。alias、重复 fragment 引用按出现次数计数，使用饱和计算及提前拒绝，不能先构造指数大小的展开结果。                                                                     |

非分页 list 的权重也应用于草稿 novels/chapters/tags，防止将抓取字段绕过组合预算。分页参数非法时成本计算使用安全取值，不允许负数转换为 usize 或乘法溢出；正式参数错误仍走既有 INVALID_REQUEST。mutation 输入数组是写入合同，保持已有验证，不把读取优化扩大为新的批量写入限制。

字段出现数/root 数限制作为 graphql-common 的独立 request extension，接入两服务实际 schema。复用解析后的文档、选定 operation、fragment 和变量；对 skip/include 采取保守计数，不允许用指令构造检查与执行不一致的绕过。解析后先进行有 visited-path 和提前退出的保守计数，再进入框架语义/复杂度校验，防止框架展开重复 fragment 前已经消耗过多资源；引用环或未知 operation 统一安全拒绝。使用 Request 的 parsed document 缓存，不为一次请求重复解析文本。schema 导出入口不连接数据库，也不因运行期策略改变 SDL。

Introspection 只依据实际 query 根字段名识别，不依据 operation 名、别名或 fragment 名；业务与 introspection 混合时各自执行深度策略，仍共享字段数、根字段数和复杂度预算，不存在整条操作免检。两个生产 schema 必须能实际返回标准 introspection 结果，并覆盖更名、别名/fragment 及混合查询不能放宽业务限制的回归。

执行顺序仍是 HTTP 来源/Cookie 校验 -> 一次 auth.Check -> GraphQL 验证 -> resolver。超预算时 auth.Check 可以已经发生，业务 SQL、mutation 和 crawler 调用数必须为 0。返回 HTTP 200 的 GraphQL `errors`，`data: null`，安全 `message/code = INVALID_REQUEST` 与 requestId；不伪装成 429、INTERNAL 或自动重试。custom-graphql 已有的错误展示与输入保留继续生效，不新增 i18n key 或前端错误码。

初始阈值必须通过全部现有手写 operation 的实际 schema 验证，包含 pageSize=100、抓取作者带 novels/chapters 和现有 mutation。允许依据实际计算修正权重实现，不得通过免检 operation 名、跳过 mutation 或放开限制来绕过回归。阈值为本轮明确设计值，不是已完成的压测结论。

## 前端与生成链路

只修改实际未消费的选择，不改变 Apollo 状态所有者、no-cache、refetch、认证代次或编辑草稿生命周期。

Item 列表的目标手写 operation：

```graphql
query getItems($collectionMatch: TagMatch, $pagination: Pagination!) {
  queryItems(collectionMatch: $collectionMatch, pagination: $pagination) {
    data {
      id
      name
      createTime
      updateTime
    }
    total
  }
}
```

删除 bookmarks 小说列表/详情重复 description 与作者列表未用 url；其余字段必须沿表格、详情、选择器、草稿保存或 reconcile 的真实消费者确认，不能仅凭“当前页面没显示”删除。抓取结果中保存草稿所需字段保持完整。

先修改手写 operation，再运行两个现有 `pnpm --filter bookmarks generate` / `pnpm --filter collections generate`。预计 SDL 无差异，用两服务已有 --export-schema/快照回归确认；不手改 src/gql。只有实现确需公共 schema 变化时，先回到本计划明确新契约，再同步 schema 快照和消费者，不在重构中顺带变更。

响应预算采用确定性 fixture 验证：20 条 Item 每条含 64 KiB 正文时，上述列表响应仍小于 16 KiB，且不包含 content；独立 getEditItem 继续读到完整正文。该数值验证本 operation 的投影，不冒充通用响应大小限制。

## 实施顺序与充分验证

| 工作包         | 修改与完成证据                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| W1：SQL 分页   | 迁移 queryNovels/queryItems，修正 all 交集，统一稳定排序与只读快照；在两服务专用库验证筛选、总数、越界页、混合边界。                 |
| W2：关联批量   | application 批量用例 + repository 查询 + request DataLoader，一组消费者迁移后移除旧单键重复入口；验证关联空值、按需读取与 SQL 计数。 |
| W3：成本校验   | 共享预算、字段权重与计数扩展；现有 operation 通过，超深/超宽/重复 fragment/高乘数被拒绝，业务执行数为 0，RPC 次数符合入口合同。      |
| W4：消费者收口 | 精简 operation、运行 codegen，更新受影响 README、必要 manifest/共享依赖工作流触发，完成列表/编辑投影关键回归。                       |

必要回归覆盖以下不变量，复用既有测试入口，不另建全仓库测试体系：

- 分页在相同时间戳、大于两页的数据、首末页与超末页上稳定；混合页跨集合/条目边界不重复漏项；同一调用的 count/page 不被并发提交拆成两个快照。
- 标签 any/all、集合及后代、重叠子树、重复 ID、缺失根，以及三个根中前两个交集为空的情况；递归读取遇到脏环能终止，不修改业务数据。
- 1、20、100 个父对象下，单个关联读取组 SQL 次数不随父对象逐个增长；超过 500 个键时按块数增长。未选择的关联不执行；批量故障、缺失和独立请求/顺序 mutation 不产生缓存污染。
- SQL 计数使用专用测试连接的 Diesel instrumentation，计实际 SELECT/CTE 执行，不能只数 Application::run。仅保存计数，不记录 SQL/参数；事务 BEGIN/COMMIT、建库/迁移不计入业务查询预算。
- 简单无过滤小说/条目列表至多 2 次 SELECT（count + page）；带集合筛选的条目至多 3 次，小说同时含集合/标签验证至多 4 次；mixed 列表至多 5 次（父集合验证、两次计数、两段页读取）。代表性同层批量作者或 item.collections 增加至多 1 次 SELECT；更深字段按实际批次单独计数，不要求整个请求永远只有 2 次 SQL。
- 实际 HTTP 请求中，多 root/alias 成功操作只认证一次；入口拒绝时无 GraphQL 执行；预算拒绝时无业务 SQL/抓取/写入。沿用已有真实 auth RPC/SDK 测试，不另外造生产认证入口。
- 所有现有 operation 的 schema 校验、SDL 快照、错误安全、Item 正文按需读取及生成物类型检查。

实现阶段执行受影响服务/共享包的 cargo check、Clippy 与关键测试；数据库测试沿用 server/README.md 的 BOOKMARKS_TEST_PG / COLLECTIONS_TEST_PG 专用库约束。前端执行受影响测试、类型与格式检查。涉及 manifest feature 和公共 graphql-common 消费者时检查 Cargo.lock 及真实消费者构建；不预设依赖升级或复制全部 CI。

## 实现与验证记录

- W1/W2 已接入两服务：SQL 筛选/分页、只读快照、批量领域读取及请求级 DataLoader；已删除退出的内存分页、全表关系映射和单键关联入口。
- W3 已接入生产 schema：预算限制、字段权重、保守的 fragment 展开保护与安全错误。现有 52 个手写 operation 通过实际 schema 验证，SDL 快照保持一致。标准 introspection 已在两个生产 schema 实际执行通过，operation 更名、根字段别名及 fragment 包装保持兼容；混合查询、超限 introspection 和字段预算共享的回归通过，业务深度仍为 8。
- W4 已精简 Item 列表正文、重复 description 和未消费的 author URL，并通过两个现有 generate 入口更新生成物；未升级依赖版本，Cargo.lock 仅增加 DataLoader feature 所需的既有依赖边。
- 两服务专用库回归通过：any/all、重叠子树、空交集、稳定页序、超末页、脏环终止、500 键分块与批量空值；并发写入在 count/page 之间提交时，当前调用仍读到同一快照。已有事务、固定 crawler 与 readiness 回归也通过。
- 无筛选列表为 2 次业务 SQL；页面关联作者或集合后为 3 次，覆盖 5/20/100 条页面。20 条各含 64 KiB 正文的 Item 列表响应小于 16 KiB，独立正文读取保持完整。
- 真实 auth RPC/HTTP/SDK 回归覆盖多 root/alias 只认证一次、预算拒绝时零字段执行及追踪关联。受影响 Rust 基础测试与 Clippy 通过；前端 lint、类型检查和 37 个测试通过。
- 已通过现有 xtask 入口构建 latest 镜像，并更新本机 bookmarks / collections 容器；五个应用容器健康，PostgreSQL 容器、镜像和挂载保持不变。
- 应用内浏览器在 `https://sushao.top` 完成实际后端验收：条目列表、两个集合的 any/all 筛选、详情正文、编辑独立回填与取消；小说三页为 10/10/3 条，前两页无重复，返回首页顺序一致；作者列表/详情和小说的标签、集合、统计、首末章时间及 104 条章节正常显示。没有修改业务数据。
- 验收页面无空白或框架错误遮罩；控制台仅观察到验收前已有的主题/语言抽屉 Base UI `nativeButton` 警告。当前 674×908 视口下小说详情存在横向溢出，未作布局修改；未覆盖其他视口、浏览器、写入提交和公网 crawler 流程。
- 全量接口的返回量仍随数据增长；查询成本权重不构成全局内存或响应字节上限。浏览器验收不替代前述数据库 SQL 计数和成本拒绝回归。
