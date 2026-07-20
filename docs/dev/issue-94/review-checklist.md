# Issue #94：仓库代码 Review 清单

本文只记录可重复使用的审查范围、分类、检查标准和必需产物；具体 review 的状态与问题结论写入 `review-findings.md`，实施设计写入 `README.md`。

## Review 覆盖原则

- 本清单是最低必查范围，不是只能在清单内找问题的封闭列表。
- 总体架构必须作为独立审查对象，包括仓库/workspace、package/crate、应用、服务、数据所有权、依赖方向、跨层请求流和部署拓扑；不能只逐文件查局部代码问题。
- 当前目录、模块、README、公开接口和运行方式都只是待验证事实，不因为已经存在就视为合理设计。
- 即使暂时没有直接运行时 bug，也应记录会持续造成职责错位、重复实现、错误依赖、难以测试、难以修复漏洞或高变更成本的架构问题。
- 清单外问题只要有精确代码/配置证据、可说明的实际影响和足够置信度，也必须标记为 `Additional finding`，登记 owner、路径/调用链、证据、影响、验证方式和建议归类。
- 如果 `Additional finding` 暴露出可复用的缺失维度，应先记录问题，再讨论补回本清单并检查其他相似模块；不能只处理单个命中点。
- 纯风格偏好、没有消费者影响的猜测和无法验证的泛化建议不作为 finding。
- 记录清单外问题不等于授权立即修改；所有整改仍需经过问题确认、计划编写以及必要的新 Issue/分支拆分。

## 1. 仓库与 workspace 级架构

- 前端、后端、数据库、部署和根工具链的所有权边界。
- package、crate、应用、服务和共享模块的拆分是否合理。
- 依赖方向、同层调用、public surface 和例外是否符合第 4 节的统一规则。
- 公共模块是否真的有多个稳定消费者。
- 重复代码是应当共享，还是代表领域边界没有划清。
- 当前总体架构是否支持清晰的数据所有权、依赖拓扑、独立测试、局部变更和故障隔离，而不是只在目录名称上看起来分层。
- 多个局部问题是否来自同一个架构根因，是否应作为整体设计问题记录，而不是拆成互不相关的小问题。
- 新开发者能否从目录、入口和公开接口快速定位修改位置。
- 修复漏洞时能否确定生产者、消费者、测试和部署影响。

## 2. 每个前端应用或 package 的通用审查模板

重点不是强迫所有应用拥有完全相同的文件夹，而是确定一套“必需职责、可选职责和依赖规则”。

### 2.1 目录与模块

逐个检查：

- 应用入口、Provider、路由和组合根放在哪里。
- feature/domain、页面、业务组件、通用组件、UI primitive 如何区分。
- hooks、API/service、state、schema/types、utils、i18n、styles、tests 的所有权。
- package、feature 和 shared/common 的调用与 public API 是否符合第 4 节，是否存在深层导入、反向依赖或同层互调。
- 是否存在同名目录承担不同职责，或者同一职责散落多处。
- 是否容易为一个新功能找到固定落点。

### 2.2 组件划分

- 组件是否职责清晰，页面编排、数据容器、业务组件和纯展示组件是否被不恰当地混在一起。
- 通用 UI 是否混入具体业务规则。
- props、context、store 和 hooks 的边界是否清晰。
- 状态是否放在离消费者最近且仍保持单一权威的位置。
- effect 是否承担了本应属于请求层、状态层或路由层的工作。
- loading、empty、error、disabled、权限和恢复状态是否完整。
- 组件是否容易独立测试、复用和替换。
- 可访问性、键盘、焦点和响应式行为是否由正确层负责。
- 仓库是否重复维护 shadcn/ui 已有能力；比较功能、API、可访问性、本地定制、依赖和升级成本后，再决定复用、保留或迁移。
- 同一种 UI primitive 是否在多个 feature/package 内存在不同实现，是否应收敛到明确 owner。

### 2.3 前端请求与数据流

