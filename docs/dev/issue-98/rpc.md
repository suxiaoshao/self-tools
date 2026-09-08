# 认证 RPC 契约

本文件从属于 [规范计划](README.md)，拥有 W2 的 Thrift 与认证边界。HTTP 投影和前端恢复见 [API C3/C4](api.md#c3http-与-graphql-的非业务错误)，传播语义见 [tracing](tracing.md)。

## C5：AuthService

IDL 唯一事实源为 `server/common/thrift/idl/auth.thrift`。下面替换 Context、FailureCode、AuthFailure 和 service，新增其余列出的类型；Session、LoginResult、PasskeyInfo、Options、CeremonyContext 的原字段/ID/requiredness 保持 [现有 IDL](../../../server/common/thrift/idl/auth.thrift)。`Context.traceParent` 取代旧 traceId 含义，所有调用方同期修改，不支持旧新语义混用。

```thrift
namespace rs auth

struct Context {
  1: required string traceParent,
  2: optional string sessionToken,
  3: required string requestId,
  4: optional string traceState
}

enum ValidationCode {
  Required = 1, InvalidFormat = 2, TooLong = 3, OutOfRange = 4
}
struct FieldViolation {
  1: required list<string> path,
  2: required ValidationCode code,
  3: optional i64 min,
  4: optional i64 max
}
enum AuthRejectionCode {
  Unauthenticated = 1, ReauthRequired = 2, AuthenticationFailed = 3,
  CeremonyInvalid = 4, NoPasskey = 5, PasskeyExists = 6,
  InvalidRequest = 7, NotFound = 8, RateLimited = 9
}
exception AuthRejected {
  1: required AuthRejectionCode code,
  2: optional i32 retryAfterSeconds,
  3: optional list<FieldViolation> fieldErrors,
  4: optional string resourceId
}
enum ServiceFaultCode { Internal = 1, Unavailable = 2, DeadlineExceeded = 3 }
exception ServiceFault {
  1: required ServiceFaultCode code,
  2: required string requestId
}
struct DeletePasskeyResult {
  1: required string id,
  2: required bool sessionInvalidated
}
service AuthService {
  bool Ready(),
  LoginResult LoginPassword(1: Context ctx, 2: string username, 3: string password)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Session Check(1: Context ctx)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  void Logout(1: Context ctx)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Session ReauthPassword(1: Context ctx, 2: string password)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Options BeginLogin(1: CeremonyContext ctx)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  LoginResult FinishLogin(1: CeremonyContext ctx, 2: string credentialJson)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Options BeginReauth(1: CeremonyContext ctx)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Session FinishReauth(1: CeremonyContext ctx, 2: string credentialJson)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  list<PasskeyInfo> ListPasskeys(1: Context ctx)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  Options BeginRegistration(1: CeremonyContext ctx, 2: string name)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  PasskeyInfo FinishRegistration(1: CeremonyContext ctx, 2: string credentialJson)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  PasskeyInfo RenamePasskey(1: Context ctx, 2: string id, 3: string name)
    throws (1: AuthRejected rejected, 2: ServiceFault fault),
  DeletePasskeyResult DeletePasskey(1: Context ctx, 2: string id)
    throws (1: AuthRejected rejected, 2: ServiceFault fault)
}
```

`AuthRejected` 的详情有严格对应关系：RateLimited 必须带非负 retryAfterSeconds；InvalidRequest 可带非空 fieldErrors；NotFound 可带经过权限检查的 passkey UUID；其他分支不带详情。field path 相对 RPC 业务参数，login adapter 转换为对应 HTTP 字段路径。未知 enum、非法组合或不在方法允许集合内的拒绝当作上游协议故障处理，不自动变为 Unavailable。

声明异常的客户端形态为 `Result<MaybeException<T, MethodException>, ClientError>`：Ok value 是用例成功，MethodException 的 rejected/fault 是两种不同语义；外层 ClientError 是框架/RPC 调用故障。服务端只在完成用例与事务后转换，不让 `anyhow -> ServerError` 自动公开内部 message。

### 方法的拒绝边界

所有带 Context 的方法可因业务参数结构非法返回 InvalidRequest；追踪元数据无效时按 tracing 合同重新建上下文，不因 trace header 拒绝业务。表中列出其余允许的业务原因；正常空列表与不存在的 logout 目标不是拒绝。

| 方法               | 允许的其他拒绝                                                                        | 关键语义                                                                                                       |
| ------------------ | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| LoginPassword      | AuthenticationFailed、RateLimited                                                     | 创建新 session，旧 session 的撤销与新建同事务                                                                  |
| Check              | Unauthenticated                                                                       | session 缺失/过期是明确认证状态；底层 DB 故障不能变为此分支                                                    |
| Logout             | 无                                                                                    | 缺失、不可用或目标不存在均成功；会话已登出可重复达成目标                                                       |
| ReauthPassword     | Unauthenticated、AuthenticationFailed、RateLimited                                    | 保留同一 session，更新认证时效                                                                                 |
| BeginLogin         | NoPasskey、RateLimited、CeremonyInvalid                                               | ceremony/binding 校验保留，空凭据无法开始 WebAuthn 登录                                                        |
| FinishLogin        | CeremonyInvalid、AuthenticationFailed                                                 | 一次性状态不可重复消费                                                                                         |
| BeginReauth        | Unauthenticated、NoPasskey、RateLimited、CeremonyInvalid                              | 需要当前 session，但不先要求 recent authentication                                                             |
| FinishReauth       | Unauthenticated、CeremonyInvalid、AuthenticationFailed                                | 成功后的时效由当前 session 视图表达                                                                            |
| ListPasskeys       | Unauthenticated                                                                       | 无凭据返回正常空列表                                                                                           |
| BeginRegistration  | Unauthenticated、ReauthRequired、RateLimited、CeremonyInvalid                         | 名称与 recent authentication 校验，保留现有凭据排除机制                                                        |
| FinishRegistration | Unauthenticated、ReauthRequired、CeremonyInvalid、AuthenticationFailed、PasskeyExists | 凭据唯一冲突只在对应约束位置解释                                                                               |
| RenamePasskey      | Unauthenticated、ReauthRequired、NotFound                                             | 合法 UUID 和名称，目标缺失明确拒绝                                                                             |
| DeletePasskey      | Unauthenticated、ReauthRequired                                                       | 先验证 session/recent authentication；合法 UUID 已不存在成功，sessionInvalidated=false；实际删除时返回级联影响 |

签名中的 AuthRejected 是领域共享结构，不代表每个方法都可随意返回全部 code。现有内存限流/ceremony 的具体时间、次数、绑定与消费顺序保持原合同。登录、重新认证、注册的浏览器 credential 不进入日志或诊断上下文。

sessionToken 是可失效的凭据，不作为普通业务字段返回 InvalidRequest。缺失、空值、非法 Base64URL 或错误长度均不能提供认证身份：Check/重新认证/凭据管理返回 Unauthenticated；LoginPassword/FinishLogin 忽略不可用的旧 token，在密码或签名验证成功后签发新 session；Logout 对此正常成功。有效旧 token 的撤销仍与新建同事务，DB/任务故障仍走故障通道，不吞为匿名。browserBinding 属于 ceremony 绑定，继续严格校验，不采用 session 的恢复语义。

### 故障与公开投影

| 产生位置                                         | 保留的内部事实                          | RPC / 浏览器投影                                     |
| ------------------------------------------------ | --------------------------------------- | ---------------------------------------------------- |
| 已识别业务约束或认证规则                         | 领域 rejection，允许的最少详情          | AuthRejected → API 中同名业务 code                   |
| 池耗尽、数据库连接不可用                         | 原 Pool/Database source 与操作          | ServiceFault.Unavailable → 503 UNAVAILABLE           |
| 已知依赖等待超时                                 | Timeout source，不证明写入未发生        | ServiceFault.DeadlineExceeded → 504 UPSTREAM_TIMEOUT |
| 数据损坏、未知 DB 错误、任务异常、内部不变量     | 类型化来源与安全分类                    | ServiceFault.Internal → 500 INTERNAL                 |
| 客户端 DNS/连接失败                              | thrift 客户端保留 Lookup/Transport 来源 | 503 UNAVAILABLE；写入保持未确认                      |
| 客户端超时                                       | 实际超时来源，不能靠 message 匹配       | 504 UPSTREAM_TIMEOUT；写入保持未确认                 |
| RPC Protocol、未知 Application/Biz、非法返回组合 | 具体外层种类，不信任远端 message        | 502 UPSTREAM_FAILURE                                 |

requestId 来自服务端认可的入口上下文；直接 RPC 没有有效 ID 时由接收端生成。ServiceFault 只传播此关联标识和安全分类，不带 SQL、内部错误链、请求内容或用户名。详细诊断由故障所有者记录，调用方记录远端分类与自己的失败完成事件。

## 生成、消费者与数据

先修改 IDL，经现有 `volo_build::ConfigBuilder + SerdePlugin` 的 build.rs 生成 OUT_DIR 绑定，不手写 gen_thrift。auth service 匹配应用结果生成声明异常；login 的 rpc 宏/错误转换分别匹配两种异常。两站 GraphQL handler 的 Check 调用同步识别 Unauthenticated 与 ServiceFault；`service-health` 继续消费未改变的 Ready bool，确认其失败仍只影响就绪状态。任何构造 Context 的位置全部改为从 telemetry 上下文创建，禁止调用方自行拼 traceparent。

应用模型由 auth 持有，repository 使用它，Thrift service adapter 做生成类型转换；Session token 只在必要的内部返回和 Set-Cookie 链路流动，浏览器 JSON 成功结构仍不包含 token。删除凭据保持外键级联撤销会话的现有数据库行为，无需 migration；HTTP 把原 204 改为显式删除结果，前端按会话影响处理，不能把幂等删除变成绕过认证的入口。

该变更与浏览器 API 一起协调发布，旧 AuthFailure/FailureCode 及旧 Context 语义全部退出；字段号列于 IDL 不隐式重排。发布/回退顺序见父计划，当前不实现双协议兼容。

W2 的必要证据：生成成功；声明拒绝/受控 fault/外层 transport 分别可解码；非法异常细节安全降级；持久化失败保留原因且不误登出；拒绝事务回滚；删除凭据会话影响；ceremony 不重放。复用现有 auth 生命周期与 portal generation 测试，仅补实际缺口。
