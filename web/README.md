# 前端子系统

前端是由根目录 `pnpm-workspace.yaml` 管理的 React workspace。`web/packages/*` 放置产品功能包，`web/common/*` 放置共享能力；实际脚本、依赖和 package export 以根目录及目标包的 `package.json` 为准。

## 包与职责

| 目录                    | 职责                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `packages/portal`       | 唯一的 Vite 应用入口与组合根；负责全局 Provider、顶层路由、登录、主题、导航和共享 UI 源码。 |
| `packages/bookmarks`    | 书签业务模块；默认导出实现 `MicroConfig` 的 `BookmarkConfig`，由 `portal` 组合。            |
| `packages/collections`  | 收藏业务模块；默认导出实现 `MicroConfig` 的 `CollectionConfig`，由 `portal` 组合。          |
| `common/types`          | 跨包类型，以及 `MicroConfig`、菜单和路由接入契约。                                          |
| `common/custom-graphql` | Apollo Client 创建、同源 Cookie 请求、认证失效通知和错误处理。                              |
| `common/custom-table`   | TanStack Table 的表格、分页和 column helper 封装。                                          |
| `common/details`        | 详情页展示组件和类型。                                                                      |
| `common/edit`           | Monaco Editor 封装及其样式入口。                                                            |
| `common/i18n`           | i18next 初始化、语言状态、翻译资源和公共 hooks。                                            |
| `common/time`           | Day.js 初始化与时间格式化工具。                                                             |
| `config/test`           | Vitest 的共享测试环境配置。                                                                 |

共享包不等于与应用壳完全解耦：当前部分 `common/*` 与功能包会直接引用 `@portal/*` UI、主题或工具。调整包边界时，应以实际依赖方向为准，并同步更新所有消费者与 `tsconfig.json` 路径映射。

## 运行与组合链路

`portal` 是唯一拥有 Vite 配置和 `dev`/`build` 入口的 package。启动链路为：

```text
portal/src/main.tsx
  -> portal/src/App.tsx（i18n、主题、Tooltip、BrowserRouter）
  -> portal/src/components/AppRouter.tsx
  -> portal/src/micro/index.ts
  -> bookmarks / collections 的 MicroConfig
  -> 各功能包的 App、菜单和子路由
```

`MicroConfig` 接口定义在 `common/types/src/micro.ts`。新增可组合功能包时，应实现该契约并在 `portal/src/micro/index.ts` 注册；不要为功能包另建一套独立应用入口，除非任务明确要求改变当前组合架构。

## GraphQL 客户端代码

`bookmarks` 和 `collections` 分别维护自己的 GraphQL 客户端输入与生成物：

- `schema.graphql`：客户端 codegen 使用的 schema 输入；运行时 API 的最终契约仍由对应后端 schema 决定。
- `src/**/*.ts`、`src/**/*.tsx` 中的 GraphQL operation：业务查询和 mutation 的手写事实源。
- `codegen.ts`：输入范围、scalar 映射和输出位置配置。
- `src/gql/`：生成物，只能通过目标包现有的 `generate` script 刷新，不应手工修改。

schema、operation 或 codegen 配置变化时，在受影响的 package 运行 `generate`，检查生成 diff，再执行适用的前端验证。若后端 schema 同时变化，应同步更新客户端的 `schema.graphql`，避免前后端各自保留不同契约。

## shadcn/ui 与样式所有权

`packages/portal/components.json` 是本仓库 shadcn CLI 配置，组件源码位于 `packages/portal/src/components/ui/`，全局样式入口为 `packages/portal/src/styles/globals.css`。这些组件是仓库拥有并可定制的源码，不应把 registry 版本视为可以无差别覆盖的副本。