- 请求由页面、组件、hook、store 还是 service 发起，职责是否统一。
- 请求类型、运行时校验、认证信息和错误转换在哪里处理。
- Apollo cache、Zustand、组件 state 和浏览器持久化是否保存了重复权威数据。
- query、mutation、refetch、invalidation 和 optimistic update 是否一致。
- loading、error 和 data 是否可能出现互相矛盾的组合。
- 组件卸载、参数变化或后一次请求到达时，迟到的数据或错误是否可能覆盖或干扰新状态。
- 分页、缓存、重复请求、批量请求和预取是否合理。
- token、主题、语言及其他持久化状态的账户、刷新和清理规则。
- UI 到 HTTP/GraphQL、store/cache 和重新渲染的完整链路按第 8 节追踪。
- GraphQL query、mutation 和 fragment 是否只选择当前 UI、cache update 或后续流程实际需要的字段；列表、分页和嵌套关系是否因复制、历史遗留或“以后可能使用”而 overfetch 大字段或深层对象。
- mutation 返回字段是否与界面反馈、cache update、refetch 或后续流程有明确关系。

### 2.4 请求失败、操作反馈和用户恢复

- 网络错误、超时、请求取消、HTTP 错误和 GraphQL error 是否会到达明确的用户反馈路径。
- 表单提交、mutation、删除、上传、认证及其他用户操作失败时，是否通过职责明确的 inline error、字段错误、toast 或页面 error state 提供可见提示和可执行的恢复步骤。
- 是否存在 catch 后忽略、只写 console、返回空数据或重置状态造成的静默失败。
- optimistic update 或本地先行状态在请求失败时是否正确回滚并通知用户。
- 重试是否避免重复提交、重复 toast 或丢失原始错误。
- 页面切换或组件卸载后的迟到错误按 2.3 检查；错误反馈的可访问性、i18n 和安全 message 分别按 2.5、6.3、9.4 检查。

### 2.5 i18n 完整性

- 页面、菜单、按钮、表单、dialog、toast、loading、empty、error、确认提示、placeholder、validation message、tooltip、title、aria label 等用户可见或可访问性文本是否全部纳入 i18n。
- 网络错误、请求错误和业务失败是否映射为可翻译的稳定错误身份，而不是直接展示服务端原始 message。
- 所有受支持 locale 是否包含相同语义的 key，是否存在缺失、废弃或只在单一语言中使用的 key。
- interpolation、plural/select、日期、数字和时间格式是否由 locale 层统一处理，动态拼接是否破坏语序、变量或复数规则。
- fallback 行为是否明确，缺少 key 时是否会把内部 key 或错误文本暴露给用户。

### 2.6 条件分支与 ts-pattern

- discriminated union、状态机、variant、错误类型和多条件组合是否仍使用难穷尽的 `switch`、复杂三元或连续 `if/else`。
- 相同领域是否一致使用可穷尽匹配，新增 union member 时能否在类型检查阶段暴露遗漏。
- 是否只在能提高穷尽性和可读性时使用 ts-pattern，而不机械替换简单布尔判断或清晰的单层条件。

## 3. 每个后端应用或 service 的通用审查模板

### 3.1 目录与模块

逐个检查：

- `main`、配置加载、启动和资源初始化的边界。
- router/transport、handler/resolver、application/service、domain、repository/model 的职责。
- 数据库、缓存、RPC、外部 HTTP 等 adapter 放置位置。
- middleware、errors、config、types 和 tests 的所有权。
- 各层调用、同层依赖、transport 类型泄漏、公共 crate 副作用和 public API 是否符合第 4 节。
- 新增 endpoint、业务规则或漏洞修复时，开发者能否确定固定落点。

### 3.2 请求处理链路

- listener/router 到 middleware、handler/resolver、service、model/repository、数据库的实际链路能否完整追踪；允许的调用方向按第 4 节检查。
- 参数在哪一层解析、校验和转换。
- 认证与授权是否在正确层执行。
- pool/connection、缓存和外部 client 的生命周期；写操作 transaction 按 5.3 检查。
- domain error 到 GraphQL、HTTP 或 Thrift 的转换按 6.3 检查。
- 超时、取消、重试和部分失败是否能沿调用链传播。
- handler/resolver 是否直接堆积业务规则和数据库逻辑。
- 写操作的原子性、幂等性及并发行为按 5.3 检查。

### 3.3 Rust 模块、复用与资源使用

