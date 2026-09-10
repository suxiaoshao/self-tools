# Issue #105：前端配置、加载边界与构建检查

状态：**Completed**。实现与本轮最小充分验证已完成，可交付试用。
基线 `09c4146`，对应 [Issue #105](https://github.com/suxiaoshao/self-tools/issues/105)。
本计划涉及前端、网关和根级 CI，规范归各所有者 README，本文件记录本轮设计与交付条件。

## 目标与范围

让同一前端产物通过主站网关用于不同域名，首页不加载未进入的业务应用或编辑器；让生产构建、依赖边界、bundle 预算和 GraphQL 生成一致性成为可执行检查。

保留 #96 的同源 Cookie／Origin 认证、#98 的写入恢复与身份代次、#101 的草稿生命周期和 #103 的包／领域边界。图片来源、SSRF 与资源限制仍由 bookmarks 的现有图片代理拥有。数据库、secret、readiness 和 crawler 重构不在本轮范围。

## 改动前核对的事实

| 所有者与入口                                                                                                                                                | 现状与影响                                                                                                                                          |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| [portal Vite](../../../web/packages/portal/vite.config.ts)                                                                                                  | production base、server.origin 与 HMR 绑定 `sushao.top`；无法直接把同一产物迁往其他主站域名。                                                       |
| [认证请求](../../../web/packages/portal/src/features/auth/service.ts)、两个应用 Apollo 入口                                                                 | 已使用同源 `/api/...`，需要集中路径事实源，不能据旧 Issue 描述重新引入跨域认证。                                                                    |
| [图片 URL](../../../web/packages/bookmarks/src/utils/image.ts)、[网关路由](../../../server/packages/gateway/src/route.rs)                                   | 图片仍请求 `https://bookmarks.sushao.top/fetch-content`；main host 没有对应图片路由，不能只把 URL 改成相对地址。                                    |
| 两应用 `src/main.tsx`、portal `micro/index.ts`                                                                                                              | 菜单元数据与 App／页面实现静态相连，收集侧边栏菜单就会导入全部页面。                                                                                |
| [edit](../../../web/common/edit/src/index.tsx)、[初始化](../../../web/common/edit/src/init.ts)、[markdown 初始化](../../../web/common/markdown/src/init.ts) | Monaco 在编辑器模块导入时加载；Prism 及现有语言包静态导入，并调用全局 highlightAll。                                                                |
| [CI](../../../.github/workflows/ci.yaml)                                                                                                                    | 每个 main PR 已跑 web lint/test 和 Rust clippy/test；没有生产 build、bundle 或客户端 codegen 差异检查。                                             |
| 服务 `--export-schema` 与 `schema_matches_browser_contract`                                                                                                 | 已有无数据库的 SDL 导出和 Rust schema 对前端快照的回归，默认 Rust 测试已经覆盖。无需新造 SDL 导出器或复制同一个检查。                               |
| 五个服务镜像 workflow                                                                                                                                       | bookmarks/collections 已包含 graphql-common；仍需补 service-errors、telemetry 等实际传递依赖，移除 auth workflow 的过时 `server/common/errors/**`。 |

### 本轮测得的生产基线

通过现有 portal Vite 配置构建到临时目录，额外开启 manifest。源码与配置未修改；使用当前锁文件和 pnpm 11.20.0 安装的依赖。

| 指标                                          |  原始字节 | gzip 字节 |
| --------------------------------------------- | --------: | --------: |
| HTML 入口及递归静态 imports 的 JS，按文件去重 | 5,210,422 | 1,380,831 |
| 同一入口闭包的 CSS                            |   252,998 |    39,411 |
| editor worker 产物                            |   280,014 |    85,408 |
| 最大产物 ts.worker                            | 6,895,078 | 1,475,306 |

入口只有一个 JS 文件；Monaco 的不少语言和 worker 已另有产物。因此目标是消除启动时的静态重依赖，不能声称所有 worker 都在首屏请求，也不能把所有 dist 文件之和当作首屏体积。以上是本地构建、逐文件 gzip 的可复现体积，不是网络耗时或 Lighthouse 分数。

## 一、配置与图片入口

### 前端配置合同

独立叶子包 `web/common/runtime-config`，无 React、Apollo、i18n 或应用依赖，仅导出不可变的同源路径：

```ts
export const endpoints: Readonly<{
  auth: '/api/auth/';
  bookmarksGraphql: '/api/bookmarks/graphql';
  collectionsGraphql: '/api/collections/graphql';
  imageProxy: '/fetch-content';
}>;
```

portal 的 auth service 和各应用请求适配器直接消费；custom-graphql 的 `getClient(url)` 保持通用。业务图片 helper 用 URLSearchParams 编码原始来源 URL，返回根相对路径。同步 manifests、lockfile 和 workspace-boundaries 的允许依赖。

这些路径是当前网关公共合同，不作为任意远程 endpoint 开关。生产部署的域名、TLS、后端地址仍由 gateway 环境变量控制，认证服务与两个 API 的 `AUTH_ORIGIN` 必须同步该主站 Origin；前端 production base 固定 `/`，部署在主站根路径。当前路由大量使用根绝对地址，本轮不宣称支持子目录部署。

当前场景无需浏览器启动时额外 fetch 配置，也无需 window 全局配置或运行期替换 JS。不同域名的 staging、自托管和生产使用同一产物与相同网关路径即可。若将来需要不同路径或跨域部署，应另行明确认证与路由合同。

### 开发期注入

portal 的 Vite 配置集中解析 `WEB_DEV_ORIGIN` 和 `WEB_DEV_PORT`：

- port 默认 3000，范围为合法 TCP 端口；保持 strictPort。
- origin 可选，必须是仅含 http/https scheme、host 和可选端口的 Origin，不接受凭据、路径、query 或 fragment。
- 提供 origin 时，由同一个 URL 派生 server.origin、HMR host、协议和 clientPort；HMR listener 使用开发端口。不再分别写多份域名。
- 未提供时使用 Vite 的请求来源推导；只允许默认开发 host 或显式配置的 host，不设 allowedHosts=true。
- 配置只用于 dev，不进入 browser endpoint 包或生产 bundle；提供 `.env.example`，保持 `.env.local` 未跟踪。本地 HTTPS 联调仍需要既有网关、证书和后端，普通 HTTP 预览不成为认证例外。

Vite env 值是构建期替换，不能把 `VITE_*` 当运行期注入；参见 [官方环境变量说明](https://vite.dev/guide/env-and-mode)。

### 图片的同源 HTTP 路由

在 main host 的 portal fallback 前增加**精确** `/fetch-content` 路由，转发到 bookmarks，保留路径与 query，无需 URI 重写：

```http
GET /fetch-content?url=<URLSearchParams 编码的原始图片来源>
```

复用现有 GET／HEAD、二进制 Content-Type、流式响应、缓存及错误合同。来源允许列表、DNS／重定向检查、响应体预算、超时和安全错误继续由原 handler 控制；不添加任意目标代理。

该路由属于图片流量，保持现有非认证代理的 Cookie 过滤：session 与 ceremony Cookie 不传往图片 upstream，也不把图片响应强制改为认证 API 的 no-store。trace 使用固定 `/fetch-content` 标签，不能误归类为 GraphQL，日志不记录 query 中的来源 URL。

旧 bookmarks host 的 `/fetch-content` 保持其现有对外合同；本轮不删除其他调用方仍可能使用的旧 host 路由。上线顺序为先部署支持同源图片的网关，再切前端产物；旧前端继续可用。若恢复旧网关，必须同时恢复旧前端图片配置／产物。同步 gateway、web 与受影响 Docker 说明，不自动部署本机服务。

## 二、加载边界

### 路由与 Provider

保留 `MicroConfig`／Menu／PathItem 接口以及当前 URL、菜单顺序和领域所有权。两应用的 package 入口只静态导入元数据、React lazy 声明和类型：

- App 通过模块顶层的 lazy 动态导入，Apollo client 和 CollectionsProvider 只随所属应用进入。
- 页面 lazy 声明放在各 feature 的公开 `index.ts`；它在自身领域内动态导入 list/details/fetch。根 main.tsx 继续从 feature 公共入口导入，不绕过边界，也不让一个动态 barrel 同时静态导入全部页面。
- collections 的跨领域 collection-browser 按 page 单独加载。
- portal 保持组合根；认证 gate 继续包围业务路由，generation 改变时旧树仍卸载。不同页面切换保留所属 App Provider，同一应用的集合树查询不因页面 Suspense 重新初始化。
- 安全设置可按路由加载；公开登录和全局认证运行时保持可用。目录入口拆分时避免登录页静态导入 Security。

共享 `ui/async-boundary` 仅组合 React ErrorBoundary 与 Suspense，调用方提供界面文案：

```ts
export interface AsyncBoundaryProps {
  children: React.ReactNode;
  pending: React.ReactNode;
  failed: React.ReactNode;
  resetKey?: string | number;
}
export function AsyncBoundary(props: AsyncBoundaryProps): React.JSX.Element;
```

portal 提供局部加载占位和路由加载失败后的显式重新加载入口；不会自动无限刷新。边界放在页面／应用内容处，保留外层导航，不把整站重新初始化。resetKey 可在路由或认证代次变化时清除错误视图；单纯 reset 边界不能保证重试已被 React.lazy 缓存的失败 import，失败操作须体现实际行为。[React lazy](https://react.dev/reference/react/lazy) 与 [Suspense](https://react.dev/reference/react/Suspense) 为接口依据。

### 编辑器

`edit` 和 `edit/form` 保持当前公开 props 与 ref 语义，类型 import 不带入 Monaco 运行时。内部实现和主题／worker 初始化位于动态导入之后：

- 只在编辑器实际挂载时加载 Monaco；列表页导入创建／编辑按钮不能提前载入 Monaco。
- 外层 RHF、草稿、已提交快照和结果未知状态保留原所有者，不随加载占位卸载。加载失败提供绑定同一 value/onChange/readOnly 的普通文本框，用户仍能保存草稿，不要求通过整页刷新丢弃输入。
- 表单 ref.focus 在加载中记录聚焦请求，完成后聚焦真实输入；取消或切换会话后迟到的加载不得重新打开旧视图。
- 模块加载成功可复用，但 editor/model/listener/worker 仍按既有实例生命周期清理。仅加载代码不创建 worker；保留已用的语言、主题、ARIA 和 readOnly 能力。
- 不为体积数字删除现有语言支持；先消除未使用的 service/worker 静态入口，再按真实产物确认哪些 worker 会在使用时启动。

### Markdown 与 Prism

正文先按现有 Markdown 组件显示，高亮作为增强：仅存在代码块时加载 Prism core／插件；无代码块的正文不加载高亮器。把全局 highlightAll 改为当前实例容器的处理，避免多个 Markdown 实例互相改写。

语言加载复用 [Prism 官方 autoloader](https://prismjs.com/plugins/autoloader/)，使用本地锁定版本资源，不使用 CDN：

- 保留当前显式支持的语言与别名，依赖关系采用 Prism 的 metadata／autoloader；不自行猜测 TSX、markup-templating 等依赖顺序。
- portal 构建／开发适配器从已安装 Prism 包提供当前语言及其依赖闭包的 grammar assets，路径包含依赖版本；dev 与 production 使用同一资源集合。
- 组件只向支持的语言触发加载，未知语言保留纯文本；同一语言复用进行中的加载，失败不自动循环请求。
- 语言或 value 变化后处理当前节点；卸载、过时的异步完成不作用于旧 DOM。保留复制反馈、行号和主题能力，样式随高亮器加载。
- 无法加载高亮资源时正文与复制仍可用，不将增强失败变成整页错误。

## 三、可执行预算与 CI

### 体积检查

开启 Vite manifest，并用构建插件输出只含模块归属、静态 imports、动态 imports 与产物路径的报告。它来自本次 bundle，不手写维护一份 chunk 名称表；不公开绝对本机路径。

`pnpm build:check` 由现有 build 加预算检查组成。检查规则：

1. 从 HTML 入口递归遍历静态 imports，JS/CSS 分别按产物路径去重并逐文件 gzip，报告原始与压缩体积；不能只量入口文件本身。missing manifest、缺文件和预算超限均退出非零。
2. 入口静态 JS ≤ 450 KiB gzip，CSS ≤ 60 KiB gzip。分包实现已达标，实际体积见交付记录。
3. 同时断言入口静态模块闭包不包含应用页面实现、Monaco、Prism grammar 或 worker；路由加载不因预取全部路由而绕过这项规则。报告各路由、编辑器、worker、grammar 及总产物体积，避免把增长藏进异步块。
4. 根据首轮实测设置异步预算：路由静态增量 ≤ 256 KiB（最大约 127 kB），编辑器 ≤ 1100 KiB（约 935 kB），单 worker ≤ 1600 KiB（最大约 1.48 MB），单 grammar ≤ 8 KiB（最大约 3 kB），总产物 ≤ 6 MiB（约 5.35 MB，包含所有 worker 与字体）。单一配置归 `web/config/bundle-budget.json`，不会自动提高超限阈值。

不按 `500 kB` 通用告警机械拆 vendor，不预先指定 Rolldown 的所有 chunk；优先让动态 import 自然产生边界。manifest 的 imports／dynamicImports 含义按 [Vite 文档](https://vite.dev/guide/backend-integration)；browser network 检查补充确认“产物独立”确实对应“首次不请求”。

### GraphQL 事实源与生成检查

保持现有链路：Rust code-first schema → `--export-schema` → 前端 `schema.graphql` → 手写 operation → 各包 generate → `src/gql/`。

- Rust job 继续运行已有快照和 browser_operations 测试，复用现有 SDL 导出入口。无需数据库、真实认证或公网才能检查 schema／operation。
- JS job 增加两个 package 的生成漂移检查。现有生成物受 oxfmt 格式化，不能直接用原始 `graphql-codegen --check`；[官方文档](https://the-guild.dev/graphql/codegen/docs/config-reference/codegen-config) 明确指出格式化会造成原始输出比较误报。
- 两包 `generate` 的唯一流程为 codegen 加临时生成目录的 oxfmt，再同步受管输出，排除生成目录和测试 fixture 的 documents 扫描；正常生成与 CI 使用完全相同的入口。
- 根 `pnpm graphql:check`：在临时目录生成并按相同规则格式化，比较受管输出的文件集合与内容；新增、删除和更改均算漂移，失败给出生成命令。不会改写或清理开发者现有 `src/gql/`。不能只比较已跟踪文件而漏掉新生成文件。
- 正常输出与检查输出使用同一配置工厂，只切换输出目录；scalars、preset 与 documents 保持单一事实源。

### CI 与镜像消费者

保留 `.github/workflows/ci.yaml` 对所有 main PR 的触发，避免因前端 path filter 漏掉 Rust 共享 GraphQL 变化。web job 在 lint/test 基础上运行上述生成检查、生产构建和预算；server job 沿用已有 schema／operation 覆盖。

更新五个服务镜像 workflow 的 paths，按各服务 manifest 的运行期 workspace 依赖闭包覆盖实际消费者：重点补 service-errors、telemetry 及 middleware 的传递依赖，保留已经存在的 graphql-common／service-query／service-db 触发。auth 的 GraphQL dev-dependency 影响 PR 测试，不据此认定为生产镜像运行依赖。

路径过滤只决定是否重建，不能改变 image/tag、构建上下文、secret、网络或部署方式。不为本轮新增自动推送前端站点；生产 bundle 作为 CI 可验证产物。

## 实施顺序与最小充分验证

1. **同源配置与网关图片路由**：先完成生产者／消费者合同及所有者文档，再接入前端路径包；验证图片路由优先级、敏感 Cookie 过滤、原 handler 限制保持和不同 host 的静态产物加载。
2. **路由和编辑器边界**：保留 MicroConfig 与 Provider 生命周期，拆懒入口，检查首屏／列表无 Monaco 和无关应用请求，打开编辑器后再加载，草稿与 focus 不回退。
3. **高亮增强与预算**：保留正文和复制，验证有／无代码块、带依赖语言的首次加载及失败降级，记录真实构建体积并启用预算。
4. **生成链路与 CI**：复用 SDL／schema 回归，统一 generate 格式化并完成临时比较，补镜像消费者 paths。用临时副本演示遗漏生成物和超限会失败，不修改真实工作区制造故障。

交付试用只要求受影响类型／lint／边界／生产 build、关键现有回归和上述直接浏览器行为。新增测试仅用于已有覆盖无法保护的关键逻辑，例如预算图遍历、生成文件集合比较和图片路由 Cookie 边界；纯配置与脚本接线优先实际命令验证。不因完整设计清单扩展为每个字段／页面的新单元测试，不自动做全 Docker／数据库验收。

实施与本机部署验证结果见下方记录；未执行数据库变更。

## 交付记录

- 已接入 runtime-config、主站精确图片路由、开发 Origin 配置、应用／页面／Monaco 懒加载，以及本地按需 Prism grammar。
- 生产入口静态 JS 为 **806,705 bytes / 261,040 bytes gzip**，CSS 为 **103,716 bytes / 16,880 bytes gzip**；首屏 JS 相比改动前约减少 81%。以同一 Node gzip 方法重测的基线为 1,388,621 bytes。全部产物 gzip 为 5,348,251 bytes；worker 产物不等于首屏请求。
- `pnpm lint`、前端 60 项测试、`pnpm build:check`、两个包的 `generate` 与 `pnpm graphql:check` 通过。Vite 配置和构建适配器也纳入 TypeScript 检查；React Compiler 只处理 JS／TS 源文件，工具 `.mts` 由 Vite 处理。
- gateway 的 5 项测试与 Clippy 通过；新增回归覆盖图片路由精确匹配、fallback 优先级和敏感 Cookie 过滤。预算测试覆盖静态闭包去重、缺失输入、超限、重依赖混入，以及生成文件增加／删除／内容漂移。
- 桌面 Chromium（1440×1000）使用真实生产资源、受控 API 响应验证：主页和两个应用列表不请求 Monaco／高亮器，集合应用切页仅一次集合树查询，编辑器延迟加载保留草稿，TSX／Python 本地依赖高亮与复制正常；焦点转交另由回归测试覆盖。
- 同一产物在 `127.0.0.1:4173` 和 `localhost:4173` 通过检查；模拟 editor／Prism 加载失败仍可编辑、预览和复制，模拟路由资源失败保留导航，显式刷新恢复。正常流程没有控制台错误；注入失败只出现预期资源错误。截图核对了延迟输入、高亮和纯文本降级。
- 现有 `127.0.0.1:3000` 开发服务的启动、路由、Monaco 输入与预览通过。浏览器验证使用已有 Playwright；没有安装浏览器依赖，没有向真实业务 API 写入数据。
- 后续本机部署已通过 gateway healthy、受信任 HTTPS 首页／匿名会话 200，以及同源图片路由返回真实 JPEG 的验证。只替换 web 容器，其他服务容器 ID 保持不变；开发 Origin 写入未跟踪的 `.env.local`。未执行真实登录写入、数据库变更或移动端验证。域名变更仍须同步 `AUTH_ORIGIN` 与网关配置。
