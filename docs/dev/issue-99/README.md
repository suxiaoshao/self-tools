# Issue #99：GraphQL 应用边界与同步数据库执行隔离

状态：**Done**。两服务的应用边界、同步数据库执行隔离及必要验证已完成。
对应 [Issue #99](https://github.com/suxiaoshao/self-tools/issues/99)，代码证据基线为 `1e83d6c`。

## 目标与范围

让 bookmarks、collections 的 GraphQL 层通过 application 用例访问业务能力，将连接池、Diesel 和具体外部适配器收回各自所有者。同步数据库操作统一进入有并发上限的 blocking 执行入口，连接和事务不跨外部异步等待持有。

本计划涉及两个服务、共享数据库执行机制、service-query / graphql-common 的受影响导出，以及对应 manifest、生成路径、构建触发配置和后端说明。GraphQL schema、HTTP 认证协议、错误结果和数据库 schema 保持现有契约；延续 [#98 的错误与追踪设计](../issue-98/README.md)。请求成本、N+1 与分页产品策略归 #100，新增 FK / 层级约束归 #101，爬虫站点实现和解析器重构归 #107。当前分支上的 Actions 修复是独立修改，不计为本计划的实施进度。

## 设计依据

基线中的 GraphQL 连接辅助函数、异步 Runner 内的同步 SQL，以及 bookmarks 嵌套字段对 model/crawler
的直接调用需要收回所有者。既有事务、目录路径、关联、阅读记录和错误规则作为保留基线。

继续使用同步 Diesel 与现有 SQL，通过 `spawn_blocking` 隔离执行；采用 [auth 现有的许可与连接生命周期模式](../../../server/packages/auth/src/application.rs)。本轮不引入 diesel-async，避免同时改动查询、连接池和事务 API。新共享机制仅服务两个 GraphQL 服务，auth 自身的认证实现保持现状。

## 所有权与依赖方向

```text
main / bootstrap                 创建配置、数据库执行器和外部适配器，组装服务
  ├─ router                      HTTP 来源/Cookie 校验、认证、健康路由
  └─ graphql → application       输入输出转换 → 查询/写入/抓取用例
                 ├─ repository  同步 Diesel、ORM record、SQL 与 schema
                 └─ crawler     bookmarks 的外部抓取适配器
```

两个服务以 `application.rs` 与 `application/` 为应用所有者；repository 和 bookmarks crawler 位于其私有子模块。现有 service 中的业务规则进入 application，model 中的持久化实现进入 repository，旧目录随消费者迁移删除。Repository 默认使用 `pub(super)` 或更窄可见性，GraphQL 不能直接访问连接、ORM record、SQL helper 或 crawler 实现。遵循同名文件与目录结构，不新增 `mod.rs`。

application 对 crate 内消费者只暴露用例、输入/结果类型和就绪能力。按 author、novel、collection、item 等业务职责组织内部模块，跨表写入由一个用例负责；例如删除作者统一协调小说、章节和关系记录，草稿保存统一协调作者、标签和小说。相关模块可以调用同一用例所需的多个 repository 操作，提取共同内部操作后消除 service-to-service 转调。

数据库 repository 使用具体实现和真实数据库回归，不为每张表建立通用 CRUD trait。爬虫适配器提供 application 所需的可替换接口，测试注入固定数据；接口和 DTO 归 application，具体站点类型与转换留在适配器。普通私有函数和文件拆分由实现者按职责决定。

### Application 与 transport 的合同

- GraphQL 长期共享业务依赖只有 `Arc<Application>`；请求级认证标记、correlation 和 OperationState 继续保留。context 不放 pool、连接、repository、具体 RPC/crawler client。
- 用例接收拥有所有权的普通 Rust 输入，返回现有 `AppResult<T>` 语义的 DTO；接口不带 `Context`、GraphQL 包装类型、`PgConnection`、池或 ORM record。GraphQL DateTime/enum 与领域时间/enum 的转换由 transport 完成，领域 enum 与 PostgreSQL enum 的转换由 repository 完成。
- 列表用例一次返回数据与总数；详情缺失返回 `Option`，嵌套关联保留当前 nullable 行为。字段路径、校验顺序、分页边界、集合优先的混合列表顺序和错误分支沿用现有合同。
- GraphQL 的错误 helper 只投影已完成的 `AppResult`，不获取连接或接收带连接的闭包。业务拒绝先在事务内部作为 `Err` 回滚，再转换为 typed result；故障保留 #98 的安全错误和追踪关联。
- 启动入口创建并注入认证适配器和来源配置。HTTP handler 保持“来源/Cookie 校验 → 认证 RPC → GraphQL”的顺序；生成的 Thrift 类型与 client 获取留在适配器，不进入 application 业务 DTO。认证适配器向 HTTP 层返回已有安全 PublicError，保留远端拒绝、远端故障与本地故障的映射。
- 认证适配器持有服务地址配置与 client 构造能力，不将启动时的 DNS 结果永久固定。请求中使用有时限的异步地址解析与现有 `thrift::client_at`、认证 RPC 超时及禁止重放规则；沿用 service-health 的 AUTH_DNS 预算。该适配不改变 login/auth 的公共接口，也不占用数据库执行许可。

## 数据库执行合同

新增 `server/common/service-db`，由 bookmarks、collections 共同消费，依赖现有 Diesel、Tokio、tracing 和 service-errors。它只负责连接池与 blocking 生命周期，不持有业务事务策略、GraphQL 类型或站点逻辑。

共享 crate 的实际接口：

```rust
pub type PgPool = diesel::r2d2::Pool<
    diesel::r2d2::ConnectionManager<diesel::PgConnection>,
>;

#[derive(Clone)]
pub struct Database { /* 共享同一个池和许可集合；字段私有 */ }

impl Database {
    pub fn new(pool: PgPool) -> Self;

    pub async fn run<T, E, F>(
        &self,
        operation: &'static str,
        work: F,
    ) -> Result<T, E>
    where
        T: Send + 'static,
        E: From<service_errors::Fault> + Send + 'static,
        F: FnOnce(&mut diesel::PgConnection) -> Result<T, E> + Send + 'static;
}
```

`Database` 只能作为 application 的私有资源使用；上面的通用闭包接口不再由 Application 向 transport 转发。每个池只建立一个执行器，再通过 Clone 共享。并发许可数取池的最大连接数，显式保留两个服务当前容量 10 和 5 秒 checkout 超时，不新增调优环境变量。

执行顺序与失败语义固定如下：

1. 在 async 路径等待 owned permit；获准后才提交 blocking 任务，避免每个请求先占一个线程等待连接。
2. 将 permit 和当前 tracing span 移入闭包，闭包内 checkout、执行同步工作、释放连接，任务实际结束时释放许可。DTO 全部拥有其数据，不返回连接引用。
3. Application 在这个闭包中调用 repository。需要原子性的写入用例在同一个连接、同一个事务中完成；读取不强制包成写事务，列表内部的 count/page 同属一次执行任务。保留现有事务隔离、锁与拒绝回滚语义。
4. Pool 和任务调度/Join 错误分别映射已有 `FaultKind::Pool` / `Task`，SQL 错误与业务拒绝保留原类型，沿用现有公开错误映射。`operation` 是静态操作名，不带输入、SQL 或凭据。
5. 请求取消会停止等待；已提交的 blocking 任务仍可能运行，已开始的工作继续到自然结束，仍占有许可。不能把取消或等待超时解释成数据库已回滚，不能自动重试 mutation。排队与运行任务的许可释放均由 RAII 保证。

只限制同时占用 blocking 执行资源的数据库任务；本轮不新增全局请求队列、SQL 超时策略或写入取消协议。[Tokio 的 blocking 任务语义](https://docs.rs/tokio/1.52.3/tokio/task/fn.spawn_blocking.html) 是上述取消边界的依据。

### 启动与就绪

启动入口建立 pool，完成现有 migration 版本检查，再构造 application 并监听端口；连接串和配置读取不散入 resolver。`--export-schema` 仍无须数据库、认证或外部站点，`--migrate` 继续使用原显式入口。

两服务的运行期数据库健康检查也通过同一个 Database 执行器调用 `service_health::database::check`，不再直接调用另起 blocking 任务的 `database::ready(pool, ...)`。保留 DATABASE 外层预算与 schema check 的 2 秒 statement timeout，排队耗时计入该预算；超时返回未就绪，后台任务仍按上述规则释放资源。认证就绪与数据库就绪继续并行检查，router 只消费 application 的就绪结果。auth 等既有 `database::ready` 消费者不迁移。

## 查询、爬虫与旧公开面收口

| 入口                                                       | 目标处理                                                                                                                  |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| collections 顶层查询、mutation 和嵌套 collection/item 字段 | 全部调用 application；目录、成员关系与路径维护归原子用例                                                                  |
| collections 混合列表与两服务分页 Runner                    | count、筛选、分页组合移入同步查询用例，返回数据和总数；保留现有 SQL 和结果顺序                                            |
| bookmarks 作者、小说、章节、评论、统计与关联字段           | 补齐 application 读用例，移除 GraphQL 到 model 的访问                                                                     |
| bookmarks 抓取草稿和嵌套抓取字段                           | 返回 application 草稿 DTO，包含已取得的元数据与来源标识，由对应字段按需调用 application；不提前抓取未请求的章节/作者/正文 |
| bookmarks 作者/小说刷新、保存草稿                          | 外部数据先转换成 application 快照，再由 repository 接收领域输入；移除 ORM 对 crawler trait 的比较和转换                   |

刷新流程为“blocking 读取来源标识 → 释放连接和许可 → 异步抓取/校验 → blocking 事务内重新读取当前记录并写入”。保留现有抓取身份校验、空列表保护、章节同步和关系清理规则。网络失败不进入写事务，写入失败不提交部分数据。Crawler trait/具体类型不穿过 application 接口；URL 等站点派生信息也由 application/adapter 提供给 GraphQL。

删除仅服务上述 Runner 的 `Queryable`、`QueryStack` 及 graphql-common re-export。`service-query` 保留确有消费者的 `PageRange`、`TagFilter` 和同步分页能力；transport 必须先转换为已检查的 PageRange。GraphQL schema 类型和现有宏按真实消费者保留，不以缩小 public surface 为由改变 wire contract。相同 HTTP/GraphQL 投影继续由已有公共模块承载，两个应用的业务 facade 不合并。

## 实施顺序

| 工作包                   | 所有者与改动                                                                                    | 完成条件                                                                                    |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| W1：collections 完整链路 | service-db 与 manifest；collections bootstrap/application/repository/graphql/router；认证适配器 | 顶层、嵌套字段和健康检查均经新入口；无 transport 取连接；事务、分页、SDL 和资源边界回归通过 |
| W2：bookmarks 完整链路   | 复用执行器，迁移全部读写、嵌套字段、草稿和爬虫刷新；收回 crawler/ORM 类型                       | 无 GraphQL 直接访问 model/crawler；网络等待不占连接；原子写入与错误合同回归通过             |
| W3：共享与文档收口       | 删除旧 service/model/Runner 和无消费者导出；同步 schema 路径、生成配置、CI 触发与 README        | 两条链路消费者统一，无旧兼容入口；受影响构建和契约验证通过                                  |

W1 的共享 crate 随 collections 消费一起落地，不单独提交空实现；W2 完成后再删除仍被 bookmarks 使用的旧查询抽象。每个工作包包含自身必要的配置和消费者更新，W3 负责最终清理，不推迟会导致前序工作不可构建的修改。

必须同步的入口：

- 根 Cargo.toml / Cargo.lock 和两个 package manifest 注册 service-db、移除退出的依赖；共享 crate 不依赖业务服务或 transport。
- 两服务 `diesel.toml` 跟随 schema 移到 `src/application/repository/schema.rs`；bookmarks 的原始输出为该目录下 `schema/pre_schema.rs`，保留原始生成与手工 custom_type 合并的既有边界。仅移动现有生成文件，不改表结构；若修改生成输入，使用现有 Diesel 生成流程更新。
- bookmarks/collections 工作流包含新增 `server/common/service-db/**` 的路径触发；对本轮移动或修改的现有共享依赖核对对应消费者触发。根 `.dockerignore` 已包含 `server/**/src/**` 和 manifest，沿用 Bake/xtask 构建入口，不新增部署服务或变量。
- 更新 server/README.md 的实际目录、pool/context、生成路径和验证入口；必要时同步受影响公共 crate 的说明。稳定架构在实现后写回所有者 README，不把本计划长期作为第二套运行规范。

## 最小充分验证

实现时以受影响包构建、Clippy、既有契约与事务回归为基础，补下列边界证据：

| 关键行为               | 验证方式                                                                                                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 执行线程与并发生命周期 | 通过同步屏障控制测试工作，证明数据库等待不阻塞 async runtime、并发不超过许可数；取消等待或任务失败后许可最终归还，已开始工作不被当作回滚                                     |
| 连接不跨外部 await     | 固定 crawler 适配器暂停网络阶段，用容量为 1 的测试池证明另一数据库操作可继续；恢复后验证事务成功/失败分支                                                                    |
| 原子性与业务结果       | 迁移并复用两服务 `*_transactions_and_typed_results`，保留目录路径、关联拒绝、草稿冲突和阅读记录无部分写入覆盖；至少有代表性 GraphQL mutation 走新 facade，而非只测旧同步函数 |
| 查询与 transport 兼容  | 现有 SDL 快照与错误安全测试；覆盖 collections 混合列表跨集合/条目边界和一个 bookmarks 嵌套关联；固定抓取数据验证字段按需调用                                                 |
| 初始化与就绪           | 导出 schema 不连接外部资源；专用数据库下验证启动、schema 不匹配拒绝和经新入口的 readiness；认证适配器保留先认证后执行及故障投影                                              |

复用现有 `COLLECTIONS_TEST_PG` / `BOOKMARKS_TEST_PG` 专用测试库要求，这些测试会清表，不能使用个人业务库。新增测试的名称和入口随实现注册，不预先写成已存在命令。

使用受影响包的 `cargo check`、`cargo clippy -p <package>` 与 `cargo test -p <package>`，按实际包/feature 范围执行；数据库测试显式带 `--ignored` 并提供专用库。两服务已有 `--export-schema` 与快照断言用于确认契约不变；若输出出现语义差异，先修正重构，不直接更新快照接受变化。只有生成输入实际变化时，才执行 server/README.md 指定的导出和客户端 generate 流程。

每条完整链路通过基础检查与直接相关回归后可交付试用。本计划不要求公网爬虫测试、全站浏览器验收、全量 CI 预跑或生产部署；构建配置变化执行对应解析与输入核对，实际镜像运行按本轮必要验证或用户明确要求执行。用户本轮要求重新构建运行，并在应用内浏览器使用 `sushao.top` 验证，作为本次交付范围。

## 实现与验证记录

- W1/W2 已迁移：两服务的 application facade、私有 repository 与 service-db；bookmarks 使用领域快照和可注入 crawler，删除 GraphQL 直连数据库和具体抓取类型。
- W3 已删除 Runner、Queryable、QueryStack 和 Pagination 的未检查分页实现；同步 Diesel 输出路径、manifest、CI 触发与所有者 README。
- 认证适配器由共享 `thrift::AuthEndpoint` 实现，application 持有它；HTTP 消费安全认证结果。作者快照通过 `AuthorFn::novel_ids` 取得既有解析结果，小说快照转换当前已加载的章节，保持外部请求时机。
- 基础测试和两服务专用数据库回归通过；SDL 与客户端快照一致。固定 crawler 覆盖容量 1、抓取暂停、按需字段、身份错误、空列表、数据库失败回滚和阅读状态保留。
- `cargo check` 覆盖五个后端服务；受影响应用与共享包 Clippy 通过。auth 扩展检查仍提示既有测试代码的转换与锁作用域警告，真实认证 RPC/SDK 回归通过。
- 以 `cargo run -p xtask -- build --tag latest` 完成本机 Linux ARM64 五个镜像构建；bookmarks/collections 切换到新镜像，其余三个产物与原镜像一致。五个容器就绪探测通过，PostgreSQL 容器、镜像及挂载未变化。
- 在应用内浏览器 `https://sushao.top` 验证集合创建、条目创建/编辑、列表与详情回读、集合关联；bookmarks 标签创建与末页回读、小说详情的作者/章节/标签/集合/阅读状态均正常。匿名 GraphQL POST 返回 401，页面无框架错误遮罩。
- 浏览器仍有独立的 Base UI 警告：主题/语言 DialogTrigger 按钮语义（更新前已出现），以及标签表单 Select 从 uncontrolled 切换为 controlled。本轮未修改这些前端组件；本次验收不包含完整响应式布局或公网爬虫验收。