- 是否仍存在 `mod.rs`，新增和现有模块是否应统一为 `foo.rs` 与 `foo/` 并存的模块结构。
- 模块拆分是否由职责、可见性和依赖方向决定，而不是只按文件长度或历史位置决定。
- `pub`、`pub(crate)`、`pub(super)`、私有边界和 re-export 按第 4 节逐项审计。
- 是否在循环、请求热路径、大对象、数据库记录、敏感数据或高频异步任务中使用不必要的 `clone`、`to_owned`、`to_string`、`collect` 或中间容器。
- clone 是否有真实所有权需求；只读参数优先使用引用、slice 或迭代器，owned value 只用于存储、转移、跨任务持有或构造独立结果，轻量共享 handle 的 clone 不机械消除。
- 是否能用借用、`Cow` 或共享 immutable state 降低复制，同时不引入更复杂的生命周期或隐藏成本。
- 多个服务或模块中的重复行为是否具有相同语义、错误规则和生命周期，适合由 trait、泛型、普通函数或宏统一表达。
- 重复转换、错误映射、middleware、GraphQL/Thrift glue 或 model boilerplate 是否适合普通函数、trait、derive 或声明式宏；抽象必须表达稳定契约，不能隐藏控制流或只为减少几行代码。
- `allow`、dead code、未使用 feature 和平台条件编译是否掩盖了错误的模块边界或废弃实现。

## 4. 模块调用方向、同层依赖与可见性专项

目录名称不能代替依赖规则。每个 crate、package 或应用都要先按实际代码建立模块矩阵，记录每一层/模块的职责、允许调用方、允许依赖、public surface 和例外；再从 import/use、函数调用、类型引用、re-export、运行时注入和生成配置验证真实依赖图。

### 4.1 默认调用方向

后端默认方向：

```text
router / transport / GraphQL resolver
                  ↓
       application / service
                  ↓
 model / repository / outbound adapter
                  ↓
database / RPC / external HTTP / filesystem
```

- 上层默认只通过下一层的公开接口调用，不绕过 service/application 直接访问 model/repository，也不从下层反向依赖上层 transport、框架类型或业务编排。
- service/application 可以为完成一个业务用例和 transaction 调用多个 model/repository，例如 `NovelService -> AuthorModel`；它是跨聚合写入和错误语义的 owner。
- 数据库能力对 router/resolver 和 crate 内其他领域只暴露 service/application API；model/repository 模块、ORM record 和 query helper 默认只对其直接 service owner 可见。
- 同层 service 默认不互相调用。跨 use case 编排应放到更高层 orchestrator/application，稳定的共同能力应下沉到明确 owner；保留 service-to-service 调用必须登记例外。
- model/repository 默认不调用 sibling model 的业务方法。跨表查询可以由明确 owner 的 repository/query object 实现，跨表业务协调仍由 service/application 负责。
- lower layer 的实现类型和 helper 只对直接合法消费者可见；上层不能通过 re-export 把 model、数据库 record、ORM query 或内部 client 伪装成自己的 public API。
- middleware、共享 crate 和 adapter 不得隐藏跨层调用、临时创建下游 client、读取全局配置或执行未在接口中表达的副作用。

前端不强制所有应用使用完全相同的层名，但每个 package/feature 必须声明单向依赖图，并至少满足：

- 应用入口、路由和页面负责组合 feature；feature 通过自身 public API 暴露组件、hook 或 command，不允许消费者深层导入内部文件。
- UI/component 不直接绕过 feature 的 request/state/domain 边界；request、state、domain 和通用工具不得反向依赖页面、应用或具体 UI。
- shared/common 不依赖具体应用或业务 feature；同层 feature/package 等独立 owner 默认不直接调用，复用应移动到明确 owner、稳定公共模块或更高层编排。
- alias、barrel、workspace hoist、全局 store/context 和运行时注册不能掩盖 manifest/package exports 未声明的真实依赖。
- 层级矩阵以具有独立职责和 owner 的模块为节点，不机械把每个文件当成一层；同一 owner 内的组件组合可以保留，但跨 peer module 的 hook、store、service、组件或类型调用必须按 4.3 登记，且不能形成双向引用或循环。

### 4.2 Public surface 与无用代码

