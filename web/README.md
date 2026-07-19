# 前端子系统

前端是由根目录 `pnpm-workspace.yaml` 管理的 React workspace。`web/packages/*` 放置产品功能包，`web/common/*` 放置共享能力；实际脚本、依赖和 package export 以根目录及目标包的 `package.json` 为准。

## 包与职责

| 目录                    | 职责                                                                                        |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| `packages/portal`       | 唯一的 Vite 应用入口与组合根；负责全局 Provider、顶层路由、登录、主题、导航和共享 UI 源码。 |
| `packages/bookmarks`    | 书签业务模块；默认导出实现 `MicroConfig` 的 `BookmarkConfig`，由 `portal` 组合。            |
| `packages/collections`  | 收藏业务模块；默认导出实现 `MicroConfig` 的 `CollectionConfig`，由 `portal` 组合。          |
| `common/types`          | 跨包类型，以及 `MicroConfig`、菜单和路由接入契约。                                          |
| `common/custom-graphql` | Apollo Client 创建、认证请求头和统一错误处理。                                              |
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

当前 Vite `base`、开发 HMR、认证接口、GraphQL 地址和部分资源地址仍直接使用 `sushao.top` 相关域名。这是现状，不是新增代码应复制的配置方式。新增或调整服务地址时，优先建立集中且可按环境切换的配置入口，并一次性更新相关消费者；不要把线上域名继续散落到新文件。

## 命令与验证

- 根级脚本以根目录 `package.json` 为准，package 级脚本和 exports 以目标包的 `package.json` 为准；可用 `pnpm run` 和 `pnpm --filter <package> run` 查看当前入口，不在本文复制完整清单。
- 根目录 `knip.json` 是 unused files、exports、types 和 dependencies 的配置事实源。删除依赖前先检查打包、codegen、语言服务和 CLI 等隐式消费者；生成代码与基础 UI 的既有忽略项不应在业务代码中重复处理。
- 修改前端源码或配置后运行 `pnpm lint`。
- 修改行为、测试或测试配置时再运行 `pnpm test`。
- 修改 Vite、生产 bundle、package export 或构建链路时再运行 `pnpm build`。
- 修改 GraphQL 输入时，先运行受影响包的 `generate` script 并检查生成 diff，再运行上述适用检查。
- 文档改动至少运行格式检查和 `git diff --check`；依赖浏览器、域名、后端或其他外部服务的验证无法执行时，应明确说明未覆盖范围。
