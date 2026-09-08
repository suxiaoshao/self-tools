# Issue #96：统一登录、Session 与通行密钥管理

## 状态与范围

- 状态：实现与基础验证已完成，可试用。应用内浏览器已验证密码登录、返回原页面、安全设置，以及真实设备通行密钥创建和登录。
- 所有者：auth、login、gateway、两个 GraphQL 服务及 portal 的认证入口。
- 关联：[#96](https://github.com/suxiaoshao/self-tools/issues/96)。不修改已有 #94/#97 记录，不维护提交或合并状态。
- 本轮交付：实现与应用内浏览器试用。完成基础构建、关键回归和必要启动检查后交付，不遍历全部设备、主题和异常场景。

目标是让个人管理员通过密码或通行密钥登录，两种方式获得相同的服务端 session；通行密钥在登录后的安全设置中管理。保留现有五个服务及 PostgreSQL，不增加 Redis、认证服务或独立 crate，不实现公开注册、多用户、设备管理页面、密码找回、SSO 或多副本协调。

### 已确认的产品决定

- 单管理员、单 auth 实例；Session 和 Passkey 存入现有 PostgreSQL 实例，challenge 只存 auth 内存。
- Session 闲置 30 天失效，成功认证的实际请求续期；90 天绝对有效期不延长。
- 退出撤销当前 session；管理员密码改变后撤销所有 session。升级后旧 JWT/localStorage 登录状态失效，旧内存 Passkey 重新注册。
- 登录页以“使用通行密钥”为主入口，密码表单按需展开；创建通行密钥移到登录后的安全设置，提供添加、命名和删除。
- 浏览器登录及 GraphQL 请求统一到主站 `https://sushao.top/api/...`，由 gateway 转发；Cookie 不共享给子域。该接口地址调整已获用户确认。

## 改造前问题与设计依据

| 当前入口                                                                       | 已核对的问题及影响                                                                                                                               |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `server/packages/auth/src/utils.rs`                                            | Claims 包含明文 password，exp 固定为 10000000000；校验直接比较环境账号密码。                                                                     |
| `server/packages/login/src/router/webauthn.rs`                                 | Passkey、用户名映射、challenge 与注册时签发的 JWT 均在 HashMap；Passkey 登录重复返回保存的 JWT。Cookie 有 Max-Age，服务端 challenge 无到期判断。 |
| `web/packages/portal/src/features/Auth/`                                       | 三按钮混合登录与凭据注册；异步回调未被完整 await；token 在 localStorage，退出只清前端。                                                          |
| `web/common/custom-graphql/src/index.tsx`、两个服务的 `router/graphql/post.rs` | 浏览器读 localStorage 写 Authorization，服务端传给 GraphQL guard 再调用 auth。                                                                   |
| `server/packages/gateway/src/route.rs`                                         | 当前按子域转发，path prefix 用 starts_with 且不重写 URI。主站 API 需要新增精确路由，放在前端 fallback 之前。                                     |
| `server/common/middleware/src/trace/trace_log.rs`、auth `middleware.rs`        | HTTP header 与 RPC request/response 会被整体记录；改用 Cookie 后必须同步阻止凭据日志泄露。只处理本认证链，不扩展为 #98 全站日志改造。            |

已核对锁定版本 `webauthn-rs 0.5.5` 的 `src/lib.rs`、`src/interface.rs`：普通 Passkey API 要求用户验证，支持凭据列表；`Passkey` 自身支持安全序列化，临时 ceremony state 的序列化才需要 danger feature。`conditional-ui` 的 discoverable 入口强制 Conditional mediation。这里由服务端选择唯一管理员的凭据列表即可做到不输入用户名，不需要启用实验流程，也不承诺浏览器自动填充登录或所有平台的特殊 Passkey 创建方式。

参考：[webauthn-rs 0.5.5 源码](https://docs.rs/crate/webauthn-rs/0.5.5/source/src/lib.rs)、[Cookie 属性](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)、[OWASP CSRF 防护](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)。Cookie 的 SameSite 不区分同站子域，故额外校验精确 Origin；`__Host-` Cookie 使用 Secure、Path=/ 且不设置 Domain。

## 登录与页面行为

1. 初次进入应用先查询 session，期间显示加载状态，不根据 localStorage 判定登录或提前跳转。只有确定匿名才进入 `/login`；服务不可用时显示重试，不误报密码错误。
2. `/login` 主按钮调用浏览器通行密钥认证，无用户名输入前置条件。次入口展开用户名/密码表单。没有 Passkey、设备不支持或用户取消时可继续密码登录，不自动创建凭据或反复唤起系统弹窗。
3. 任一种认证成功，服务器创建全新 session 并设置 Cookie；前端只接收用户与有效期信息。成功后只跳转合法的本站相对 `from` 路径，拒绝绝对 URL、`//` 和登录循环。
4. 登录后侧栏提供 `/settings/security`：列表展示名称、创建时间、最近使用时间；添加调用 `navigator.credentials.create`，失败不改变现有 session。允许多个凭据，防止重复 credential ID；名称由用户填写，不能把名称当作设备身份。
5. 添加、重命名、删除要求最近 5 分钟内完成密码或 Passkey 验证。超过窗口时在当前页面完成再认证，再继续原操作；再认证不重置 session 的 90 天上限。删除前确认，可删除最后一个 Passkey，密码始终作为恢复入口。
6. 退出向服务端撤销 session，成功后清 Cookie、页面认证状态与已挂载业务状态；失败保留可重试入口，不声称已撤销。服务端确认失效后的业务请求引导重新登录。

认证操作使用一个可 await 的流程，统一 pending、防重复、取消和错误恢复。卸载时中止 browser/fetch 等待，并以请求代次阻止旧结果覆盖新登录；网络请求已经产生的服务端副作用不能由 AbortController 保证撤销。若登录响应丢失，重新查询 session 确认结果，不自动重试登录或凭据变更。

## 所有权与实施位置

```text
server/packages/auth/
  src/main.rs                    # 组装配置、DB pool、WebAuthn 与短期状态
  src/service.rs                 # Thrift adapter：类型转换和应用调用
  src/application.rs             # 登录、再认证、session、Passkey 用例
  src/session.rs / passkey.rs     # 规则及内存 challenge；私有拆分按职责决定
  src/repository.rs + repository/ # Diesel 查询与事务；schema 为生成物
  migrations/ + diesel.toml      # 新认证数据库 schema 的唯一手写来源
server/packages/login/src/
  router.rs + router/            # HTTP/JSON、Origin/CSRF、Cookie；不持有 Passkey/state
  errors.rs                      # 本认证 API 的安全状态码与错误码
server/common/thrift/            # auth.thrift + 既有 Volo build.rs 生成链
server/common/middleware/        # 多消费者共享的 Cookie/Origin 解析及 header 脱敏
server/packages/{bookmarks,collections}/src/
  router.rs + router/graphql/    # 新路径、Cookie 提取、每请求认证结果
  graphql/guard.rs               # 消费已验证身份，保留现有字段授权规则
server/packages/gateway/src/     # 主站 API 精确路由与 Cookie 转发边界
web/packages/portal/src/features/Auth/  # 会话初始化、两种登录、再认证、安全设置
web/common/custom-graphql/       # Cookie 请求、401 通知；移除 token 注入
```

同步消费者：portal `App.tsx`、`components/AppRouter.tsx`、侧栏；bookmarks `src/utils/apolloClient.ts`；collections `src/App.tsx`；`web/common/i18n/src/locales/{zh,en}.json`。复用现有 Button、Dialog、Field、Sidebar 等组件与表单工具，不重做 UI 系统。业务 GraphQL SDL/operations 不变，不触发无输入变化的 codegen。

### Session 与管理员规则

- 继续由环境 `USERNAME`、`PASSWORD` 配置唯一管理员；启动时读取并校验非空。数据库保存稳定随机 user UUID，不保存明文密码。用户名变化仍对应同一管理员 UUID。
- 复用已有 `SECRET`，用 HMAC-SHA256 对带长度前缀的用户名/密码做配置指纹；禁止记录指纹输入。启动时在事务中与数据库指纹比较，变化则撤销全部 session 并更新指纹；SECRET 变化也导致撤销。环境变更以 auth 重启为生效点。
- Passkey 不随密码变化自动删除；丢失或泄露的 Passkey 通过管理页撤销。普通重启且配置未变时 session/Passkey 保留，进行中的 challenge 失效并重新开始。
- token 由 OS CSPRNG 生成 32 字节，Base64URL 无 padding；数据库只存 SHA-256(token)。成功登录总是生成新 token，并撤销浏览器此次携带的旧 session，防止会话固定。token 只经过内部 RPC 和 Set-Cookie，不进入浏览器 JSON。
- `now >= absolute_expires_at` 或 `now >= last_seen_at + 30 days` 即拒绝。Check 在同一 DB 操作中判断有效性并更新 last_seen；不通过定时心跳维持登录。数据库不可用时返回不可用错误，禁止退回内存授权。
- 删除 Passkey 时同时撤销由该凭据建立的 session；若包含当前 session，前端退出并提示重新登录。密码建立的 session 不受该次删除影响。
- auth 的同步 Diesel 操作放进受限 `spawn_blocking`，pool 最大 4；不跨外部 await 持有连接。过期 session 在启动和成功登录时删除，不扫描业务数据库。

### PostgreSQL 数据合同

复用现有 PostgreSQL 实例，新增独立认证数据库连接 `AUTH_PG`（部署者预先创建数据库及访问角色，URL 不进入文档或提交）；由 auth 独占以下表。UUID 由应用生成，不要求数据库扩展。

```sql
CREATE TABLE auth_admin (
  singleton SMALLINT PRIMARY KEY CHECK (singleton = 1),
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL,
  config_fingerprint BYTEA NOT NULL CHECK (octet_length(config_fingerprint) = 32)
);
CREATE TABLE auth_passkey (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth_admin(user_id),
  credential_id BYTEA NOT NULL UNIQUE,
  credential JSONB NOT NULL,
  format_version SMALLINT NOT NULL DEFAULT 1 CHECK (format_version = 1),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 64),
  created_at TIMESTAMPTZ NOT NULL,
  last_used_at TIMESTAMPTZ
);
CREATE TABLE auth_session (
  token_hash BYTEA PRIMARY KEY CHECK (octet_length(token_hash) = 32),
  user_id UUID NOT NULL REFERENCES auth_admin(user_id),
  passkey_id UUID REFERENCES auth_passkey(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL,
  last_seen_at TIMESTAMPTZ NOT NULL,
  authenticated_at TIMESTAMPTZ NOT NULL,
  absolute_expires_at TIMESTAMPTZ NOT NULL,
  CHECK (absolute_expires_at > created_at),
  CHECK (last_seen_at >= created_at AND authenticated_at >= created_at)
);
CREATE INDEX auth_session_expiry ON auth_session(absolute_expires_at);
CREATE INDEX auth_session_idle ON auth_session(last_seen_at);
CREATE INDEX auth_session_passkey ON auth_session(passkey_id);
```

`passkey_id` 记录创建该 session 的凭据，密码登录为 NULL；再认证不改创建来源。`credential` 保存库的完整 Passkey serde 数据，不只抽出公钥；持久化未知格式时拒绝启动并报告安全运维错误，不静默丢弃凭据。名称 trim 后限制 1–64 字符，并在 HTTP/RPC 应用入口统一校验。

Passkey 登录完成时，在事务中重新确认凭据仍存在且属于管理员，锁定该行，比较当前完整凭据与 challenge 开始时的快照；并发变更要求重新验证，再按库结果更新凭据并创建 session；避免认证过程中删除或并发更新导致旧凭据重新生效。零 counter 的同步 Passkey 按库语义处理，不能一律视为克隆。注册完成的唯一性冲突不重复保存；DB 写入失败不创建 session、不宣称注册成功。

新增 migration 的 down 只删除这三张认证表，顺序为 session、passkey、admin；会丢失新凭据和 session，不能作为日常回滚默认动作。两个业务数据库、表和 volume 不变。

### Challenge 与 WebAuthn

- WebAuthn 全部在 auth，使用现有 `start/finish_passkey_registration`、`start/finish_passkey_authentication`；默认 RP ID `sushao.top`，唯一 Origin `https://sushao.top`，禁用任意子域和端口。
- 内存记录归属于唯一管理员的 auth 实例，包含随机 32 字节 ceremony ID、随机 browser-binding token 的哈希、用途（login/register/reauth）、服务端到期时间，以及库 state；已登录用途还绑定 session hash。
- TTL 5 分钟，开始/完成时清理到期记录；最多 256 条，满时拒绝新请求并返回 429。finish 先核对 browser binding，再原子取出并消费记录；过期、错用途、错 session、重复完成均失败。有效 finish 即使验证失败也不复用 challenge。
- login 为尚未认证的浏览器设置短期 HttpOnly `__Host-st_ceremony` Cookie；JSON 只携带 ceremony ID 和库生成的公开 options。Cookie 不携带库 state。最多一个前端认证动作 pending；不同标签页可通过不同 ceremony ID 区分。
- register 开始和完成均检查有效且近期认证的 session。reauth 也绑定原 session；用户不能通过改 JSON 中的 username/user ID 注册到其他身份。
- 普通密码登录与密码再认证共享每分钟 10 次的单实例尝试预算；challenge 开始共享每分钟 60 次预算，超限可重试且不永久锁账号。错误细节不暴露账号、凭据清单或内部异常；正常登录无 Passkey 时明确提供密码入口。

## 浏览器与服务契约

### 同源路由、Cookie 与 CSRF

| 浏览器路径（main host）         | upstream 与后端路径         |
| ------------------------------- | --------------------------- |
| `/api/auth/` 下列出的认证端点   | login，保留路径             |
| 精确 `/api/bookmarks/graphql`   | bookmarks，同名新后端路径   |
| 精确 `/api/collections/graphql` | collections，同名新后端路径 |

以上路由置于 portal fallback 之前；认证前缀匹配 `/api/auth/` 边界，未知主站 `/api/` 返回 404，不落到前端。旧 auth host 的认证路由从 gateway 移除；bookmarks/collections 子域的旧 GraphQL URL 返回 404，其余图片或遗留前端路由不改。直接修改两个 GraphQL router 的路径和 playground endpoint，不为此新增通用 URI 重写框架。旧 `/api/login`、`/api/start-*`、`/api/finish-*` 和子域 `/graphql` 入口退役，不保留 JWT 兼容分支。现有图片 `/fetch-content`、前端页面与静态资源入口保留。

```http
Set-Cookie: __Host-st_session=<opaque-token>; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=<90天绝对期限的剩余秒数>
Set-Cookie: __Host-st_ceremony=<binding-token>; Path=/; Secure; HttpOnly; SameSite=Strict; Max-Age=300
Cache-Control: no-store
```

session Cookie 只在登录时设置；实际闲置失效由服务器执行，活跃请求无需不断回写 Cookie。退出使用相同属性和 Max-Age=0。重复同名 Cookie 或目标 Cookie 结构损坏仍拒绝，不选择第一个绕过检查。session token 不可用时按未登录处理，正常登录可替换它；ceremony token 继续严格拒绝非规范值。具体恢复边界见 [#98 API 契约](../issue-98/api.md)。

gateway 仅向三个指定 API upstream 传递所需认证 Cookie，其他前端、图片和遗留 upstream 移除这两个 Cookie；旧 Authorization 不再用于认证。auth 临时 Cookie 仅转发给 login。禁止这些 API 响应缓存；gateway 本身不验证 session。

前端所有认证与 GraphQL fetch 均添加 `X-Self-Tools-Request: 1`，body 非空时明确发送 JSON；共享 HttpLink 同步该 header。认证 GET 也要求此 header；若附带 Origin 则必须精确匹配，禁止跨域 CORS 授权，避免简单跨站请求触发 session 查询/续期。

HTTP 修改类端点及所有 GraphQL POST 必须同时满足：精确 `Origin == AUTH_ORIGIN`、`X-Self-Tools-Request: 1`、JSON Content-Type。拒绝缺失/null/重复/相似 Origin，且在产生副作用前检查。GET 只用于 session 查询、Passkey 列表和 playground，不执行 mutation；凭据 API 不提供跨域读取。默认部署与开发均经现有 HTTPS gateway，不新增 HTTP 降级或任意 localhost 例外。CORS 的其他配置不成为 CSRF 授权来源。

共享 Cookie 解析、请求 Origin 校验放进已有 middleware 的独立 feature，供 login/两个 GraphQL 服务使用；该模块不持有 DB 或发 RPC。auth/login/两个 GraphQL 服务使用同一个 `AUTH_ORIGIN` 配置，auth 从其 URL 推导默认 RP ID；显式 RP 配置仅在需保持已有 RP 时使用并由库验证。Compose 为缺 env_file 的 login 明确透传该键，沿用现有 xtask 支持的 null 环境值语义。

### HTTP API

成功响应为 `{ "data": T }`；时间统一 RFC3339 UTC，id 为 UUID 字符串。失败为 `{ "code": "...", "message": "固定安全提示" }`，前端按 code 分支和本地化，不解析 message。

```ts
type SessionView = {
  user: { id: string; username: string };
  idleExpiresAt: string;
  absoluteExpiresAt: string;
  recentAuthenticationUntil: string;
};
type PasskeyView = { id: string; name: string; createdAt: string; lastUsedAt: string | null };
type CeremonyOptions = { ceremonyId: string; publicKey: unknown }; // 具体形状使用锁定库的公开 options JSON
```

| 方法与 `/api/auth` 后缀        | 输入                                             | 成功                                   |
| ------------------------------ | ------------------------------------------------ | -------------------------------------- |
| GET `/session`                 | session Cookie                                   | 200 SessionView，匿名为 data:null      |
| POST `/password/login`         | `{username,password}`，可携带旧 session          | 200 SessionView + 新 Cookie            |
| POST `/logout`                 | 当前 session Cookie                              | 204，删除 session；已失效也成功        |
| POST `/passkey/login/options`  | `{}` + browser binding                           | 200 CeremonyOptions                    |
| POST `/passkey/login/finish`   | `{ceremonyId,credential}` + binding              | 200 SessionView + 新 Cookie            |
| POST `/reauth/password`        | `{password}` + session                           | 200 SessionView                        |
| POST `/reauth/passkey/options` | `{}` + session/binding                           | 200 CeremonyOptions                    |
| POST `/reauth/passkey/finish`  | `{ceremonyId,credential}` + session/binding      | 200 SessionView                        |
| GET `/passkeys`                | session                                          | 200 PasskeyView[]                      |
| POST `/passkeys/options`       | `{name}` + 近期 session/binding                  | 200 CeremonyOptions，name 绑定 state   |
| POST `/passkeys/finish`        | `{ceremonyId,credential}` + 近期 session/binding | 201 PasskeyView                        |
| PATCH `/passkeys/:id`          | `{name}` + 近期 session                          | 200 PasskeyView                        |
| DELETE `/passkeys/:id`         | 近期 session                                     | 204；若撤销当前 session，同步清 Cookie |

Session 查询无 Cookie 或确实失效返回 null；RPC/DB 故障返回 503，不能伪装匿名。受保护操作缺失/失效 session 返回 401 `UNAUTHENTICATED`；近期认证不足返回 403 `REAUTH_REQUIRED`；Origin/header 拒绝为 403 `REQUEST_REJECTED`；密码错误或无效签名为 401 `AUTHENTICATION_FAILED`，不触发已有 session 的全局退出；challenge 不可用为 400 `CEREMONY_INVALID`；无凭据为 409 `NO_PASSKEY`；重复凭据为 409 `PASSKEY_EXISTS`；其他输入/不存在/限流/内部错误分别为 400 `INVALID_REQUEST`、404 `NOT_FOUND`、429 `RATE_LIMITED`（Retry-After）、503 `AUTH_UNAVAILABLE`。原始异常只在脱敏的服务端诊断中保留。

`credential` 使用库公开的 `RegisterPublicKeyCredential` / `PublicKeyCredential` JSON，不是库内部 state。浏览器将 rawId、clientDataJSON、attestationObject 或 authenticatorData/signature/userHandle 做完整 Base64URL 转换，并保留 type、id、扩展结果和 transports。使用经能力检测的 toJSON 或一个集中 codec；不能直接假设 JSON.stringify(Credential) 可携带完整数据，也不再调用无关的 credentials.store。

### Thrift 契约

`server/common/thrift/idl/auth.thrift` 改为 AuthService，同步 `get_client`、auth server 和全部调用方；不保留 ItemService/JWT 异常分支。单次协调切换，不支持新旧 RPC 混跑。以下为目标声明，JSON string 仅封装 WebAuthn 库的公开协议对象，auth 必须反序列化成库类型验证。

```thrift
namespace rs auth
struct Context { 1: required string traceId, 2: optional string sessionToken }
struct Session {
  1: required string userId, 2: required string username,
  3: required i64 idleExpiresAt, 4: required i64 absoluteExpiresAt,
  5: required i64 recentAuthenticationUntil
}
struct LoginResult { 1: required string sessionToken, 2: required Session session }
struct PasskeyInfo {
  1: required string id, 2: required string name,
  3: required i64 createdAt, 4: optional i64 lastUsedAt
}
struct Options { 1: required string ceremonyId, 2: required string publicKeyJson }
struct CeremonyContext {
  1: required Context context, 2: required string browserBinding,
  3: optional string ceremonyId
}
enum FailureCode {
  Unauthenticated = 1, ReauthRequired = 2, AuthenticationFailed = 3,
  CeremonyInvalid = 4, NoPasskey = 5, PasskeyExists = 6,
  InvalidRequest = 7, NotFound = 8, RateLimited = 9, Unavailable = 10
}
exception AuthFailure { 1: required FailureCode code, 2: optional i32 retryAfterSeconds }
service AuthService {
  LoginResult LoginPassword(1: Context ctx, 2: string username, 3: string password) throws (1: AuthFailure err),
  Session Check(1: Context ctx) throws (1: AuthFailure err),
  void Logout(1: Context ctx) throws (1: AuthFailure err),
  Session ReauthPassword(1: Context ctx, 2: string password) throws (1: AuthFailure err),
  Options BeginLogin(1: CeremonyContext ctx) throws (1: AuthFailure err),
  LoginResult FinishLogin(1: CeremonyContext ctx, 2: string credentialJson) throws (1: AuthFailure err),
  Options BeginReauth(1: CeremonyContext ctx) throws (1: AuthFailure err),
  Session FinishReauth(1: CeremonyContext ctx, 2: string credentialJson) throws (1: AuthFailure err),
  list<PasskeyInfo> ListPasskeys(1: Context ctx) throws (1: AuthFailure err),
  Options BeginRegistration(1: CeremonyContext ctx, 2: string name) throws (1: AuthFailure err),
  PasskeyInfo FinishRegistration(1: CeremonyContext ctx, 2: string credentialJson) throws (1: AuthFailure err),
  PasskeyInfo RenamePasskey(1: Context ctx, 2: string id, 3: string name) throws (1: AuthFailure err),
  bool DeletePasskey(1: Context ctx, 2: string id) throws (1: AuthFailure err)
}
```

内部 RPC 时间为 Unix 秒；DeletePasskey 返回是否撤销当前 session，login 据此清 Cookie。只有 LoginPassword/FinishLogin 返回原始 session token，且仅用于 Set-Cookie；不得把 LoginResult 直接序列化为 HTTP body。Begin 的 ceremonyId 必须缺省，Finish 必填；browserBinding 为 Cookie 原值，auth 仅存其哈希。所有需要认证的方法在 auth 内再次校验，不相信 login 传来的 userId 或“已认证”布尔值。

### GraphQL 与前端认证状态

两个 GraphQL POST handler 在请求入口提取 Cookie 并调用一次 Check，成功后把已验证身份放进 request context，guard 消费该结果；原来受保护的字段继续受保护，缺 Cookie 不会绕过授权。认证失败在执行 resolver 前返回 HTTP 401；服务故障为 503，CSRF 为 403。业务 schema、字段错误、查询成本和 repository 架构保持原范围。

`custom-graphql` 删除 SetContextLink 的 localStorage/Authorization 注入，保留 Cookie credentials；仅对 HTTP 401 触发认证失效处理，不对 403、503、业务错误或密码错误自动退出。由 portal 注册认证失效回调，共享库不反向导入 portal store：

```ts
type AuthBoundary = {
  generation: () => number;
  unauthenticated: (requestGeneration: number) => void;
};
// 注册一次并返回清理函数；GraphQL 请求发起时记录 generation，失败时回传。
export function registerAuthBoundary(boundary: AuthBoundary): () => void;
```

portal 的登录/退出/再初始化改变 generation；旧请求 401 不得清除之后的新登录。同一代重复 401 只处理一次。失效后卸载受保护业务页面，清除本认证迁移实际涉及的 Apollo/内存投影；当前清理范围包含 Apollo cache 和两个集合树的内存投影，并对旧异步结果使用版本检查；不扩大为 #102 的所有 cache/store 改造。`AuthStore` 使用 checking/anonymous/authenticated/unavailable 等显式状态，不保存 token；首次初始化移除旧 localStorage `auth`，没有旧 JWT fallback。

## 配置、依赖与生成入口

- auth 新增 `AUTH_PG`，保留 `USERNAME`、`PASSWORD`、`SECRET`，新增 `AUTH_ORIGIN` 默认 `https://sushao.top`。单实例假设明确写进 owner README；不实现多副本 challenge 共享。
- 复用 workspace Diesel 2.3.11（postgres/r2d2/time/uuid/serde_json）、time、serde/json、base64；将 webauthn-rs 0.5.5 从 login 移至 auth，移除 danger-allow-state-serialisation，不升级版本。Passkey 属于 auth 的直接依赖；login 若只转发经过边界校验的公开 JSON，则不保留 webauthn-rs，密码、Cookie 和普通响应无需该库。
- 签名回归使用锁文件已有的 openssl 0.10.81 作为 auth dev-dependency，构造受控 P-256 认证器，不保存真实用户私钥。
- 明确声明锁文件已有的 uuid 1.23.4（v4/serde）、getrandom 0.4.3（已核对 fill）、sha2 0.10.9、hmac 0.12.1；HMAC 用于配置指纹和固定长度密码比较，SHA-256 仅用于高熵 token。manifest 经 Cargo 更新 lock，不手改生成物。
- 删除 auth 的 jsonwebtoken，以及 login 无消费者的 WebAuthn/URL 状态和错误类型；依赖是否仍有消费者按实际引用确认。auth Dockerfile 补齐 libpq 和 WebAuthn/OpenSSL 运行依赖，沿用现有 Debian trixie 来源；login 移除确认只供 WebAuthn 使用的运行包。
- `auth/migrations/` 配置 `auth/diesel.toml` 输出 `src/repository/schema.rs`。执行者先准备独立认证数据库及专用测试数据库；不把密码写进命令示例或日志。以 auth 目录为 cwd、通过进程环境 `DATABASE_URL` 提供目标，使用已存在的 `diesel migration run` / `diesel print-schema`；部署前显式 migration，启动只检查 schema/pool 并初始化管理员，不自动改表。
- Thrift 生成仍由现有 build.rs + volo.yml 在 Cargo 构建时进入 OUT_DIR。前端 schema/operation 不变，不运行无关 generate。
- 实施时同步 server/web/gateway/docker README 的新稳定契约、Compose 配置和确实受影响的镜像路径触发；不在本计划新增一套部署命令或扩展 #106 的通用 secret/readiness 工作。

## 工作顺序与交付验证

| 工作包             | 内容与依赖                                                                      | 基础完成证据                                                                               |
| ------------------ | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 1. auth 数据与用例 | migration、管理员指纹、session、Passkey、challenge；密码与 Passkey 共用会话创建 | 隔离 DB 中迁移和事务通过；时间边界、撤销、重启保留、一次性 state 和凭据更新/删除的关键回归 |
| 2. RPC 与 HTTP     | 新 IDL、login adapter、Cookie、Origin、认证错误和必要日志脱敏；依赖 1           | Cargo 生成链及消费者编译；token 不进 JSON/日志，取消/错误映射正确                          |
| 3. 请求链迁移      | gateway 主站路由、两个 GraphQL 入口与 guard、custom-graphql；依赖 2             | 精确路由、Cookie 转发/剥离、CSRF、认证失败先于 resolver，旧 token 无效                     |
| 4. 登录与安全设置  | 前端两种登录、session 初始化、再认证、Passkey 管理与 i18n；依赖 2/3             | 请求代次、pending/取消、重定向和关键 UI 状态测试；必要启动检查后交付试用                   |

验证按工作包实际修改选择：`cargo test -p auth -p login -p middleware -p gateway -p bookmarks -p collections` 可按目标拆分；Clippy 同样只覆盖受影响包。前端从现有 lint/typecheck/Vitest 入口选择受影响测试；IDL 变化通过 Cargo 验证消费者，数据库回归使用专用测试库。相同证据不重复补测或另建一轮全量审计。

WebAuthn 验证成功/错误的基础回归使用受控 credential/state 样本，覆盖错 Origin、错误签名、过期/重放、近期认证和撤销边界；不以浏览器手工重复遍历替代自动化关键回归。必要启动检查确认服务可连接专用数据库、session endpoint 和页面可达；镜像原生依赖变化需一次相应运行产物启动证据。

可试用交付不等待所有设备/浏览器的 Passkey 弹窗、跨设备同步、完整安全设置交互和长期使用回归。用户试用反馈后定向修复；只有用户要求最终验收或集成范围确实要求时才扩大验证。未执行的阶段如实说明，不据此持续排障或阻止交付。

升级采用协调切换：先应用认证 migration，再使用同一代码版本启动 auth/login/GraphQL/gateway 与前端；旧 JWT 不兼容，已获同意重新登录和注册 Passkey。回退到旧版本会恢复已知旧认证风险，不设计自动降级或双轨长期兼容；保留认证数据库以便修复后重新启动。

## 实现与验证记录

- 已实现认证 migration、PostgreSQL session/Passkey、HMAC 配置变更撤销、受限 blocking 数据库访问，以及限流、一次性 challenge、近期验证和凭据删除撤销。
- 新 AuthService IDL 已通过现有 Cargo/Volo 链生成，login、两个 GraphQL 入口、gateway 与 portal 已协调切换到同源 Cookie。原 JWT 和内存 WebAuthn 实现已移除。
- 登录页、异步取消/请求代次、安全设置及中英文文案已接入；共享 Apollo 和两份集合树投影随身份边界清除，旧结果不能重新写回。
- 13 项 auth/login/middleware/gateway 默认测试通过；专用 `self_tools_auth_test` 库的完整签名生命周期回归单独通过，覆盖持久化、错误 Origin/签名、重放、并发凭据更新、删除中断认证、近期验证、闲置/绝对过期、轮换/退出及密码变更撤销。
- 六项前端认证回归、类型检查、定向 Oxlint、Knip、portal build 通过；六个受影响 Rust 包的 all-targets Clippy 通过。业务 GraphQL SDL/operation 未变，不运行无输入变化的生成。
- 已在本机创建独立认证数据库和测试数据库，执行 migration 并生成 Diesel schema；五个配套服务镜像构建及必要启动检查通过，portal 通过现有 HTTPS gateway 提供页面。业务数据库表和 volume 不迁移。
- 应用内浏览器 `https://sushao.top` 已验证：初始 session 检查、旧登录状态失效后回到登录页、Passkey 主入口、无凭据安全提示、密码表单展开、密码登录成功并返回原小说爬取页面、安全设置空列表及添加对话框。用户完成真实设备 Passkey 创建后，列表显示新凭据；退出再使用该凭据登录成功，返回安全设置且最近使用时间更新。重命名、删除和跨设备场景未做浏览器实测。

本轮以可试用实现交付；后续按用户反馈定向修复，不增加设备矩阵或无关全量审计。