- 逐项盘点 Rust 的 `pub`、`pub(crate)`、`pub(super)`、public module/field/trait method 和 re-export，以及 TypeScript 的 export、barrel、path alias 和 package exports；按祖先模块计算有效可见性，不能只搜索关键字。
- 默认 private；只给父模块使用时优先 `pub(super)`，有多个明确 crate 内消费者时才使用 `pub(crate)`，只有真实跨 crate/package 合同才使用 `pub` 或 package export。
- 每个公开符号都要列出真实消费者和需要的最小可见范围；无消费者、只被测试使用、可由调用方内联或可缩小可见性的符号，应记录为 dead code、错误暴露或测试边界问题。
- 检查公开签名是否泄漏 ORM record、GraphQL/HTTP 类型、框架 context、内部错误、配置、client 或其他下层实现，迫使消费者形成错误依赖。
- 检查消费者是否通过相对路径、alias、barrel 或 re-export 绕过 owner 的 public API；manifest、Cargo feature 和 package exports 是否准确声明真实消费者。
- 编译器、clippy、knip 和 tree-shaking 结果只能作为证据之一；错误标记为 public 的无用代码可能不会被自动报告，必须结合调用图人工确认。
- 生成代码和 vendored API 不审查其内部 public surface，但要审查本仓库的手写输入、adapter、re-export 和消费者是否扩大暴露范围。

### 4.3 同层调用与例外登记

- 为每个 crate/package 输出允许边矩阵，并列出所有跨层、反向、同层和跨 package/crate 的实际调用；即使没有 finding，也要登记已检查范围。
- 每个例外必须记录 caller、callee、调用方向、业务原因、owner、数据/transaction 边界、测试、预期保留期限，以及为什么不能通过下一层接口、上层编排或下沉共同能力解决。
- 同层调用若共享可变状态、transaction、cache、错误语义或生命周期，必须确认只有一个 owner；不能靠调用顺序维持隐式 invariant。
- 新增模块、入口或公开符号时，检查矩阵、manifest、文档、测试和 lint/build 边界是否同步更新。

## 5. GraphQL、数据库和批量访问专项

### 5.1 GraphQL server 中的连接池

- 连接池由谁在启动时创建。
- 连接池是放在 schema context、应用 state、显式依赖对象还是隐藏全局变量中。
- resolver 如何取得连接，是否每个请求或 resolver 重复创建资源。
- pool handle、实际 connection 和 transaction 的生命周期是否分清。
- 一个请求中的多个 resolver 是否需要共享 transaction。
- pool size、获取超时、连接失败和 shutdown 行为是否明确。
- 测试时是否能替换数据库依赖，而不启动完整服务。

### 5.2 数据库操作

- 是否在循环或 GraphQL resolver 中产生逐条数据库访问/N+1，能否使用 batch query/write、join、预加载或 DataLoader 收敛。
- 循环中的数据库和外部请求是否缺少并发上限。
- 按 5.3 的统一模板逐个审查所有写入口，不能只抽查几个使用了 transaction 的复杂函数。
- 分页是否稳定，排序是否确定。
- constraint、index 与真实查询是否匹配。
- migration、Diesel schema、model 和 GraphQL contract 是否可能漂移。

### 5.3 写操作与事务边界

事务审查必须先建立完整写入口清单，而不是只搜索 `transaction` 调用。逐个覆盖 GraphQL mutation、HTTP/RPC 写接口、service/application command、crawler/后台任务、启动任务和 migration；每个拥有数据库的 service 都应输出一张写操作矩阵，至少记录：

- 入口/业务操作，涉及的表、关系、派生字段和外部资源。
- read/write 顺序、connection owner、transaction 开始/提交位置和 isolation level。
- 并发控制使用的 row lock、optimistic version、unique/FK/check constraint 或其他 invariant。
- 失败、超时、取消、重试后的数据库状态、对调用方的结果及幂等性。
- 已确认合理、存在问题或待决；即使没有 finding 也要登记已检查结论。

逐项判断：

- 单条 SQL 已完整表达业务操作时不机械增加显式 transaction；创建主记录和关系、同步多表、批量保存、层级移动、级联删除或派生值联动等多步骤写入，必须由同一业务 transaction 和 connection 覆盖。
- check-then-write/read-modify-write 是否有竞态；默认 transaction 是否仍需配合 constraint、适当 isolation、row lock 或写前重新验证。
- 删除顺序是否符合 FK、`ON DELETE`、手动清理和软删除合同；层级、路径、聚合值、后代和关系是否在同一边界保持 invariant，不能把“最终 rollback”当成正确实现。
- 写入后的回读是否与 mutation 同一原子边界；update/delete 是否检查 affected rows 或使用 `RETURNING`，避免“已提交却返回失败”或把并发 no-op 当成功。
- batch SQL、循环写入、nested transaction 和 savepoint 的边界是否有意设计；任一步失败是否会留下部分结果或产生不必要的递归 savepoint。
- transaction 内不得等待外部 HTTP/RPC、文件 I/O、长计算或无界循环；transaction 外也不能无理由 checkout connection 后跨 `await` 持有，外部请求完成后应按需重新验证数据。
- 错误、取消、timeout、deadlock、serialization failure 和 commit 结果不明确时是否完整 rollback、保留 source 并安全重试；重试和外部副作用是否幂等。
- 一个请求包含多个写 field/command 时，原子性合同是否明确；不能默认 GraphQL/HTTP 框架会共享 transaction。
- migration 是否有可靠执行入口；事务与非事务 DDL、schema 变更、backfill、constraint 切换和 down migration 是否按不会丢数据的顺序完成。

