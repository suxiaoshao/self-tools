# 前端子系统

前端是由根目录 `pnpm-workspace.yaml` 管理的 React workspace。`web/packages/*` 放置产品功能包，`web/common/*` 放置共享能力；实际脚本、依赖和 package export 以根目录及目标包的 `package.json` 为准。

## 包与职责

| 目录                     | 职责                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| `packages/portal`        | 唯一的 Vite 应用入口与组合根；负责全局 Provider、顶层路由、登录、导航和主题 / 语言设置菜单。 |
| `packages/bookmarks`     | 书签业务模块；默认导出实现 `MicroConfig` 的 `BookmarkConfig`，由 `portal` 组合。             |
| `packages/collections`   | 收藏业务模块；默认导出实现 `MicroConfig` 的 `CollectionConfig`，由 `portal` 组合。           |
| `common/ui`              | 共享 shadcn 组件、`cn`、主题状态与系统主题监听。                                             |
| `common/hooks`           | `useDialog`、`useTitle` 等无领域语义的 hook。                                                |
| `common/collection-tree` | 纯集合树投影与受控单选 / 多选视图。                                                          |
| `common/markdown`        | Markdown 渲染及语法高亮。                                                                    |
| `common/request-errors`  | HTTP 公共错误运行时解码、请求失败分类与结果未知判定。                                        |
| `common/types`           | 跨包类型，以及 `MicroConfig`、菜单和路由接入契约。                                           |
| `common/custom-graphql`  | Apollo Client、同源 Cookie/认证边界、按路径的查询故障与写入反馈。                            |
| `common/custom-table`    | TanStack Table 的表格、分页和 column helper 封装。                                           |
| `common/details`         | 详情页展示组件和类型。                                                                       |
| `common/edit`            | Monaco Editor、表单编辑器及其样式入口。                                                      |
| `common/i18n`            | i18next 初始化、语言状态、翻译资源和公共 hooks。                                             |
| `common/time`            | Day.js 初始化与时间格式化工具。                                                              |
| `config/test`            | Vitest 的共享测试环境配置。                                                                  |

common 只能依赖共享层，不能引用应用。portal 通过 package 入口组合 bookmarks / collections，
两个业务包互不引用。跨包使用 manifest 声明的 package exports；`@portal/*`、`@bookmarks/*`、
`@collections/*` 仅供各自包内部使用，跨包相对路径也不可绕过公开入口。

应用内 `pages/` 负责跨领域组合，`features/<domain>/` 拥有领域操作、表单与单领域视图，
`entities/<domain>/` 拥有供多个 feature 使用的读取与选择适配。跨边界只通过 feature / entity 的
`index.ts`；peer feature 不互相依赖，entity 不依赖 feature / page。单文件能力不要求增加空目录。
collections 的混合列表位于 `pages/collection-browser`，通过两个 feature 的公开操作组件分派行行为。
领域恢复查询和 collections 的领域结果投影位于各 feature 的 `model/`；应用共用的结果判别保留在
应用 `results.ts`，bookmarks 的统一写入 hook 继续使用同一份 union 投影。

依赖由实际消费者声明：运行依赖在所属包，codegen 与 Vite 工具在各自应用，根包持有共享测试与检查工具。
Babel 的插件解析目录固定为 portal，使根目录测试入口也能使用 portal 声明的 React Compiler。
`web/config/workspace-boundaries.mts` 定义 common 层的允许依赖，检查声明、exports、层级和包环；
`pnpm boundaries` 是独立入口，也已接入 `pnpm lint`。检查包含 type import、re-export、字面量动态
import 和相对路径；生成物与 UI 的风格忽略不会豁免依赖边界。Oxlint 另检查模块环，Knip 检查依赖与公开面。

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

查询使用 `errorPolicy: all` 并显式处理 data/error；mutation 使用 `none`，成功 resolve 后由功能包
根据生成类型的 `__typename` 穷尽投影。共享层不弹全局业务 toast，也不显示服务端 message。
写入成功后的刷新属于独立读取；结果未知保留输入并禁用直接重放，已知标识的操作可只读核对，
新建结果缺少可靠标识时保留未确认状态并提供列表入口。认证 generation 变化会使旧请求结果失效。

