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

`build_routes` 返回有序列表，代理使用第一个同时匹配 host 与 path prefix 的条目。
prefix 使用字符串 `starts_with`，且转发时不重写 path。

| host 角色        | path 条件   | upstream 角色           |
| ---------------- | ----------- | ----------------------- |
| auth host        | `/api*`     | `login` HTTP 服务       |
| bookmarks host   | 任意路径    | `bookmarks` HTTP 服务   |
| collections host | `/graphql*` | `collections` HTTP 服务 |
| collections host | 其他路径    | 外部/遗留前端服务       |
| main host        | 任意路径    | portal 前端服务         |

collections 的 GraphQL 条目必须位于前端 fallback 之前。新增重叠 prefix 时同样需要先写
更具体的规则，并为优先级补测试。未匹配请求返回 `404`。

所有现有 upstream route 都使用明文 HTTP，由 gateway 在边缘终止 TLS。代理把请求
host 规范为小写、移除端口后重写 `Host`，并向 upstream 传播或生成 `traceparent`、
`x-request-id`、`trace-id`；同时维护 `X-Real-IP` 与 `X-Forwarded-For`。修改这些 header
时要同步检查下游 middleware 的解析约定。

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

## 修改与验证

- route/config/proxy 变化：执行 `cargo test -p gateway` 与 `cargo clippy --all`，并用
  代表性 host/path 覆盖命中、优先级、redirect、404 和 header 传播。
- listener 或 TLS 变化：除 Rust 检查外，在具有测试证书的非 Windows 环境验证 HTTP、
  HTTPS、HTTP/2、证书链和启动失败路径。
- Docker 或 upstream 拓扑变化：检查 `docker/server/gateway.Dockerfile`、
  `docker/compose/docker-compose.yml` 与 xtask 的 build/compose 实现；需要实际启动时先
  确认 Docker daemon、镜像、证书、端口和宿主机前端服务可用。
- 无法执行依赖外部环境的验证时，明确记录未覆盖的 listener、route 或 upstream，而
  不把编译通过描述成端到端验证通过。
