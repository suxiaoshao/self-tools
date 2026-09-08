# Gateway

`gateway` 是仓库当前的 HTTP/HTTPS 对外入口，基于 Pingora 实现 host/path 路由、
边缘 TLS 终止、请求标识传播和反向代理。它不是认证 Thrift 服务的代理；内部服务仍
通过 `auth:80` 直接调用认证服务。

后端整体拓扑见 [`../../README.md`](../../README.md)，镜像构建与容器编排见
[`../../common/xtask/README.md`](../../common/xtask/README.md)。

## 源码边界

- `src/main.rs`：加载配置，创建 Pingora server，注册 HTTP/HTTPS listener 与 TLS。
- `src/config.rs`：从环境变量读取 host、upstream、listener 和证书路径，并提供默认值。
- `src/route.rs`：声明有序路由表。
- `src/proxy.rs`：匹配请求、执行 HTTP 到 HTTPS 跳转、选择 upstream、传播 header
  并记录请求日志。

环境变量名、默认值和路由行为以这些文件为准。本文不复制完整参数表，避免形成第二份
易漂移的配置事实源。

## 路由顺序

`build_routes` 返回有序列表，使用第一个 host 与 path 都匹配的条目，不重写 URI。
以 `/` 结尾的 path 规则匹配该目录前缀，其他 path 规则精确匹配。

| host 角色        | path 条件                          | upstream 角色 |
| ---------------- | ---------------------------------- | ------------- |
| main host        | `/api/auth/` 前缀                  | login         |
| main host        | 精确 `/api/bookmarks/graphql`      | bookmarks     |
| main host        | 精确 `/api/collections/graphql`    | collections   |
| bookmarks host   | `/fetch-content` 等现有非 API 路径 | bookmarks     |
| collections host | 现有非 API、非 `/graphql` 路径     | 遗留前端      |
| main host        | 非 `/api`、非 `/api/` 路径         | portal        |

主站未知 `/api/` 返回 404，不落入前端 fallback。旧 auth host 认证接口和两个子域的
`/graphql` 已退役。API 规则必须位于 portal fallback 前。
仅向上述三个 API upstream 传递 session Cookie，ceremony Cookie 仅传给 login；
其他 upstream 移除这两个 Cookie，保留不相关 Cookie。API 移除旧 Authorization，
响应强制 `Cache-Control: no-store`。gateway 不校验 session，Cookie/Origin 的实际验证由下游所有者执行。

所有现有 upstream route 都使用明文 HTTP，由 gateway 在边缘终止 TLS。代理把请求
host 规范为小写、移除端口后重写 `Host`，同时维护 `X-Real-IP` 与 `X-Forwarded-For`。
公网入站丢弃外部关联 header，建立 SDK root server span 和 requestId；向 upstream 注入
独立 client span 的 traceparent、有效 tracestate 与 x-request-id。响应只公开 X-Request-ID，
旧 trace-id 已删除。内部 HTTP/RPC 的校验由 telemetry 统一拥有。

## 配置边界

`GatewayConfig::from_env` 的配置分为四组：

- 对外 host 匹配；
- 后端与前端 upstream 地址；
- HTTP/HTTPS listener 地址；
- TLS certificate chain 与 private key 路径。

新增配置应先进入 `GatewayConfig`，再由 route 或启动代码消费；不要在多个模块重复读取
同一环境变量。配置缺失时当前实现会使用 `src/config.rs` 中的默认值，因此本地或部署
环境必须显式核对它们是否适合目标拓扑，尤其是线上域名、容器服务名和
`host.docker.internal`。

## TLS 与 HTTP 行为

gateway 同时注册 HTTP 和 HTTPS listener。HTTPS listener 启动时会读取配置中的证书链
与私钥，并启用 HTTP/2；文件缺失、不可读或无效会导致启动失败。

对受管理的 host，HTTP 请求会以 `301` 保留 path 与 query 跳转到 HTTPS：