bookmarks 全部 mutation 使用生成的 union 分支；已知标识的操作按当前目标只读核对。
批量阅读记录保留已成功阶段，后续失败不重放前一阶段。新建和抓取缺少可靠完成标记时提供列表入口。
主字段/关联的 null 与 error 分开处理，部分失败保留其他内容；表单内和页面分别显示安全提示，
不使用全局错误 toast。

共享 `CustomTable` 接收包含当前数据的不可变 `options`，在组件内部持有 TanStack 可变实例。
该组件显式退出 React Compiler 自动记忆化，避免稳定实例引用使刷新后的单元格停留在旧值。

## 集合查询与 Item 编辑

两个应用各由本应用 `entities/collection` 的 `CollectionsProvider` 持有集合树的 Apollo 查询，消费者共享查询状态，
Map/树从查询结果派生，不再复制到 Zustand。保持 `no-cache`，刷新通过同一 observable
重新执行，并禁用请求去重，确保写入后的读取不会复用写入前尚未完成的请求；被替代的读取
取消订阅，不允许迟到结果覆盖新结果。读取失败由使用该数据的页面或选择器显示并提供重试。

共享 `collection-tree` 只接收本应用的只读集合快照，保留输入兄弟顺序与 path；不拥有 Apollo、
业务 ID 命名空间或认证状态。实体层 wrapper 保留 RHF 接口与 loading / error / retry，
两个应用 Provider 始终独立。单选点击选定 ID，多选去重追加与删除；disabled 禁止增删并隐藏弹层。

列表使用服务端稳定页码分页；Item 列表 operation 只读取表格所需字段，正文由详情和
getEditItem 按需读取。服务端查询预算拒绝沿用 INVALID_REQUEST 的现有展示，不自动重试。

Item 创建将名称、正文和初始集合关联一次提交；编辑只修改名称与正文，关联由详情页的增删
操作独立维护。列表和详情共用编辑入口，每次打开只读取必要内容，读取成功后初始化一次草稿；
后台刷新不回填草稿，关闭或切换 Item 后重新开始。提交中的表单及结果未知的表单只读，
结果核对绑定实际提交快照；旧编辑会话完成不能关闭后来打开的会话。

## shadcn/ui 与样式所有权

共享源码与 shadcn 配置位于 `common/ui/`，组件通过 `ui/components/*` 公开，工具通过
`ui/lib/utils`、主题通过 `ui/theme`、编辑器与 Markdown 共用字体通过 `ui/fonts.css` 公开。组件目录的受限 subpath pattern 供 CLI 定位；不公开
`src/*`、私有 hooks 或其他内部目录。UI 包使用 `#components/*`、`#hooks/*`、`#lib/*` 作为内部 CLI alias。
`packages/portal/components.json` 指向共享 UI，应用全局 CSS 仍为 `packages/portal/src/styles/globals.css`，
页面尺寸 CSS 归 portal。主题运行时归 ui，菜单表单归 portal；i18n 仅拥有语言运行时与资源。

两份 components.json 的 style / iconLibrary / baseColor 保持一致。从 portal 执行
`pnpm dlx shadcn@latest info --json` 或 `add <component> --dry-run` 检查实际目标路径，再处理需要的源码。
这些组件是仓库拥有并可定制的源码，不应把 registry 版本视为可以无差别覆盖的副本。

Tailwind 的源码扫描根目录由 `globals.css` 的 `source()` 显式指定为 `web/`，覆盖业务包和共享包；
不依赖启动命令的工作目录，也不使用 Vite 插件不支持的 `base` 选项。

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

共享 custom-graphql 只对通过契约校验的 UNAUTHENTICATED 通知 portal，通过请求代次避免旧请求清除新登录。
登录/退出/重新初始化时中止旧业务请求并清 Apollo cache；两个集合树随认证代次卸载，
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