事务测试至少覆盖：

- 中间步骤故障、constraint/FK 失败、记录不存在和 affected rows 为 0，确认没有部分提交。
- 重复及并发 create/update/delete/move、deadlock/serialization retry，确认结果、次数和幂等性。
- 外部依赖超时/失败时 transaction 与 connection 及时释放。
- migration 在已有数据、空表、脏数据和 down/rollback 场景下不丢失或伪造关系。

## 6. Tracing、请求 ID 和 middleware 专项

### 6.1 Trace/request ID

- trace ID、span ID 和 request ID 各自代表什么，是否混用。
- 第一个可信入口是接受并验证上游 `traceparent`，还是生成新的 trace。
- ID 是否只生成一次，还是每层又产生不相关 ID。
- ID 是否保存在 request-local context/extensions/span 中，而不是全局可变状态。
- HTTP、GraphQL、Thrift、后台任务和外部请求是否完整传播。
- 重试、fan-out 和异步任务的 parent/child 关系是否正确。
- 日志是否自动携带关联字段，响应是否需要返回 request ID。
- 非法输入、隐私、长度限制和日志脱敏是否处理。

### 6.2 Middleware

- middleware 清单、顺序和适用协议是否明确。
- request context、tracing、CORS、认证、body limit、timeout、错误转换分别由谁负责。
- middleware 是否单一职责，还是隐藏业务逻辑。
- 是否重复解析 token、header 或请求体。
- middleware 中是否执行数据库或外部网络操作；如果有，是否真的属于全请求公共行为。
- middleware 失败是否产生统一且安全的错误。
- 是否阻塞 async runtime、持有锁跨越 `await` 或重复分配昂贵资源。
- HTTP、GraphQL 和内部 RPC 的 middleware 行为是否出现不一致。

### 6.3 错误处理、前端错误合同与 tracing 覆盖

- `unwrap`、无说明的 `expect`、`panic!`、`todo!`、`unimplemented!` 和 `unreachable!` 是否只用于已经由类型、初始化顺序或已验证 invariant 保证不会失败的情况。
- “理论上不会失败”的 invariant 是否有清晰注释、上游校验和测试，而不是依赖当前输入碰巧满足条件。
- 可恢复错误是否使用 `Result` 传播，并保留原始 source、业务上下文和调用链，而不是丢失为普通字符串。
- transport、domain、database、RPC 和外部 HTTP 错误是否在明确边界转换，是否依赖脆弱的 message 匹配。
- 向前端返回的错误是否只有稳定、可处理的 code 和安全 message；内部信息泄漏、枚举风险和日志脱敏按 9.2、9.4 检查。
- 同一类错误在 HTTP、GraphQL 和 Thrift 中是否保持一致身份，并为未知 code 提供安全 fallback。
- 日志是否包含足够的操作、资源、调用方和 correlation context；secret、凭证和个人数据脱敏按 9.4 检查。
- error 是否在合适的边界被记录一次，避免每层重复打印同一错误或完全无人记录。
- tracing span 是否在失败时记录 error 字段和失败状态；`tracing::instrument` 是否跳过 secret/大对象并记录必要标识。
- 认证授权、数据库事务、外部请求、RPC、GraphQL mutation、后台任务、重试耗尽、启动和 shutdown 等关键路径是否都有 span/event。
- `spawn`、stream、回调或 detached task 中的错误是否会被观察和关联，而不是静默丢失。
- 日志级别是否反映可操作性：预期业务拒绝、客户端错误、暂时依赖失败和服务内部错误是否被错误地全部记为同一级别。

## 7. 运行时服务边界和跨服务依赖专项