处理组件选型、API、迁移、CLI 或 registry 时，先从 [shadcn/ui llms.txt](https://ui.shadcn.com/llms.txt) 定位当前官方文档，并结合仓库的 `.agents/skills/shadcn/`。更新组件前先判断本地差异是有意定制还是过期实现，并保留仍有价值的本地行为。

## 地址配置现状

认证和 GraphQL 使用当前主站的相对 `/api/...` 路径；Vite `base`、开发 HMR 和部分资源地址仍使用 `sushao.top` 相关域名。这是现状，不是新增代码应复制的配置方式。新增或调整服务地址时，优先建立集中且可按环境切换的配置入口，并一次性更新相关消费者；不要把线上域名继续散落到新文件。

## 登录与会话边界

portal 启动清除旧 localStorage `auth` 并查询 `/api/auth/session`，明确区分 checking、
anonymous、authenticated 和 unavailable。登录页以 Passkey 为主，密码表单按需展开；
添加、命名和删除移到 `/settings/security`，超过 5 分钟先再认证并继续操作。
密码和 Passkey 登录都只接收用户与有效期，session token 由 HttpOnly Cookie 持有。
服务端退出成功后才更新页面状态；请求未确认时保留错误和重试入口。

所有请求携带 `X-Self-Tools-Request: 1`，修改请求用 JSON；同源 Origin 与 Cookie 规则由
[后端](../server/README.md#管理员会话与通行密钥) 拥有。WebAuthn options 和 response 的
Base64URL 转换集中在 Auth service，不把原始 Credential 对象直接 JSON.stringify。
未支持、取消、无 Passkey 时可使用密码，不自动反复唤起认证。

共享 `custom-graphql` 只对 HTTP 401 通知 portal，通过请求代次避免旧 401 清除新登录。
登录/退出/重新初始化时中止旧业务请求、清 Apollo cache，并清两个集合树的内存投影；
受保护路由随代次卸载。403、503、业务错误和密码错误不触发全局退出。
安全操作只允许一个 pending 流程，卸载/取消中止等待；已到达服务器的变更仍需刷新状态确认。

## 图片来源兼容

bookmarks 的现有 `getImageUrl` 和图片标签继续调用 `/fetch-content`。服务端仅接受已核验的起点、晋江封面与作者头像来源，并规范化为 HTTPS；未知来源及失败图片沿用现有组件或浏览器的加载失败效果，不添加自动重试。不能把页面装饰图、读者头像或任意图床地址当成支持来源。新增 CDN 模式由后端图片策略拥有，并需官方页面证据和测试。

图片或遗留跨域入口的页面 Origin 使用 `CORS_ALLOWED_ORIGINS`；认证与 GraphQL 必须经配置的主站 HTTPS Origin，不提供 HTTP localhost 认证例外。配置规则、限额和网络前置条件见 [后端说明](../server/README.md#图片代理与跨域来源)。

## 命令与验证

- 根级脚本以根目录 `package.json` 为准，package 级脚本和 exports 以目标包的 `package.json` 为准；可用 `pnpm run` 和 `pnpm --filter <package> run` 查看当前入口，不在本文复制完整清单。
- 根目录 `knip.json` 是 unused files、exports、types 和 dependencies 的配置事实源。删除依赖前先检查打包、codegen、语言服务和 CLI 等隐式消费者；生成代码与基础 UI 的既有忽略项不应在业务代码中重复处理。
- 前端检查入口为 `pnpm lint`；开发阶段按受影响文件和包选择其中必要的格式、lint、类型检查，具体参数以脚本或工具帮助为准。
- 行为或测试配置变化时运行受影响的测试；`pnpm test` 是仓库测试入口。
- Vite、生产 bundle、package export 或构建链路变化时，选择能覆盖受影响产物的构建；`pnpm build` 是整体入口。
- 验证阶段与停止条件遵循根 `AGENTS.md`。文档改动检查修改文件的格式和 `git diff --check`；依赖浏览器、域名、后端或其他外部服务的验证无法执行时，应明确说明未覆盖范围。
