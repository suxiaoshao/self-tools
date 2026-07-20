# Issue #94：仓库代码 Review 结果

本文记录依据 [`review-checklist.md`](review-checklist.md) 完成的本轮仓库代码 review 结果。本文是问题清单，不是整改计划：只记录已确认的问题、证据、影响、验证方式和建议处理边界，不预先决定目标设计、实施顺序或最终 Issue 拆分。

## Review 状态

- Review date: `2026-07-19`
- Tracking issue: [suxiaoshao/self-tools#94](https://github.com/suxiaoshao/self-tools/issues/94)
- Branch: `codex/issue-94-ai-repository-code-review`
- Status: `Completed for the current checklist and current repository state`
- Section 4 re-review: `Completed on 2026-07-19 after adding module direction, peer dependency, and visibility rules`
- Production code changes: `None`
- Review scope:
  - 根 workspace、manifest、共享配置和 package/crate 依赖。
  - `web/packages/*`、`web/common/*` 的目录、组件、请求、状态、错误、i18n、可访问性和构建产物。
  - `server/packages/*`、`server/common/*` 的请求链路、GraphQL、Thrift、数据库、middleware、tracing、错误、安全和 Rust 所有权。
  - 每个前端 package、后端 crate 的实际调用边、同层依赖、public surface、真实消费者和例外。
  - migration、Docker、Compose、`xtask`、GitHub Actions 和生成链路。
  - 现有前后端测试及仓库级检查。

本轮以静态代码和配置审查为主，并执行仓库已有检查。没有连接生产数据库、启动完整 Docker 拓扑或对真实部署进行渗透测试，因此本文不是安全保证；它只陈述当前有直接证据支持的结论。

## 严重程度与记录规则

| Level      | 含义                                                                 |
| ---------- | -------------------------------------------------------------------- |
| `Critical` | 可直接导致凭证泄露、任意内网访问、不可逆数据破坏等，需要优先隔离。   |
| `High`     | 常见输入或运行状态即可触发严重安全、数据一致性、可用性或发布问题。   |
| `Medium`   | 已有明确消费者影响，会持续造成错误行为、性能、可维护性或恢复性问题。 |
| `Low`      | 局部但已确认的所有权、生命周期或运行成本问题。                       |

- `Checklist finding`：由现有 review 清单中的检查项直接发现。
- `Additional finding`：清单没有把该行为单独列为检查项，但存在精确证据和实际影响，仍按清单的开放覆盖原则记录。
- “建议独立跟踪”只表示问题边界足够独立或庞大，便于后续讨论是否新建 Issue；不代表本轮已经确定拆分或设计。

## 总体结论

### 架构与目录

仓库已经具备 portal、业务前端、共享前端包、gateway、认证服务、GraphQL 服务、共享后端 crate 和部署工具等名义分层，但这些目录目前不能可靠表达真实所有权：

- 前端 manifest 表达的依赖方向与源码实际导入相反，`common` 还反向依赖具体应用，形成由根 alias 隐藏的逻辑环。
- collections 内部的 Collection 与 Item feature 互相 deep import，Item operation 和表单没有单一 owner。
- bookmarks 与 collections 在前后端都复制了 collection、GraphQL guard、error mapping 等实现，并已经出现行为漂移。
- 后端 `service` 同时承担 GraphQL object、resolver、业务规则和数据库访问，`model` 又反向依赖 GraphQL、crawler 和 transport 命名的错误；login router 也直接拥有 WebAuthn 状态、认证编排和 Thrift client，分层边界互相穿透。
- 前后端公共入口都存在没有真实消费者的 export、过宽 Rust 可见性、空模块或未使用 dependency/feature；默认 lint、clippy 和普通 knip 不会完整报告这些已公开合同。
- 当前不能把已有目录直接定为后续所有应用的通用模板；应先依据本问题清单确定公共职责、public API 和依赖规则，再形成前后端各自的通用目录契约。

### 请求与数据流

当前请求链路存在结构性问题：前端 Apollo cache、Zustand 和组件状态的权威边界不清；后端同步 Diesel 直接运行在 async resolver 中，并可能跨外部网络 `await` 持有连接；GraphQL 子字段 N+1、逐 root-field 认证 RPC、全量加载后分页和无复杂度限制会互相放大。总体上不能认为现有请求数据流合理。

### 服务依赖

本轮没有确认 Cargo crate 环或运行时服务环，名义拓扑仍是 gateway → HTTP/GraphQL 服务 → auth/数据库。但 GraphQL guard 和 login handler 都直接创建 Thrift client，公共合同 crate 又混入 `auth:80` discovery；再加上每个 root field 重复 DNS/RPC、共享 crate 改动未完整触发消费者镜像，以及部署只声明启动顺序而不验证 readiness，依赖关系尚未形成可靠的调用和发布合同。

### 数据库连接池

bookmarks 和 collections 都在 schema 构建时只创建一次连接池，没有每请求重建 pool，这个生命周期合理；但 raw `PgPool` 被放入 GraphQL context，并由 resolver checkout `PgConnection` 再传给 service，不符合本次新增的 service-only 数据库边界。同步 r2d2/Diesel 操作、跨外部 `await` 持有连接和 resolver 可测试性仍见 RF-008、RF-020。

## 第 4 节专项复审矩阵

以下矩阵按 package/crate 记录实际生产依赖的主要方向和结论；详细证据与影响仍归入对应 finding，避免把同一调用边重复写成多条问题。

### 前端 package

| Owner            | 实际主要依赖边                                                                  | 结论                                     |
| ---------------- | ------------------------------------------------------------------------------- | ---------------------------------------- |
| `portal`         | 通过 package root 组合 `bookmarks`、`collections`；自身内部又被下层 deep import | 组合边合理；反向边见 RF-018              |
| `bookmarks`      | common package root；`@portal/*`、`@collections/*` 内部路径                     | RF-018；collection owner 缺失见 RF-019   |
| `collections`    | common package root；`@portal/*`、`@bookmarks/*`；Collection ↔ Item             | RF-018、RF-033                           |
| `custom-graphql` | Apollo/Sonner adapter                                                           | 职责可成立；manifest 漏报见 RF-018       |
| `custom-table`   | TanStack、`i18n`；反向依赖 portal/collections                                   | RF-018；无消费者 root export 见 RF-034   |
| `details`        | 反向依赖 portal UI/utils                                                        | RF-018；过宽 type export 见 RF-034       |
| `edit`           | Monaco；反向读取 portal Theme store                                             | RF-018                                   |
| `i18n`           | i18next/react-i18next；反向依赖 portal/collections                              | RF-018；重复 root export 见 RF-034       |
| `time`           | Day.js                                                                          | 依赖方向合理                             |
| `types`          | React types；被 portal 与 feature package 消费                                  | 基础方向合理；dead public type 见 RF-034 |

### 后端 crate

| Owner            | 实际主要依赖边                                                              | 结论                                            |
| ---------------- | --------------------------------------------------------------------------- | ----------------------------------------------- |
| `auth`           | main → Thrift service adapter → JWT/config；下层返回生成的 Thrift error     | 反向 transport 依赖并入 RF-020                  |
| `login`          | main → router；handler 直连 state、WebAuthn、Thrift 和 errors               | RF-035                                          |
| `gateway`        | main → config/route/proxy                                                   | 内部方向清晰；重复 trace 事实源见 RF-031        |
| `bookmarks`      | router/resolver → raw pool/service → model；transport 还直连 Thrift/crawler | RF-020；运行时放大分别见 RF-003、RF-009         |
| `collections`    | router/resolver → raw pool/service → model；GraphQL ↔ service/model         | RF-020                                          |
| `graphql-common` | root facade → private date-time/pagination/tag-match                        | 方向合理；局部无消费者 public surface 见 RF-034 |
| `middleware`     | feature-gated facade → CORS/GraphQL trace/HTTP trace                        | 方向合理；manifest 漂移见 RF-034                |
| `novel_crawler`  | root facade → traits/errors/site adapters                                   | 主要合同有消费者；dead public trait 见 RF-034   |
| `thrift`         | generated contract facade + concrete client + `auth:80` DNS discovery       | 生成边合理；client/discovery 混入见 RF-009      |
| `xtask`          | binary → `Task/BuildOptions/run` facade → private tasks/context/compose     | 方向与有效可见性合理                            |

### 允许边与例外结论

- `portal -> bookmarks/collections` 通过 bare package root 完成组合，是本轮确认的允许边。
- 一个业务用例中的 service/application 可以调用多个 model，例如 `Author::delete -> AuthorModel + NovelModel + ChapterModel + CollectionNovelModel` 和 `Novel -> AuthorModel`，这些没有作为同层调用问题记录。
- 没有确认 Cargo crate 环、运行时服务环或 model-to-model 方法调用；common crate 也没有反向依赖具体 service crate。
- Thrift `OUT_DIR` 生成模块及其 root re-export 是公开 RPC 合同所需边界，不作为下层泄漏。

| Exception ID | 调用边                              | 状态      | 复审结论                                                                                            |
| ------------ | ----------------------------------- | --------- | --------------------------------------------------------------------------------------------------- |
| `EX-P01`     | `SaveDraftAuthor -> Author::create` | `Pending` | 可能是合理 application orchestrator，但当前位于同层 service namespace，尚无 owner、边界和测试登记。 |

## Findings 总览

| ID     | Severity   | Domain                    | Finding                                                         |
| ------ | ---------- | ------------------------- | --------------------------------------------------------------- |
| RF-001 | `Critical` | Migration / data          | collection-item migration 会直接丢失现有关联                    |
| RF-002 | `Critical` | Auth / credential         | JWT 包含明文管理员密码且接近永久有效                            |
| RF-003 | `Critical` | SSRF / external HTTP      | `/fetch-content` 是无鉴权任意 URL 服务端代理                    |
| RF-004 | `High`     | Logging / data protection | HTTP、GraphQL 和 Thrift 日志会保存凭证及完整业务数据            |
| RF-005 | `High`     | Error contract            | 内部错误 source 被发给前端并直接展示或写入浏览器日志            |
| RF-006 | `High`     | WebAuthn / session        | credential 与 ceremony state 只存在单进程内存且缺少生命周期保护 |
| RF-007 | `Medium`   | CORS                      | credentialed CORS 的 suffix 判断扩大了可信域                    |
| RF-008 | `High`     | Async / database          | 同步数据库操作阻塞 Tokio，连接还会跨外部网络等待持有            |
| RF-009 | `High`     | GraphQL / dependencies    | N+1、重复认证 RPC 与无复杂度上限形成客户端可控的负载放大        |
| RF-010 | `High`     | Database integrity        | Novel/Author 删除顺序违反现有外键                               |
| RF-011 | `High`     | Hierarchical data         | Collection 更新可制造环并使 path 永久漂移                       |
| RF-012 | `High`     | Frontend data integrity   | Item 编辑会静默丢弃 collectionIds 修改并存在异步回填竞态        |
| RF-013 | `Medium`   | Pagination                | 部分分页先全表加载，部分 SQL 分页没有稳定排序                   |
| RF-014 | `Medium`   | Apollo / state            | Apollo client 生命周期、缓存和错误状态策略相互冲突              |
| RF-015 | `Medium`   | GraphQL operations        | 列表和嵌套 operation 存在明确 overfetch                         |
| RF-016 | `High`     | User recovery             | WebAuthn、表单校验和页面错误状态存在静默失败路径                |
| RF-017 | `Medium`   | HTTP error contract       | login REST 错误始终返回 200，`code` JSON 形态不稳定             |
| RF-018 | `High`     | Frontend architecture     | workspace 存在 manifest 未声明的反向依赖和逻辑环                |
| RF-019 | `Medium`   | Frontend modules          | collection 子系统被跨应用复制并已发生行为漂移                   |
| RF-020 | `Medium`   | Backend modules           | transport、application、persistence 边界坍塌并形成反向依赖      |
| RF-021 | `Medium`   | Runtime configuration     | 前端服务地址和生产域名散落硬编码                                |
| RF-022 | `Medium`   | Frontend performance      | 所有业务路由、Monaco 和 Prism 进入首包                          |
| RF-023 | `Medium`   | UI safety / accessibility | 破坏性操作无确认，且存在非法交互嵌套和无可访问名称控件          |
| RF-024 | `Medium`   | i18n                      | 用户可见文本、错误和可访问性文本仍绕过 i18n                     |
| RF-025 | `Medium`   | Debug instrumentation     | 生产路径 Proxy 会记录编辑器对象和内容                           |
| RF-026 | `Low`      | React lifecycle           | `useTitle` 在 render 阶段写 `document.title`                    |
| RF-027 | `Low`      | Rust ownership            | crawler trait 强制深复制完整章节列表                            |
| RF-028 | `High`     | xtask / secret            | 构建上下文和 Compose 签名会复制或暴露 secret                    |
| RF-029 | `High`     | Deployment / database     | 部署缺少 migration/readiness/version/network 安全合同           |
| RF-030 | `High`     | CI / generated contracts  | CI 未覆盖共享 GraphQL 源、生产前端构建和 schema 漂移            |
| RF-031 | `Medium`   | Tracing                   | 当前 trace 只是字符串关联，失败与父子关系记录不完整             |
| RF-032 | `Medium`   | Testing                   | 关键路径缺少测试，crawler 测试又依赖真实公网                    |
| RF-033 | `Medium`   | Frontend feature boundary | Collection 与 Item feature 双向依赖且 Item operation owner 错置 |
| RF-034 | `Low`      | Public/dependency surface | 前后端公开面和 manifest 留有无消费者合同                        |
| RF-035 | `Medium`   | Backend module boundary   | login router 吞并业务编排、状态存储和 RPC adapter               |

统计：`Critical 3`、`High 13`、`Medium 16`、`Low 3`，共 `35` 项。

## A. 数据完整性与安全边界

### RF-001：collection-item migration 会直接丢失现有关联

- Severity: `Critical`
- Classification: `Checklist finding` — 数据库、migration、schema 漂移。
- Evidence:
  - `server/packages/collections/migrations/2025-10-06-063430_collection_item/up.sql:3-13` 先创建 `collection_item`，随后直接删除 `item.collection_id`，没有任何 backfill。
  - `server/packages/collections/migrations/2025-10-06-063430_collection_item/down.sql:4-14` 回滚时把所有 item 指向 `collection` 中任意第一行；没有 collection 时还会因 `NOT NULL` 失败。
- Impact: 在已有数据的数据库执行 up migration 会永久丢失 item 原有 collection 归属；down migration 无法恢复原关系，且可能不可执行。
- Validation: SQL 控制流静态确认；本轮没有在真实数据库执行，因为执行本身可能破坏数据。
- Suggested boundary: 独立数据库修复/迁移 Issue 候选；在确认已部署环境的 migration 历史和现存数据前，不应直接设计替代 migration。

### RF-002：JWT 包含明文管理员密码且接近永久有效

- Severity: `Critical`
- Classification: `Checklist finding` — 身份、token、secret、浏览器持久化。
- Evidence:
  - `server/packages/auth/src/utils.rs:16-33` 的 claims 直接包含 `password: String`，`exp` 固定为 `10_000_000_000`。
  - `server/packages/auth/src/utils.rs:36-69` 将 claims 编码成 JWT，并在验证时再用其中的密码和环境变量密码比较。
  - `server/packages/auth/src/utils.rs:74-94` 会把无效或过期 token 原样写入日志。
  - `web/packages/portal/src/features/Auth/authSlice.ts:14-27` 把 token 长期保存在 `localStorage`；`web/common/custom-graphql/src/index.tsx:60-68` 将其加入每个 GraphQL 请求。
- Impact: JWT payload 只是编码而非加密，取得 token 的客户端、XSS 或日志读取方都能恢复管理员明文密码；该密码还可脱离 token 重新登录，固定过期时间又使泄漏长期有效。
- Validation: 按 claims 结构和调用链静态确认，不需要猜测 JWT 实现。
- Suggested boundary: 独立身份与会话安全 Issue 候选；需要跨 auth、login、前端存储和撤销/轮换策略共同决策。

### RF-003：`/fetch-content` 是无鉴权任意 URL 服务端代理

- Severity: `Critical`
- Classification: `Checklist finding` — 外部请求、SSRF、资源滥用。
- Evidence:
  - `server/packages/bookmarks/src/router.rs:20-23` 公开注册 `GET /fetch-content`，没有认证 guard。
  - `server/packages/bookmarks/src/router/fetch_content.rs:18-33` 把查询参数直接交给 `reqwest::get`，并转发远端 status、headers 和流式 body。
  - `server/packages/gateway/src/route.rs:21-26` 会把 bookmarks host 的所有 path 代理到该服务。
  - `web/packages/bookmarks/src/utils/image.ts:8-16` 把该接口用作图片代理，但服务端没有把用途限制为图片或可信 host。
- Impact: 外部请求者可以访问 loopback、容器内服务、private/link-local 地址或云 metadata，并读取响应；慢响应、重定向和无限 body 还可消耗连接与带宽，远端 `Set-Cookie` 等 header 也会污染本站 origin。
- Validation: route → handler → gateway 的公开调用链静态确认。
- Suggested boundary: 独立 SSRF/外部 HTTP 安全 Issue 候选，应先隔离暴露面再讨论长期代理设计。

### RF-004：HTTP、GraphQL 和 Thrift 日志会保存凭证及完整业务数据

- Severity: `High`
- Classification: `Checklist finding` — tracing、错误日志、secret 与数据保护。
- Evidence:
  - `server/common/middleware/src/trace/trace_log.rs:46-57` 在 INFO 级记录完整请求 headers；`90-101` 记录完整响应 headers。
  - `server/common/middleware/src/graphql_trace.rs:42-47` 记录展开 variables 后的 operation；`95-98` 记录完整成功 response data。
  - `server/packages/auth/src/middleware.rs:14-20` debug 输出完整 Thrift 请求和响应；`server/common/thrift/idl/auth.thrift:3-15` 的请求含 username/password，响应可含 token。
  - `server/packages/login/src/main.rs:23-30`、`server/packages/bookmarks/src/main.rs:27-35`、`server/packages/collections/src/main.rs:27-35` 在实际服务中启用这些 middleware/subscriber。
- Impact: Authorization、Cookie、Set-Cookie、WebAuthn 状态、收藏内容、评论、GraphQL variables/data 和包含密码的 JWT 会进入日志，使日志成为第二个敏感数据存储。
- Validation: 记录语句、middleware 安装点和 IDL 字段交叉确认。
- Suggested boundary: 建议与 RF-002 协调，但日志脱敏、级别和数据保留可独立跟踪。

### RF-005：内部错误 source 被发给前端并直接展示或写入浏览器日志

- Severity: `High`
- Classification: `Checklist finding` — 安全错误合同、前端错误映射。
- Evidence:
  - `server/packages/bookmarks/src/errors.rs:48-93,223-234` 和 `server/packages/collections/src/errors.rs:36-74,173-184` 把 Diesel、Thrift、reqwest、env 等原始错误或完整 Debug 放进 message/`extensions.source`。
  - `web/common/custom-graphql/src/index.tsx:34-57` 把服务端 message 直接 toast 给用户，并把 locations、path、`extensions.source` 写入 console。
  - `web/packages/portal/src/features/Auth/service.ts:8-24,37-43` 同样直接展示认证响应 message。
- Impact: 数据库 constraint/table、下游 URL、内部类型、配置名、schema path/source 和其他诊断上下文可能到达用户界面或浏览器日志；同时没有稳定、安全、可翻译的 error code 到用户文案映射。
- Validation: 后端序列化边界与前端消费路径静态追踪。
- Suggested boundary: 建议建立跨 HTTP/GraphQL/Thrift/前端的统一错误合同，具体合同设计留待后续计划。

### RF-006：WebAuthn credential 与 ceremony state 只存在单进程内存且缺少生命周期保护

- Severity: `High`
- Classification: `Checklist finding` — WebAuthn、session、超时、速率限制。
- Evidence:
  - `server/packages/login/src/router/webauthn.rs:31-38` 把用户、passkey、auth token 和两类 ceremony state 全放在单个进程内 `HashMap`/mutex。
  - `server/packages/login/src/router/webauthn.rs:80-91,152-169` 只有 set/take，没有创建时间、TTL 或定期清理。
  - `server/packages/login/src/router/webauthn.rs:197-208` 的 session cookie 缺少 `Secure`。
  - `server/packages/login/src/router/webauthn.rs:320-347` 可反复为已知 username 建立认证 state；`server/packages/login/src/router.rs:8-20` 未安装 rate limit。
- Impact: 服务重启会丢失全部已注册 passkey，多副本之间状态不一致，放弃的 ceremony 可无限增长内存；HTTP 首跳可能发送 session cookie，登录入口还可能被滥用或用于枚举。
- Validation: state owner、读写路径、cookie 构造和 router middleware 静态确认。
- Suggested boundary: 独立 WebAuthn/session 生命周期 Issue 候选。

### RF-007：credentialed CORS 的 suffix 判断扩大了可信域

- Severity: `Medium`
- Classification: `Checklist finding` — middleware、CORS、origin validation。
- Evidence:
  - `server/common/middleware/src/cors.rs:13-20` 允许 credentials 和 Authorization。
  - `server/common/middleware/src/cors.rs:43-50` 仅使用 `ends_with("sushao.top")` 判断 host。
  - `server/common/middleware/src/cors.rs:73-120` 的测试没有覆盖域名 label 边界反例。
- Impact: `https://attacksushao.top` 这类并非 `sushao.top` 子域的 origin 仍会通过检查，扩大跨域信任范围。
- Validation: matcher 对反例的字符串语义可直接确定。
- Suggested boundary: 可作为 middleware/security 修复单独处理，并补 exact-domain/subdomain 边界测试。

## B. 请求链路、数据库与状态一致性

### RF-008：同步数据库操作阻塞 Tokio，连接还会跨外部网络等待持有

- Severity: `High`
- Classification: `Checklist finding` — async runtime、连接池、资源生命周期。
- Evidence:
  - `server/packages/bookmarks/src/model.rs:26-33`、`server/packages/collections/src/model.rs:15-22` 使用同步 `PgConnection` + r2d2。
  - `server/packages/bookmarks/src/graphql/query.rs:31-44`、`server/packages/collections/src/graphql/query.rs:23-36` 在 async resolver 中直接 checkout 并运行同步 Diesel query，没有 blocking 隔离。
  - `server/packages/bookmarks/src/graphql/mutation.rs:213-229` 先取得 connection，再调用 crawler `.await`。
  - `server/packages/bookmarks/src/service/novel.rs:237-266`、`server/packages/bookmarks/src/service/author.rs:144-190` 在持有 connection 时等待多次外部 HTTP。
- Impact: 数据库变慢、连接池等待或外站慢响应会同时阻塞 Tokio worker 并占满连接池，使无关请求级联超时。
- Validation: pool 类型、resolver 执行上下文和 connection 生命周期静态追踪。
- Suggested boundary: 独立后端数据访问/async 架构 Issue 候选；不能只在个别 resolver 加局部补丁。

### RF-009：N+1、重复认证 RPC 与无复杂度上限形成客户端可控的负载放大

- Severity: `High`
- Classification: `Checklist finding` — GraphQL N+1、服务依赖、DoS。
- Evidence:
  - `server/packages/bookmarks/src/service/novel.rs:47-159` 为 author、tags、chapters、word count、首尾章节、collections、read percentage、comments 等字段分别 checkout/query。
  - `web/packages/bookmarks/src/features/Author/Details/index.tsx:37-56` 对列表中每本 novel 同时选择 `lastChapter`、`firstChapter`、`wordCount`，会形成至少 `3N` 额外查询。
  - `server/packages/bookmarks/src/graphql/guard.rs:20-46`、`server/packages/collections/src/graphql/guard.rs:20-46` 为每个 guarded root field 获取 client 并执行 auth RPC。
  - `server/common/thrift/src/lib.rs:8-15` 合理承载生成合同，但 `17-35` 又把具体 Volo client、同步 DNS 和 Compose 专属 `auth:80` discovery 合并进同一个 public facade；每次 `get_client()` 都重新解析并构建 client。
  - `server/packages/login/src/router/login.rs:36-47`、`router/webauthn.rs:238-249` 也由 transport handler 直接调用该 factory，说明问题不只存在于 GraphQL guard。
  - `server/packages/bookmarks/src/graphql.rs:23-29`、`server/packages/collections/src/graphql.rs:24-30` 没有 depth/complexity 限制；两个服务还无条件提供 GraphQL playground GET route。
- Impact: 客户端可通过对象数量、子字段和 root alias 同时放大 SQL、pool checkout、DNS 和 auth RPC；调用方还无法注入 endpoint、复用 client 或替换 mock adapter，RF-008 的同步执行会进一步扩大可用性风险。
- Validation: 代表性 operation 到 resolver/guard/client 的端到端链路追踪。
- Suggested boundary: 独立 GraphQL 请求成本与认证上下文 Issue 候选；后续设计需同时划分生成 RPC contract、client 生命周期和 service discovery 的 owner。

### RF-010：Novel/Author 删除顺序违反现有外键

- Severity: `High`
- Classification: `Checklist finding` — transaction、referential integrity。
- Evidence:
  - `server/packages/bookmarks/src/service/novel.rs:219-224` 先删 `novel`，再删 `collection_novel`。
  - `server/packages/bookmarks/src/service/author.rs:124-130` 先删 author/novels，最后才删 collection relation。
  - `server/packages/bookmarks/migrations/2022-05-27-154358_create_table/up.sql:68-98` 对 `collection_novel`、`read_record` 和 `novel_comment` 使用非级联外键。
  - `server/packages/bookmarks/src/service/novel.rs:244-263` crawler 删除 chapter 前也没有清理相应 read records。
- Impact: 小说一旦属于 collection、有阅读记录或评论，公开 delete mutation 会在第一条 DELETE 触发 FK violation 并失败；作者删除和 crawler 删除已读章节也有相同问题。
- Validation: mutation 顺序与 migration FK 定义交叉确认。
- Suggested boundary: 数据完整性修复，可与相关 transaction 测试一起独立跟踪。

### RF-011：Collection 更新可制造环并使 path 永久漂移

- Severity: `High`
- Classification: `Checklist finding` — hierarchical invariant、循环 DB 访问。
- Evidence:
  - `server/packages/bookmarks/src/graphql/mutation.rs:64-82` 允许任意 `parent_id`。
  - `server/packages/bookmarks/src/service/collection.rs:163-177,191-211` 只验证 parent 存在，不拒绝自己或后代；ancestor 查询沿 parent 逐条查库且没有 visited 集合。
  - `server/packages/bookmarks/src/model/collection.rs:97-110` 更新 name/parent 时不更新自身 `path`。
  - `server/packages/bookmarks/src/service/utils.rs:3-12` 的子树递归遇到环不会终止。
  - `server/packages/collections/src/service/collection.rs:168-202` 只更新当前节点 path，不同步 descendants。
- Impact: 合法 mutation 可写出自环或祖先环，随后造成无限 DB 循环或递归栈溢出；重命名/移动还会使当前节点或后代 path 与实际层级不一致。
- Validation: mutation 输入、更新逻辑和遍历终止条件交叉确认。
- Suggested boundary: 独立层级数据 invariant/迁移 Issue 候选，需要先决定 path 是否为事实源或派生值。

### RF-012：Item 编辑会静默丢弃 collectionIds 修改并存在异步回填竞态

- Severity: `High`
- Classification: `Checklist finding` — 前端表单、mutation、请求数据流。
- Evidence:
  - `web/packages/collections/src/features/Item/Components/ItemForm.tsx:68-73` 提供可编辑 `collectionIds`。
  - `web/packages/collections/src/features/Collection/components/Actions.tsx:49-56,74-76` 和 `web/packages/collections/src/features/Item/Details/index.tsx:51-53` 提交时只发送 `name/content`，`UpdateItem` 没有 `collectionIds` 参数。
  - `web/packages/collections/src/features/Collection/components/Actions.tsx:96-103` 在详情请求完成前打开编辑器；虽然 `120-128` 传入 `loading`，`ItemForm.tsx:24-40` 不消费该 prop，回填也遗漏 `collectionIds`。
- Impact: 用户修改“匹配集合”后提交会静默丢失；从列表编辑已有 Item 时先看到空白/旧表单，还可能在数据返回前提交错误值。
- Validation: UI 字段 → submit callback → GraphQL variables 的完整链路静态确认。
- Suggested boundary: 这是独立可复现功能 bug，应在架构重构前也保持单独可追踪。

### RF-013：部分分页先全表加载，部分 SQL 分页没有稳定排序

- Severity: `Medium`
- Classification: `Checklist finding` — 数据库查询、分页、资源上限。
- Evidence:
  - `server/packages/bookmarks/src/service/novel.rs:272-343,494-545` 先加载全部 novel/关系，再在内存 `skip/take/cloned`。
  - `server/packages/collections/src/service/item.rs:109-175,313-354` 先加载包含完整 `content` 的全部 item，再过滤/复制当前页。
  - `server/packages/collections/src/model/collection.rs:168-237`、`server/packages/collections/src/model/item.rs:110-149` 的 offset/limit 分支没有 `ORDER BY`。
  - `server/packages/bookmarks/src/model/tag.rs:98-104`、`server/packages/bookmarks/src/model/author.rs:75-110` 也在无排序条件下分页。
- Impact: 请求成本随全表大小增长；并发写入或执行计划变化时，同一页可能重复、遗漏或顺序漂移。
- Validation: query 构造与 runner 分页位置静态确认。
- Suggested boundary: 可按共用分页合同统一跟踪，不应逐 resolver 零散修补。

### RF-014：Apollo client 生命周期、缓存和错误状态策略相互冲突

- Severity: `Medium`
- Classification: `Checklist finding` — 前端请求、cache/store 权威、错误恢复。
- Evidence:
  - `web/packages/collections/src/App.tsx:12-16` 在 render 中调用 `getClient()`；`web/common/custom-graphql/src/index.tsx:82-90` 每次都 `new ApolloClient`。
  - bookmarks 则在 `web/packages/bookmarks/src/utils/apolloClient.ts:1-3` 使用模块级单例，两个应用生命周期规则不一致。
  - `web/common/custom-graphql/src/index.tsx:71-86` 全局使用 `no-cache`，同时让 `watchQuery` 的 GraphQL errors 被 `errorPolicy: 'ignore'` 隐藏。
  - `web/packages/collections/src/features/Collection/collectionSlice.ts:65-109` 又把服务端集合复制到 Zustand，并自行维护 init/loading/error/refetch。
- Impact: App 重渲染可替换 client/cache/link，丢失 in-flight、observer 和 cache 状态；Apollo 与 Zustand 成为重复状态源，hook 还无法稳定表达错误和恢复状态。
- Validation: client 创建点、default options 和集合 store 消费链路静态确认。
- Suggested boundary: 建议先确定每类服务端状态唯一 owner，再设计 client 生命周期与 invalidation；本轮不预设具体方案。

### RF-015：列表和嵌套 GraphQL operation 存在明确 overfetch

- Severity: `Medium`
- Classification: `Checklist finding` — GraphQL operation 字段最小化。
- Evidence:
  - `web/packages/collections/src/features/Item/List/index.tsx:30-43` 为每行请求 `content`，表格 `68-114` 只消费 id/name/createTime/updateTime。
  - `web/packages/collections/src/features/Collection/collectionSlice.ts:16-28` 请求 create/update/description，选择器 `components/CollectionSelect/index.tsx:29-75` 只需要 path/id/children。
  - `web/packages/bookmarks/src/features/Author/Fetch/index.tsx:46-80` 为 novel/chapter/tag 获取多组字段，保存转换 `utils.ts:10-33` 并未消费其中一部分。
  - `web/packages/bookmarks/src/features/Novel/Details/index.tsx:35-40` 和 Novel list operation 还存在复制留下的重复字段。
- Impact: 全量集合、列表大文本和作者全书章节场景的 payload 随数据规模不必要放大，并加重 RF-009 的服务器成本。
- Validation: operation selection set 与渲染/转换消费者逐项比对。
- Suggested boundary: 可在前端请求合同整理中处理，并为 operation 字段消费建立测试或检查。

### RF-016：WebAuthn、表单校验和页面错误状态存在静默失败路径

- Severity: `High`
- Classification: `Checklist finding` — 网络/操作失败通知与用户恢复。
- Evidence:
  - `web/packages/portal/src/features/Auth/index.tsx:51-79` 连续 await WebAuthn 注册/登录流程但没有 try/catch；浏览器正常取消会 reject，不会进入 `res === null` 分支。
  - `web/packages/portal/src/features/Auth/service.ts:8-24` 的 `responseThen` 调用 async callback 时既不 return 也不 await，使 rejection 脱离原 promise chain。
  - login form 使用 `noValidate`，但 `web/packages/portal/src/features/Auth/index.tsx:24-25,87-102` 没有渲染 RHF 字段错误。
  - `web/packages/collections/src/features/Item/Components/ItemForm.tsx:32-40,62-80,111-119` 和 `features/Collection/components/CollectionForm.tsx:17-24,37-58` 声明 required/validator，却不显示 `formState.errors`。
  - 全局 Apollo ErrorLink 会 toast GraphQL/network error，但 `errorPolicy: 'ignore'` 和页面只消费 data/loading 的模式使请求失败后常只剩空白内容，没有持久 error state 或明确 retry。
- Impact: 登录/注册取消、浏览器拒绝、转换失败或字段校验失败时可能出现未处理 Promise 或“点击无反应”；短暂 toast 也无法支撑页面级恢复。
- Validation: 失败分支、promise 传播和 error state 渲染静态确认。
- Suggested boundary: WebAuthn promise 问题应作为认证 bug 优先处理；通用表单/页面错误合同可另行归并。

### RF-017：login REST 错误始终返回 200，`code` JSON 形态不稳定

- Severity: `Medium`
- Classification: `Checklist finding` — HTTP transport 与稳定错误身份。
- Evidence:
  - `server/packages/login/src/errors.rs:27-63` 的 `OpenError` 同时包含 unit 和带 String 的 tuple variant。
  - `server/packages/login/src/errors/response.rs:13-24` 直接把整个 enum 序列化到 `code`。
  - `server/packages/login/src/errors.rs:118-131` 所有错误只返回 `Json(...)`，未设置 HTTP status。
- Impact: `code` 有时是字符串、有时是对象，客户端和监控无法依赖稳定 schema；认证失败也被网络层视为 HTTP 200。
- Validation: enum serde 形态与 `IntoResponse` 返回类型静态确认。
- Suggested boundary: 应与 RF-005 的跨 transport 错误合同共同决策。

## C. Package、模块与所有权边界

### RF-018：frontend workspace 存在 manifest 未声明的反向依赖和逻辑环

- Severity: `High`
- Classification: `Checklist finding` — workspace、public API、依赖方向。
- Evidence:
  - 根 `tsconfig.json:19-22` 把 `@portal`、`@bookmarks`、`@collections` 的整个 `src` 暴露为 alias，`web/packages/portal/vite.config.ts:47-49` 又在运行时启用这些 alias；package exports 和 manifest 无法限制跨包 deep import。
  - 合理组合边是 `web/packages/portal/src/micro/index.ts:1-4` 通过 bare package root 导入 bookmarks/collections；实际反向与 peer 边却包括 common → portal/collections、bookmarks ↔ collections，以及 feature/common → portal internals。
  - 代表性反向边见 `web/common/i18n/src/I18nDrawerItem.tsx:8-21`、`common/custom-table/src/TablePagination.tsx:1-16`、`common/edit/src/index.tsx:13`、`packages/collections/src/components/CustomEdit.tsx:1-2`、`packages/bookmarks/src/features/Novel/Details/components/CommentEdit.tsx:4-5`。
  - `useDialog` 由 collections 拥有却被 common、portal、bookmarks 使用；`useTitle` 由 bookmarks 拥有却被 portal、collections 使用，通用能力 owner 错置。
  - 实际 package 图中 portal、bookmarks、collections、i18n、custom-table、details、edit 构成强连通 ownership 区域；`knip --cycles` 没发现文件级 ESM 环，因此这里准确记录为 package/owner 逻辑环。
  - `pnpm exec knip --dependencies --strict --no-exit-code` 报告根 13 个 runtime dependency 未被根入口使用、子 workspace 有 262 个 unlisted import 报告点；bookmarks、collections、portal 及多个 common package 都依赖根 hoist 才能通过，而各自 manifest 不是实际依赖事实源。
- Impact: package 无法独立安装、构建、测试或复用，依赖漏洞和变更 owner 也无法从 manifest 判断；修改 portal UI、collections hook 或 bookmarks hook 会穿透多个本应无关的 workspace。普通 knip、typecheck 与 Vite 构建仍会因根依赖和 alias 而通过，不能阻止继续扩大错误边。
- Validation: manifest、alias、Vite resolution、实际 import graph 和 strict Knip 交叉比对。
- Suggested boundary: 独立前端 workspace/目录契约 Issue 候选；后续应先定义允许的依赖方向和 public API，再决定目录移动。

### RF-019：collection 子系统被跨应用复制并已发生行为漂移

- Severity: `Medium`
- Classification: `Checklist finding` — 重复模块、组件所有权、共享边界。
- Evidence:
  - bookmarks 与 collections 的 `collectionSlice.ts`、CollectionSelect、CollectionMultiSelect 和 tree utils 大量成对复制。
  - 两个 package 的顶层 CollectionSelect/CollectionMultiSelect 又分别 deep import 自己 collection feature 的 slice 和 tree utils，没有稳定的 collection public API。
  - `web/packages/bookmarks/src/features/Novel/Details/components/AddCollection.tsx:3` 等 Novel feature 也直接读取 Collections feature 内部 slice。
  - `web/packages/bookmarks/src/components/CollectionSelect/index.tsx:50-57` 再次选择同项会清空；`web/packages/collections/src/components/CollectionSelect/index.tsx:50-53` 始终保留选择。
  - `web/packages/bookmarks/src/features/Collections/components/CollectionForm.tsx:42-49` 有 Valibot resolver/error UI；`web/packages/collections/src/features/Collection/components/CollectionForm.tsx:17-24,37-59` 缺少相同验证和反馈。
- Impact: 同一领域行为由两个 app 各自维护，已经出现用户可见差异；修复验证、错误或安全问题时容易只改一份。
- Validation: 成对实现和 consumer 行为逐项比对。
- Suggested boundary: 与 RF-018 一起确定 collection 领域 owner；不能只用机械抽公共组件掩盖领域边界问题。

### RF-020：后端 transport、application 和 persistence 边界坍塌并形成反向依赖

- Severity: `Medium`
- Classification: `Checklist finding` — 后端调用方向、数据库 facade、同层依赖和最小可见性。
- Evidence:
  - bookmarks root resolver 有 30 处、collections 有 13 处 `Context::data::<PgPool>()`；例如 `server/packages/bookmarks/src/graphql/query.rs:35-43`、`graphql/mutation.rs:33-47` 和 `server/packages/collections/src/graphql/query.rs:27-35`。resolver 负责 checkout connection，service facade 还分别暴露 33 个和 14 个 `&mut PgConnection` 参数。
  - bookmarks 的 `service/novel.rs:21-31,47-159` 等类型同时是 GraphQL object/resolver、业务 service 和数据库调用方；`Novel -> Author/Tag/Chapter/Collection`、`Chapter -> Novel/Author` 因此成为未登记的同层 service 调用。
  - collections 已形成真实反向环：`graphql/types/output.rs:3-8` 依赖 service，`service/collection.rs:6-10,206-215` 和 `service/item.rs:7-9,225-232` 又依赖 GraphQL types，`model/collection.rs:2-5`、`model/item.rs:1` 进一步反向依赖 GraphQL input。
  - bookmarks persistence model 又依赖 sibling `NovelModel` 和 crawler trait/type，见 `model/chapter.rs:8-10,403-417`、`model/novel.rs:13,226-287`；数据库 enum 在 `model/schema/custom_type.rs:8,23-25,93-95` 直接成为 GraphQL contract。
  - auth 的 `utils/env.rs:10-20` 和 `utils.rs:10,36-74` 直接返回/使用生成的 `thrift::auth::AuthErrorCode`，使配置和 credential/JWT 逻辑反向依赖 transport enum，再由 `service.rs:18-69` 消费。
  - collections 的 `collection_item` 写 owner 同时存在于 `model/collection_item.rs:16-97` 与 `model/item.rs:77-95`；两个 binary crate 又把全部 model module 暴露为 `pub(crate)`，当前平级目录无法表达“只对唯一 service owner 可见”。
  - 两服务的 `graphql/guard.rs`、`router/graphql/post.rs`、`graphql/validator/dir_name.rs` 以及大部分 `errors.rs` 是相同 plumbing 的复制。
- Impact: transport 可以直接取得数据库/adapter，业务规则难以脱离 async-graphql、Thrift 生成类型和真实 PgConnection 测试；同层 owner、relation 写入 owner 与最小可见性无法由目录或 Rust privacy 保证，认证、错误安全和请求 context 修复还必须在多个服务重复完成。
- Validation: module/use graph、公开签名、Context/connection 获取、真实消费者和重复文件交叉比对。
- Suggested boundary: 独立后端应用目录/依赖契约 Issue 候选；应优先划清 transport、application/domain、repository/adapter 边界，再选择函数、trait 或共享 crate。

### RF-021：前端服务地址和生产域名散落硬编码

- Severity: `Medium`
- Classification: `Checklist finding` — 配置 owner、服务发现、环境一致性。
- Evidence:
  - `web/packages/collections/src/App.tsx:14` 和 `web/packages/bookmarks/src/utils/apolloClient.ts:3` 各自硬编码 GraphQL URL。
  - `web/packages/portal/src/features/Auth/service.ts:59,91,115,136,161` 分散硬编码认证 endpoint。
  - `web/packages/bookmarks/src/utils/image.ts:8-16` 硬编码图片代理 host。
  - `web/packages/portal/vite.config.ts:13-18,50-60` 硬编码 base、origin 和 HMR 域名。
- Impact: local、staging、自托管和域名切换需要改源码；请求路由和环境所有权散落在多个 feature，容易出现前后端/部署漂移。
- Validation: endpoint/config 字符串和构建配置搜索确认。
- Suggested boundary: 可作为前端 runtime/build-time 配置合同独立整理；具体注入方式留待后续设计。

## D. 前端组件、性能与用户界面

### RF-022：所有业务路由、Monaco 和 Prism 进入首包

- Severity: `Medium`
- Classification: `Checklist finding` — 前端组件边界、构建和资源成本。
- Evidence:
  - `web/packages/portal/src/micro/index.ts:1-4` 静态导入 bookmarks/collections 应用。
  - `web/packages/collections/src/main.tsx:8-14,34-49` 静态导入所有详情路由。
  - `web/common/edit/src/index.tsx:10-13`、`edit/src/init.ts:8-18` 静态引入 Monaco/editor worker。
  - `web/packages/collections/src/components/Markdown/init.ts:10-34` 静态注册 21 个 Prism language。
  - 本轮 `pnpm build` 产出 main JS `5,058.65 kB`（gzip `1,366.67 kB`），并报告 `6,895.07 kB` 的 TypeScript worker 和多个超大 chunk。
- Impact: 登录页和首页也承担所有业务页面、编辑器和高亮器的下载、解析和初始化成本；功能增长会继续线性扩大首包。
- Validation: 静态 import chain 与实际 Vite build 产物共同确认。
- Suggested boundary: 独立前端加载边界/路由分包 Issue 候选，需用实际场景和 bundle gate 验证。

### RF-023：破坏性操作无确认，且存在非法交互嵌套和无可访问名称控件

- Severity: `Medium`
- Classification: `Additional finding` — 清单覆盖了操作反馈和可访问性，但没有单独列出破坏性操作防误触合同。
- Evidence:
  - novel、author、collection 和 item 删除均在单击后立即执行，例如 `web/packages/bookmarks/src/features/Novel/List/index.tsx:153-164`、`Author/List/index.tsx:124-136`、`web/packages/collections/src/features/Collection/components/Actions.tsx:82-93`、`Item/Details/index.tsx:55-59,93-95`。
  - `web/packages/collections/src/features/Collection/components/Name.tsx:5-17`、Item/Novel/Author list 多处生成 `<button><a/></button>` 的嵌套交互元素。
  - `web/packages/collections/src/features/Item/Details/index.tsx:62-95` 等多处 icon-only Button 没有 `aria-label`、`sr-only` 或 Tooltip；部分 Avatar 没有 AvatarFallback。
- Impact: 一次误点即可触发不可逆删除；非法嵌套会产生双焦点和不一致键盘语义，读屏器也无法识别多个图标操作。
- Validation: 事件绑定、DOM 组合和 accessibility name 静态检查。
- Suggested boundary: shadcn/ui 已有 AlertDialog、Button composition、Tooltip、AvatarFallback 等 primitive；这是“使用缺口”，不是已确认存在一套应整体删除的自维护 shadcn 替代组件。

### RF-024：用户可见文本、错误和可访问性文本仍绕过 i18n

- Severity: `Medium`
- Classification: `Checklist finding` — i18n 完整性。
- Evidence:
  - wildcard route 指向 ErrorPage：`web/packages/portal/src/components/AppRouter.tsx:50-60`；该页 `components/Error/index.tsx:4-16` 却硬编码 “No Projects Yet”，且语义并非 404。
  - `web/common/custom-table/src/TableActions.tsx:24-32` 的 “Open menu”、`portal/src/components/ui/spinner.tsx:4-5` 的 “Loading”、`portal/src/components/ui/dialog.tsx:57-64,93` 的 “Close” 均绕过 locale 资源。
  - `web/packages/portal/src/features/Auth/service.ts:13-24` 和 Auth 页面仍直接使用硬编码或服务端错误文本。
- Impact: 部分页面、错误和读屏文本无法随语言切换，错误合同也不能稳定映射为可翻译、可恢复的用户提示。
- Validation: 用户可见/ARIA 字符串与 locale key 使用点比对；现有 en/zh key 集合本身没有发现缺失，问题是字符串绕过资源。
- Suggested boundary: 可按 shared primitive、认证、错误页和业务页面分 owner 补齐；不要只做字符串搜索式替换而忽略错误身份。

### RF-025：生产路径 Proxy 会记录编辑器对象和内容

- Severity: `Medium`
- Classification: `Checklist finding` — secret/logging、运行时开销、条件分支。
- Evidence:
  - `web/packages/collections/src/components/CustomEdit.tsx:1,15-27` 用 bookmarks 的 `proxy` 包装编辑器 ref。
  - `web/packages/bookmarks/src/utils/proxy.ts:1-59` 在 get/apply/set 等所有 trap 中无环境判断地 `console.log` target、args 和 value，并递归创建 Proxy。
- Impact: 用户笔记/评论和编辑器对象可能进入浏览器控制台或日志采集系统；高频 ref 操作还会持续创建 Proxy 和输出日志。
- Validation: 实际 consumer 与每个 Proxy trap 的日志参数静态确认。
- Suggested boundary: 这是遗留 debug instrumentation，应与 RF-004/RF-005 的数据暴露边界协调处理。

### RF-026：`useTitle` 在 render 阶段写 `document.title`

- Severity: `Low`
- Classification: `Additional finding` — 清单没有单独列 React render purity，但该副作用有明确生命周期影响。
- Evidence:
  - `web/packages/bookmarks/src/hooks/useTitle.ts:3-12` 在 hook 执行期间直接修改 `document.title`，没有 effect。
  - 该 hook 又被 portal/collections 反向复用，放大了 owner 不清的问题。
- Impact: StrictMode 或中断/放弃的 render 也可能执行 DOM 写入，使标题短暂或最终对应未提交的 UI。
- Validation: hook 实现和 consumers 静态确认。
- Suggested boundary: 可随前端 common hook/public API 整理一并处理。

### RF-027：crawler trait 强制深复制完整章节列表

- Severity: `Low`
- Classification: `Checklist finding` — Rust 借用、clone、trait contract。
- Evidence:
  - `server/common/novel_crawler/src/novel.rs:15-27` 的 `chapters(&self)` 强制返回 owned `Vec<Self::Chapter>`。
  - `server/common/novel_crawler/src/implement/qidian/novel.rs:37-47,99-101` 和 `implement/jjwxc/novel.rs:50-60,109-111` 已持有 Vec 仍必须完整 clone。
  - `server/packages/bookmarks/src/service/author.rs:149-153` 的作者刷新会对每本小说触发复制，而调用方只读取数据。
- Impact: 作者及章节数量增长时，会复制所有章节结构和字符串，增加峰值内存；这是 API 所有权合同强制产生的成本。
- Validation: trait signature、实现和消费者用途交叉确认。
- Suggested boundary: 可在 crawler API 调整时处理；本轮未把轻量 pool/Arc/schema handle clone 误判为问题。

## E. 构建、部署、生成合同与可观测性

### RF-028：`xtask` 构建上下文和 Compose 签名会复制或暴露 secret

- Severity: `High`
- Classification: `Checklist finding` — secret、构建产物、服务最小权限。
- Evidence:
  - `server/common/xtask/src/context.rs:75-111` 打包整个仓库，只跳过根 `.git` 和 `target`，不遵循 `.dockerignore`。
  - `server/common/xtask/src/tasks/build.rs:22-25,55-58` 把该 tar 发给 Docker；server Dockerfile 使用 `COPY ./ /app`。
  - 仓库允许本地存在 `docker/compose/.env` 和 `docker/compose/certs`，其中可包含 secret/证书。
  - `server/common/xtask/src/tasks/compose.rs:35-58` 全量读取 `.env`；`tasks/compose/container.rs:92-104,173-176` 将其注入每个容器。
  - `container.rs:263-302` 还把完整 `KEY=value` 拼进 `self-tools.compose.signature` label。
- Impact: secret 可进入 Docker build context/缓存；gateway、前端代理等不需要数据库或认证 secret 的容器也会得到全部环境变量，值还能被 `docker inspect` 从 label 读取。
- Validation: context 过滤、Docker build body、container env 和 signature 构造交叉确认。
- Suggested boundary: 独立 xtask/secret 管理 Issue 候选；构建上下文与运行时 secret 最小权限都需要覆盖。

### RF-029：部署缺少 migration、readiness、版本和网络安全合同

- Severity: `High`
- Classification: `Checklist finding` — Docker、Compose、数据库发布和服务拓扑。
- Evidence:
  - `server/README.md:74-90` 明确当前服务启动不自动执行 migration；各 final image 只包含服务 binary，`docker/compose/docker-compose.yml` 也没有 migration job/gate。
  - `docker/compose/docker-compose.yml:17-27` 对持久化数据库使用 `postgres:latest`。
  - 同文件 `19-20` 使用 `5432:5432`；`server/common/xtask/src/tasks/compose/container.rs:106-117` 又明确绑定 `0.0.0.0`。
  - Compose 只有 `depends_on` 启动顺序，没有 healthcheck；`server/common/xtask/src/tasks/compose.rs:60-68` 创建/启动完容器即返回成功，不等待依赖 ready。
  - bookmarks/collections 实际监听 `8080`，Dockerfile 却 `EXPOSE 80`；gateway 实际使用 80/443，Dockerfile 只声明 80。虽然 `EXPOSE` 只是元数据，但会误导不经过当前 Compose 的 image consumer。
- Impact: 应用和 schema 可不兼容地发布；数据库大版本可能随镜像更新意外改变；数据库默认暴露到所有宿主接口；容器“running”会被误报为服务 ready，且镜像端口元数据与事实源不一致。
- Validation: README、binary/Dockerfile、Compose 与 xtask 生命周期交叉确认；本轮未启动 Docker 验证真实环境防火墙。
- Suggested boundary: 至少涉及数据库发布合同、network exposure 和 readiness 三个可独立讨论的子边界，是否拆 Issue 留待问题确认阶段。

### RF-030：CI 未覆盖共享 GraphQL 源、生产前端构建和 schema 漂移

- Severity: `High`
- Classification: `Checklist finding` — workspace 依赖、生成链路、发布 gate。
- Evidence:
  - `server/packages/bookmarks/Cargo.toml:26`、`server/packages/collections/Cargo.toml:17` 都依赖 `graphql-common`。
  - `.github/workflows/bookmarks.yaml:6-15` 和 `collections.yaml:6-14` 的 path filters 均遗漏 `server/common/graphql-common/**`，其改动不会触发消费者镜像。
  - `web/packages/bookmarks/codegen.ts:4`、`web/packages/collections/codegen.ts:4` 从仓库内 `schema.graphql` 生成客户端；server schema build 路径没有导出/比较 SDL 的 CI gate。
  - `.github/workflows/ci.yaml:23-26` 只运行 `pnpm lint` 和 `pnpm test`，没有 `pnpm build`；本轮实际 build 已出现超大 chunk 警告。
- Impact: shared GraphQL 代码变更可能合入但不发布新消费者镜像；服务 schema、快照和生成客户端可以漂移；只有生产 bundle 阶段暴露的问题与体积退化不会阻止 PR。
- Validation: consumer manifest、workflow filter、codegen source 和 CI commands 交叉确认。
- Suggested boundary: 建议作为 CI/生成合同独立跟踪，明确哪些事实源变化必须触发哪些消费者和产物。

### RF-031：当前 trace 只是字符串关联，失败与父子关系记录不完整

- Severity: `Medium`
- Classification: `Checklist finding` — trace ID 传播、span/error 记录。
- Evidence:
  - `server/common/middleware/src/trace/trace_log.rs:90-102` 在 inner future 返回 `Err` 时通过 `?` 提前退出，没有 completion/error event；成功取得的 5xx 仍按 INFO。
  - `server/packages/gateway/src/proxy.rs:359-385` 只在 Pingora 返回 error 时记录 ERROR，upstream 5xx 仍走正常响应日志。
  - `server/packages/gateway/src/proxy.rs:203-225,290-295` 和 `server/common/middleware/src/trace/trace_id.rs:96-113` 原样复用传入 `traceparent`，没有为新的 hop 建立 parent/child span。
  - `server/packages/gateway/src/proxy.rs:61-178` 与 `server/common/middleware/src/trace/trace_id.rs:13-195` 分别重复维护 header 名、`traceparent` 校验、trace ID 提取、随机 ID 和 request ID 字符规则；框架 wrapper 不同，但纯协议事实源没有统一 owner。
  - `server/packages/bookmarks/src/graphql/guard.rs:40-45` 进入 Thrift 时只传 trace ID 字符串，没有标准 trace context。
- Impact: transport error 可能没有结束事件，5xx 无法可靠告警；gateway、HTTP、GraphQL 和 Thrift 之间只能按字符串人工搜索，不能还原标准父子调用链。W3C 校验、兼容 header 或 ID 规则还必须同步修改两份实现，任一侧漂移都会让同一请求采用不同身份。
- Validation: trace header、span 字段和成功/失败控制流静态追踪。
- Suggested boundary: 独立 observability/tracing Issue 候选；应先定义 trace ID、span ID、request ID 各自语义。

### RF-032：关键路径缺少测试，crawler 测试又依赖真实公网

- Severity: `Medium`
- Classification: `Checklist finding` — 测试覆盖、隔离和可重复性。
- Evidence:
  - 前端只有 `web/common/time/src/format.test.ts`；本轮 `pnpm test` 实际只运行 1 个文件、3 个测试。
  - auth、login 为 0 tests；bookmarks 仅 3 个测试，collections 仅 1 个 validator test。
  - 认证状态机/WebAuthn、Apollo link/error policy、集合树/状态、表单失败、JWT、auth guard、错误映射、tracing、transaction/FK 和分页 invariant 均无针对性测试。
  - `server/common/novel_crawler/src/implement/qidian/author.rs:117-121`、`qidian/novel.rs:257-262`、`jjwxc/author.rs:119-125`、`jjwxc/novel.rs:283-291` 的测试直接访问真实站点。
  - 本轮 `cargo test --workspace` 已因上述 4 个公网测试返回“网络错误”而失败。
- Impact: 最关键的安全、数据和请求状态没有回归保护；workspace suite 还会因网络或第三方页面变化随机失败，无法成为可靠发布 gate。
- Validation: 测试文件/符号盘点和实际 test command 结果共同确认。
- Suggested boundary: 测试不是单独追求覆盖率；应随各 finding 补其 invariant，并另行收敛公网 crawler 测试为可重复 fixture/受控集成测试。

## F. 第 4 节专项复审新增问题

### RF-033：Collection 与 Item feature 双向依赖且 Item operation owner 错置

- Severity: `Medium`
- Classification: `Checklist finding` — 前端同层调用、feature owner 和 public API。
- Evidence:
  - `web/packages/collections/src/features/Collection/components/Actions.tsx:6` 从 sibling Item feature 导入 `ItemForm`，但同一文件在 `21-27,49-57` 定义并导出 `DeleteItem`、`UpdateItem`。
  - `web/packages/collections/src/features/Item/List/index.tsx:19,23` 反向 deep import Collection feature 的 `DeleteItem` 和 `CreateItemButton`。
  - `web/packages/collections/src/features/Item/Details/index.tsx:12` 反向导入 `DeleteItem`、`UpdateItem`。
  - `web/packages/collections/src/features/Collection/components/CreateItemButton.tsx:1` 又依赖 Item feature 的表单，形成 `Collection -> Item -> Collection` 的 peer feature 边。
- Impact: Item mutation、表单和页面没有单一 owner，也没有 feature public entry；修改 Item operation 或表单必须进入 Collection internals，无法对两个 feature 独立测试、替换或收敛依赖。
- Validation: collections 内 feature import graph、operation 定义和消费者逐项追踪；RF-012 记录具体数据丢失 bug，本文记录其独立的结构边界。
- Suggested boundary: 先确定 Item、Collection 和跨两者的上层 composition owner，再决定 operation/form/action 的落点；不能仅用 barrel 掩盖现有双向边。

### RF-034：前后端公开面和 manifest 留有无消费者合同

- Severity: `Low`
- Classification: `Checklist finding` — public surface、最小可见性、dead code 和依赖声明。
- Evidence:
  - `pnpm exec knip --exports --include-entry-exports --no-exit-code` 确认 5 个无 package consumer 的 value export：`custom-table/src/index.tsx:105` 的 `TablePagination` public re-export、`107` 的 `getFilteredRowModel/getPaginationRowModel`，以及 `i18n/src/index.tsx:51,53` 指向同一实现且均无消费者的 `i18next/i18n`。
  - 同一检查报告 9 个 unused exported type 报告点、6 个唯一名称；最明确的 dead type 是 `web/common/types/src/micro.ts:12-14` 的 `MicroState`，仓库内只有定义和 entry re-export。
  - `server/common/novel_crawler/src/chapter.rs:20-22` 的 public `ChapterDetail` 没有实现或消费者，却在 `novel_crawler/src/lib.rs:16` 被 root re-export。
  - `server/common/graphql-common/src/date_time.rs:5` 公开 tuple field，但跨 crate 消费者只使用标量及 `From` 转换；`paginate.rs:44-46` 的 public `Queryable::is_empty` 没有调用方。
  - binary-only 的 bookmarks/collections 仍有过宽可见性，例如 `collections/src/model/item.rs:204` 的 unrestricted `pub`、`bookmarks/src/model/read_record.rs:10-13` 只由本模块 constructor 设置却为 `pub` 的字段，以及只在自身 model 文件构造却为 crate-wide 的 `bookmarks/src/model/author.rs:162-169::NewAuthor`。
  - `server/packages/login/src/main.rs:18` 和 `server/packages/collections/src/graphql.rs:22` 分别声明只有换行、没有能力或消费者的 `middleware.rs`。
  - manifest 也保留无源码消费者的依赖/feature：`server/common/middleware/Cargo.toml:14,30` 的 `http-body`、`server/packages/login/Cargo.toml:34,36-37` 的直接 `url`/重复 dev Axum，以及 `login/Cargo.toml:33` 当前未序列化 ceremony state 却启用的 `danger-allow-state-serialisation`。
- Impact: 这些入口把内部实现、不存在的能力和不必要依赖伪装成稳定合同，增加漏洞/升级面并干扰后续开发者判断真实消费者；普通 clippy 和默认 knip 都会因 public/entry export 而漏报。
- Validation: entry-export Knip、`rg` consumer 搜索、Rust 有效祖先可见性、Cargo manifest 与源码 use/feature 行为交叉确认。
- Suggested boundary: 按真实消费者逐项缩小或删除，并为确实要保留的 registry/框架合同登记 owner；本轮没有把 64 个当前无消费者的本地 shadcn 子组件 export 机械判为问题，因为是否保留完整 registry API 仍需设计确认。

### RF-035：login router 吞并业务编排、状态存储和 RPC adapter

- Severity: `Medium`
- Classification: `Checklist finding` — 后端 transport/application 边界、同层调用和依赖注入。
- Evidence:
  - `server/packages/login/src/router/login.rs:26-50` 的 Axum handler 直接创建 Thrift client、构造生成请求并执行认证 RPC。
  - `server/packages/login/src/router/webauthn.rs:31-170` 在 router module 内拥有 credential、auth token、ceremony state 和 mutex store；`211-382` 同时负责 WebAuthn 配置、cookie/HTTP response、RPC 鉴权和完整 ceremony 编排。
  - `router/webauthn.rs:1` 直接依赖 sibling `router/login.rs:21-25::LoginInput`，handler 之间没有稳定 request/application contract。
  - `server/packages/login/src/errors.rs:27-132` 的单一错误类型同时承担 Axum rejection、WebAuthn、Thrift、session/domain identity 和 HTTP response 映射。
- Impact: 状态存储、RPC client 和 WebAuthn use case 无法脱离 Axum handler 单独替换或测试；HTTP、认证流程和状态生命周期集中在同一 router 文件，RF-006/RF-017 的安全与错误合同修复都会继续扩大 transport owner。
- Validation: main/router composition、handler 调用、state owner、Thrift factory 和 error conversion 静态追踪。
- Suggested boundary: 独立 login application/state/adapter 边界 Issue 候选；具体拆分与持久化方案需在问题确认后设计，本轮不预设目录。

## 已检查但未确认问题

以下项目经过本轮检查，没有足够证据作为 finding；后续不应把它们误写成已确认问题：

- `server/` 下没有实际 `mod.rs`；只发现个别历史注释文字。
- 没有发现生产请求路径上的无条件 `panic!`、`todo!`、`unimplemented!` 或 `unsafe`。
- crawler 的静态 selector `unwrap` 来自固定 literal；当前可视为已知 invariant。xtask 的少量 `expect` 也对应固定仓库/拓扑 invariant。
- GraphQL pool 均在 schema 构建时创建一次，没有每请求重建 pool；raw pool 对 resolver 的暴露已经单独记录为 RF-020，不能据此把整个放置边界判为合理。
- 没有确认 Cargo crate 依赖环、运行时服务环或 common crate 反向依赖具体 service crate；也没有发现 model-to-model 方法调用。一个 use case 中 service 调多个 model 的合理边没有误报。
- `knip --cycles` 没有确认文件级 ESM circular import；RF-018 记录的是 manifest、package owner 和 deep import 形成的逻辑强连通区域。
- common package 的消费者都通过其 bare package root 导入，没有确认 `custom-table/foo`、`details/foo` 等绕过 common exports 的 deep import。
- 没有确认用户输入拼接 raw SQL 或当前 markdown 渲染 XSS。
- 没有把所有循环一概判为逐条 DB 操作；批量 draft/chapter/novel 写入中的 transaction 和 batch 路径存在，本文只记录已确认的 N+1/逐祖先查询和资源生命周期问题。
- 大多数 `PgPool`、`Arc`、schema handle clone 是轻量共享 handle 的合理 clone；只记录 RF-027 的强制深复制。
- 全局 Apollo ErrorLink 确实会对 GraphQL/protocol/network error 发 toast，因此不能笼统断言“所有请求都静默失败”；RF-016 只记录未覆盖的 WebAuthn、表单校验和页面恢复路径。
- en/zh locale 的现有 key 集合一致；i18n 问题来自硬编码文本绕过资源，而不是两份资源 key 集合已漂移。
- 没有发现适合机械替换为 `ts-pattern` 的复杂 `switch`/三元表达式；`proxy.ts` 的 `switch` 只是简单 `typeof` 分派，RF-025 的问题是调试日志和数据暴露，不是未使用 `ts-pattern`。
- 没有确认业务组件可被 shadcn/ui 整体等价替换；RF-023 确认的是已有 AlertDialog、Tooltip、AvatarFallback 和 Button composition 的使用缺口。entry-export 检查额外发现的 64 个当前无消费者 shadcn 子组件 export，也可能是有意保留的 registry API，未机械列为 RF-034。
- `edit` 暴露完整 Monaco editor ref，而当前消费者只调用 `focus()`；是否保留 escape hatch 属于 API 设计决定，证据不足以直接判为错误暴露。

本轮没有更新 `README.md` 中的实施计划，也没有新建额外 Issue。只有在用户确认本问题清单后，才进入设计、工作包和 Issue/分支拆分讨论。

## 本轮验证

| Command                                                           | Result                                                                                |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `pnpm lint`                                                       | 通过；包含 format check、oxlint、knip 和 typecheck。                                  |
| `pnpm test`                                                       | 通过；仅运行 1 个测试文件、3 个测试。                                                 |
| `pnpm build`                                                      | 通过；Vite 报告多个大于 500 kB 的 chunk，main JS 为 5,058.65 kB（gzip 1,366.67 kB）。 |
| `pnpm exec knip`                                                  | 通过；默认配置没有报告 entry public surface 和 workspace 严格依赖问题。               |
| `pnpm exec knip --dependencies --strict --no-exit-code`           | 复现 `Unused dependencies (13)`、`Unlisted dependencies (262)`，见 RF-018。           |
| `pnpm exec knip --exports --include-entry-exports --no-exit-code` | 复现 `Unused exports (5)`、`Unused exported types (9)`，见 RF-034。                   |
| `pnpm exec knip --cycles`                                         | 通过；未发现文件级 ESM circular import。                                              |
| `cargo metadata --no-deps --format-version 1`                     | 通过。                                                                                |
| `cargo clippy --all`                                              | 通过，无 warning。                                                                    |
| `cargo test --workspace`                                          | 失败；4 个依赖真实公网的 crawler test 均返回“网络错误”，详见 RF-032。                 |
| `pnpm exec oxfmt --check docs/dev/issue-94/review-findings.md`    | 通过。                                                                                |
| `git diff --check`                                                | 通过。                                                                                |

未执行完整 Docker/Compose 启动、真实数据库 migration 演练、真实浏览器 E2E、负载测试或外部安全扫描；相应边界不能从本轮静态 review 推断为已验证通过。