本节只审查独立进程或部署单元之间的 HTTP/RPC、共享数据库和部署依赖；crate/package 内的 module、service 和同层调用统一按第 4 节检查。

- 每个服务是否拥有清晰领域职责和数据。
- 服务依赖图是否能形成可理解的有向关系，是否存在循环依赖。
- gateway、认证服务和业务服务是否承担了不属于自己的业务逻辑。
- 服务是否通过共享数据库或共享 crate 形成隐藏耦合。
- RPC/HTTP client 是否被明确注入，还是在业务代码中临时创建。
- 服务地址、端口和发现方式是否由正确的配置层管理。
- 下游失败是否通过 timeout、retry/backoff、并发限制、背压、降级和停止重试策略隔离，而不是放大为级联失败。
- 同一合同的 IDL/schema、实现、调用方和部署顺序是否一致。

## 8. 跨层端到端数据流

选取代表性业务链路，按照统一模板追踪：

1. 用户操作或外部请求入口。
2. 前端组件、状态和请求构造。
3. gateway、路由和 middleware。
4. HTTP、GraphQL 或 Thrift contract。
5. 后端 handler/resolver、service 和 domain。
6. 数据库、缓存或外部数据源。
7. 错误、日志、trace 和取消。
8. 返回值、前端 cache/store 和最终 UI。

借此检查单独看每个模块时不易发现的职责重复和链路断层。

## 9. 安全专项

### 9.1 身份、权限与会话

- 每个 HTTP route、GraphQL field/resolver 和 RPC operation 是否同时检查身份与资源级权限，避免只验证“已经登录”。
- 用户能否通过修改 ID、path、GraphQL 参数或分页条件访问其他用户资源，是否存在 IDOR/越权风险。
- 权限模型是否默认拒绝，角色、owner 和特殊管理能力是否在统一边界执行。
- token/JWT 的算法、签名、过期、issuer、audience、clock skew、轮换和撤销策略是否明确。
- cookie 是否按用途正确设置 `Secure`、`HttpOnly`、`SameSite`、domain/path 和有效期；是否评估 CSRF、session fixation、logout 与账户切换。
- WebAuthn 的 RP ID、origin、challenge、session 状态、重放和超时边界是否正确。
- 登录、注册、认证、找回或敏感操作是否有速率限制、失败计数和防枚举策略。

### 9.2 输入、GraphQL 和数据暴露

- 所有 transport 边界是否校验长度、范围、格式、枚举、集合大小和未知字段，而不是只依赖静态类型。
- GraphQL 是否限制 query depth、complexity、alias/fragment 滥用、批量 operation 和最大分页大小。
- GraphQL introspection、playground 和调试信息在生产环境中的开放策略是否明确。
- resolver 和 serializer 是否可能返回调用方无权看到的敏感字段；字段级权限是否与对象级权限一致。
- update/create 输入是否可能产生 mass assignment，让客户端修改服务端专属字段。
- raw SQL、动态路径、文件名、命令、模板和 HTML 内容是否存在 SQL injection、path traversal、command injection 或 XSS 风险。
- 错误差异、响应时间和状态码是否可能暴露用户、资源、权限或内部处理路径。

### 9.3 外部请求、爬虫与 SSRF

- 用户可控 URL 是否限制 scheme、host、port 和认证信息，是否默认拒绝 loopback、private、link-local、metadata 和内部服务地址。
- redirect 后是否重新执行目标校验，是否评估 DNS rebinding 和解析结果变化。
- 外部响应是否限制大小、内容类型、解压后大小、读取时间和 redirect 次数。
- 外部请求是否设置连接/整体 timeout、取消、并发和速率限制，避免资源耗尽。
- HTML、图片、文件和第三方数据解析是否可能触发脚本内容、恶意编码、路径写入或解析器资源耗尽。
- 代理、crawler 和 fetch-content 类接口是否可能被当作开放代理或用于探测内部网络。

### 9.4 Secret、日志、密码与数据保护

- secret、数据库 URL、token、cookie、密码和私钥是否只来自明确配置源，是否存在不安全默认值、提交到仓库或进入构建产物的风险。
- Debug、Display、panic、error chain、tracing field 和 HTTP 响应是否可能输出 secret、凭证或个人数据。
- 密码是否使用适当的 password hashing、salt 和比较方式，而不是普通 hash、明文或可逆加密。
- 随机 token、challenge、session ID 和安全标识是否使用密码学安全随机源。
- 数据库账号是否遵循最小权限，业务服务之间的数据访问是否有清晰隔离。
- 敏感数据的保留、删除、缓存、备份、浏览器持久化和日志生命周期是否明确。