- auth host 仅对 `/api*` 跳转；
- bookmarks、collections 与 main host 的所有路径都跳转。

TLS 在 gateway 终止后，当前 route 以非 TLS 连接访问 upstream。若将某个 upstream
改为 TLS，必须同时核对 peer 的 TLS 标志、SNI、证书信任与容器网络地址，不能只修改
URL 文本。

## 错误、日志与追踪

未知路由及代理故障返回受控 JSON error；已开始发送的响应不追加第二份 JSON。
代理不自动重试失败的 upstream 请求，避免响应丢失后重放写入。
所有路由的日志只包含静态 route、method、status、耗时和完成状态，不记录实际 URI、query、
body 或原始错误。`src/trace.rs` 持有 SDK server/client span，分别跟踪下行发送与 upstream
响应体 EOF；提前断开记 interrupted。无 exporter 仍可用 requestId 关联 stdout。
正常停止使用 0 秒额外宽限等待、最多 5 秒 runtime 排空；Pingora run 返回后显式执行
最多 5 秒的 SDK shutdown，初始化失败也释放 provider。
可选 OTLP 配置见 [Docker README](../../../docker/README.md#可选追踪导出)。

## 平台约束

完整实现只在非 Windows target 编译，Pingora 依赖也只对非 Windows target 启用。
Windows binary 只输出“不支持”提示，不会启动代理。生产镜像基于 Debian，因此平台
相关改动至少需要在 Linux target 或镜像环境验证；仅在 Windows 上成功构建不能证明
代理路径有效。

## 与 Compose 和 xtask 的关系

`docker/compose/docker-compose.yml` 中 gateway 的服务键当前是 `web`，镜像为
`suxiaoshao/gateway`，对外映射 HTTP/HTTPS 端口，挂载证书目录，并依赖 `login`、
`bookmarks` 与 `collections` 容器。服务键与 crate 名不同，排障时不要把 `web`
误认为旧 Nginx 容器。

main upstream 默认指向宿主机 `3000` 上的 portal。collections fallback 默认指向宿主机
`3001`，但当前 workspace 没有提供对应的 Vite 入口或启动脚本；它是外部或遗留前置
条件，使用该路由前必须提供服务或通过 `GATEWAY_COLLECTIONS_WEB_UPSTREAM` 覆盖。
在不支持 `host.docker.internal` 的环境中也必须显式提供可达地址。证书路径必须与
Compose volume 的容器内路径一致。

`xtask build` 构建 gateway 等服务镜像；`xtask compose` 读取 Compose 文件并按依赖
收敛 network、volume 和 container，但不构建镜像。修改 gateway 的镜像、端口、证书
挂载或依赖时，应同时检查 Dockerfile、Compose、xtask 拓扑解析和本 README。

## 就绪检查

`/gateway --check-ready` 请求本地 HTTP `/health/ready`，确认 login/bookmarks/collections 的内部就绪接口通过，再检查 TLS 监听端口可连接。该路径只允许 loopback 请求，外部请求返回 404，不透传给业务服务。探针不携带认证 Cookie，不改变会话，不依赖宿主前端或外部小说站点；它不替代证书有效期和完整 TLS 交互验证。

## 修改与验证

- route/config/proxy 变化：使用 `cargo test -p gateway` 与 `cargo clippy -p gateway`
  验证受影响的路由和 header 行为。
- listener 或 TLS 变化：验证本轮改变的协议或证书行为，优先复用受控测试；
  必要的实际监听验证使用测试证书和非 Windows 环境，无需因一处变化重测所有协议与失败路径。
- Docker 或 upstream 拓扑变化：检查 `docker/server/gateway.Dockerfile`、
  `docker/compose/docker-compose.yml` 与 xtask 的 build/compose 实现；需要实际启动时先
  确认 Docker daemon、镜像、证书、端口和宿主机前端服务可用。
- 无法执行依赖外部环境的验证时，明确记录未覆盖的 listener、route 或 upstream，而
  不把编译通过描述成端到端验证通过。