### 9.5 资源滥用、运行时与供应链

- request body、上传、分页、GraphQL 查询、队列、并发 task、连接池和内存缓存是否有明确上限。
- CPU 密集、阻塞 I/O、解压、解析和密码操作是否可能阻塞 async runtime 或被用于 DoS。
- timeout、retry 和 backoff 是否会形成重试风暴；失败依赖是否有并发控制和背压。
- TLS 版本、证书验证、SNI、内部明文链路和出站 HTTP client 的信任策略是否明确。
- `unsafe`、FFI、平台专属代码和系统命令调用是否有最小边界、调用 invariant 和测试。
- Rust/JavaScript 依赖、lockfile、build script、容器基础镜像和 GitHub Actions 是否存在已知漏洞或不必要的供应链权限。
- CI token、workflow permission、第三方 Action、镜像发布凭据和缓存是否遵循最小权限并避免不可信代码获取 secret。

## 10. 测试覆盖与可测试性

- 为前后端每个关键模块、请求链路和高风险行为建立测试矩阵，记录 owner、路径/符号、现有测试类型和缺失场景；不能只汇总测试文件数量或覆盖率。
- 前端重点检查 store、hook、数据转换、表单校验、错误映射、权限/路由判断、复杂组件状态和用户失败反馈是否有单元或组件测试。
- 后端重点检查 domain/service 规则、错误转换、认证授权、middleware、trace 传播、parser、批量/分页逻辑和 transaction 决策是否有单元测试。
- 成功、失败、边界、空输入、非法输入、权限拒绝、超时、取消、重试和并发路径是否都有对应场景。
- 单元测试、组件测试、合同测试、集成测试和端到端测试的责任是否区分清楚，是否用宽泛的集成测试掩盖关键纯逻辑缺少单元测试。
- 测试是否验证可观察行为和不变量，而不是过度绑定内部实现、只断言 snapshot 或只验证“没有抛错”。
- 难以编写单元测试的位置是否暴露了隐藏全局状态、框架耦合、资源初始化和职责过大的设计问题。
- 测试是否可重复、相互隔离，不依赖生产数据、真实 secret、不稳定网络、执行顺序或共享可变状态。
- 生成代码和第三方 vendored 代码不重复测试其内部实现，但必须测试本仓库的手写输入、adapter、配置和消费者边界。

## 11. 交付、生成与文档专项

- GraphQL、Thrift、Diesel、前端 codegen 等手写事实源、生成入口、生成物、消费者和 CI drift gate 是否形成单一链路。
- 配置、环境变量、默认值、服务发现和生产部署是否一致，是否存在两套事实源或环境专属硬编码。
- Docker、Compose、gateway、TLS、migration、CI 和发布顺序是否匹配真实运行拓扑，并具有 readiness、回滚和失败可见性。
- 依赖、框架、build script、工具链和自定义编排是否增加不必要复杂度或隐藏副作用；供应链安全按 9.5 检查。
- README 是否让后续开发者找到 owner、事实源、生成入口、验证命令和外部前置条件，而不是复制易漂移的接口清单。

## 12. 文档职责和后续流程

- `review-checklist.md`：只记录审查范围、通用模板、专项清单、覆盖单位和完成标准，不记录问题结论。
- `review-findings.md`：review 时记录问题、证据、影响、严重程度、涉及模块、验证方式和建议处理方向，不写完整实施设计。
- `README.md`：问题清单确认后，选择本分支要解决的内容，补齐完整设计、工作包和验证；过大的独立问题另外创建 Issue 和分支。
- 每轮 review 必须产出前端和后端各自的目录/依赖契约判断、模块允许边与例外矩阵、数据库写操作/transaction 矩阵、关键链路和测试覆盖矩阵；具体目标结构必须基于当轮证据决定，不能预设所有应用完全相同。

建议在以下情况下拆分新 Issue：

- 独立架构领域。
- 跨层迁移。
- 数据库或 schema 迁移。
- 安全边界变化。
- 部署拓扑变化。
- 无法在一个可审阅 PR 中完整实现和验证。
