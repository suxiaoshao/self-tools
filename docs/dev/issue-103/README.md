# Issue #103：前端包与领域所有权

状态：**Completed**。实现与必要验证完成，可交付试用。
对应 [Issue #103](https://github.com/suxiaoshao/self-tools/issues/103)，设计基线 `dbfd605`。
稳定架构与命令入口见 [web README](../../../web/README.md)。

## 目标与边界

让 manifest、公开入口和实际依赖方向一致，消除 common 对应用的反向引用，以及 Collection / Item
互相借用内部实现。涉及前端 workspace、检查配置、pnpm lockfile 与 shadcn 所有权。
保留 portal 唯一 Vite 入口、路由 / 菜单、认证代次隔离、Apollo 查询策略、写入恢复和 Item 草稿合同。
没有服务 SDL、数据库、部署拓扑变化；#104 的交互安全、#105 的运行配置与分包、#107 的 crawler
测试不在本次范围。用户已有 `packageManager` 改动保留独立。

## 已实现的所有权

| 所有者                                 | 当前职责与公开面                                                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `common/ui`                            | 32 个既有 shadcn 组件、cn、UI 断点 hook、主题 store / 系统监听。公开 `ui/components/*`、`ui/lib/utils`、`ui/theme`、`ui/fonts.css`。保留本地样式和组件合同。 |
| `common/hooks`                         | 无领域语义的 useDialog / useTitle，保持原生命周期。                                                                                                          |
| `common/i18n`                          | 语言运行时、资源、状态与 hooks；菜单移到 `portal/features/language`。                                                                                        |
| `common/edit`、`common/markdown`       | 可复用表单编辑器与 Markdown，消除业务包间的组件借用。                                                                                                        |
| `common/collection-tree`               | CollectionOption、树投影、受控单选 / 多选视图；仅依赖 UI / hooks / i18n 等基础能力。                                                                         |
| 两应用 `entities/collection`           | 各自 document、CollectionsProvider、useAllCollection、RHF 多选 wrapper；不共享请求或 ID 命名空间。                                                           |
| collections `features/item`            | Item 创建 / 编辑 / 删除、详情与列表；删除 document、Item 结果投影和恢复查询归内部 model。                                                                    |
| collections `features/collection`      | 集合创建 / 编辑 / 删除及领域结果投影与恢复查询。                                                                                                             |
| collections `pages/collection-browser` | 混合查询、表格、行类型分派与刷新组合，通过 ItemActions / CollectionActions 公开组件操作。                                                                    |
| bookmarks 各 feature                   | Author / Novel / Tags / Collection 的操作和恢复查询归本领域；统一 writeResult 仍由应用写入 hook 共享。                                                       |
| 根 `web/config`                        | 共享测试环境与跨应用 Provider 回归、可执行 workspace 边界校验。                                                                                              |

feature / entity 对外只通过 index.ts；feature 不依赖 peer feature 或 page，entity 不依赖 feature / page。
领域目录与内部职责目录统一小写。应用私有 alias 只供本包使用；跨包一律走 exports，并声明依赖。
旧路径一次性切换消费者，没有兼容 re-export 层。删除确认无消费者的 MicroState 等公开面。

## 关键合同与取舍

- portal 可以组合应用与 common；两个业务包互不依赖；common 基础层不引用高层组合或应用。
  允许方向由 `workspace-boundaries.mts` 维护。UI 不依赖 i18n 或 GraphQL。
- UI 组件仅开放 `components/*` pattern，以便 shadcn CLI 正确解析工作区；utils / theme 为显式入口，
  不开放整个 src。两份 components.json 指向同一份共享组件与 portal CSS，Tailwind 仍扫描整个 web。
- 主题 API 与 color / colorSetting 存储键不变。语言菜单归 portal，状态仍归 i18n。
- 集合树保留 parentId 分组、输入兄弟顺序与 path，不修复服务端层级。单选重复点击仍选定同一 ID，
  多选去重追加 / 移除。disabled 禁止增删并隐藏已打开弹层；实际行为由关键回归覆盖。
- Provider 保留 no-cache、禁用请求去重、写后新请求、取消过时执行和失败重试；各自位于 ApolloProvider
  内并随认证代次重新挂载。共享视图只接收成功快照，RHF wrapper 保留 value / onChange / onBlur / ref。
- Item 创建仍一次提交名称 / 正文 / 初始关联；编辑只写名称和正文，关闭重开使用独立草稿。
  ItemActions 在混合页允许编辑，在独立列表保持原有删除操作。领域恢复查询保持原 fetchPolicy。
- 修复 custom-graphql barrel 与反馈模块的模块环：实现移到 client.ts，公开 index 只组合导出。
- 运行依赖、codegen / Vite 依赖移到真实所有者；共享测试与检查工具留在根。维持既有运行时版本。
  Monaco 第三方主题 JSON 沿用原有已声明依赖的本地资源入口，没有修改已安装包。

## 可执行约束与生成物

Oxlint 的原生反例探测能拦截应用 alias，但不能完整拦截跨包相对路径，因此增加基于现有 Oxc parser 的
聚焦校验，接入 `pnpm boundaries` 和 `pnpm lint`。它解析 static / type import、re-export、字面量动态
import，校验依赖声明、公开 exports、相对路径、应用内领域方向、common 层与 workspace 环。
UI / gql 的风格例外不豁免该检查。Oxlint `import/no-cycle` 补充模块环检查，Knip 检查依赖和公开面。
正反例覆盖合法组合、反向引用、private subpath、alias / 相对路径绕过、peer feature、层级与包环。

移动手写 operation 后通过两个应用的 generate 入口重新生成。collections 原输出 `src/gql/index`
不满足当前 client preset 的目录要求，修正为既有生成物所在 `src/gql/`。不改 SDL、operation 名称、
variables 或 selection。生成后的排版通过仓库 formatter 统一。

## 验证与交付

前端交付要求 `pnpm lint`、`pnpm test`、`pnpm build`；复用认证、请求反馈、Provider 和 Item 表单回归，
补充集合树 / 选择与边界规则回归。执行两个 generate 并核对生成 diff，以及 shadcn info / add dry-run。

必要浏览器范围：portal 启动、两应用路由、主题 / 语言同步、集合选择及 Item 创建 / 编辑 / 关闭重开，
包含短视口提交按钮可见性。使用临时记录并清理。没有后端合同变化，不重跑 Rust 或 Docker 全量验收。

本轮验证结果：

- `pnpm lint` 通过（格式、边界、Oxlint、Knip、TypeScript）。
- `pnpm test`：16 个文件、52 项回归通过，包含 11 项边界用例和 4 项共享树 / 选择用例。
- `pnpm build` 通过；保留既有大 chunk 提示，生产分包归 #105。
- 两应用 `generate` 通过；181 个具名生成声明与基线内容一致，仅因输入路径改变而重排。
- shadcn `info --json` 识别共享包 32 个组件，`add button --dry-run` 目标为 `common/ui/src/components/button.tsx`，未覆盖组件。
- 在本地 HTTPS 环境 `https://sushao.top` 使用 Codex 内置浏览器验证 1280×720 与 1280×520：
  路由和混合页、主题 / 语言跨应用同步、两应用独立集合选择、Item 创建 / 初始关联 / 编辑保存 /
  关闭重开、混合页操作及删除清理通过。520px 高度编辑提交按钮位于 y=456..488，完整可见。
- 新建临时 Item 已删除，主题和语言均恢复原先跟随系统模式，临时标签与视口覆盖已清理。
- 没有白屏或 Vite 错误覆盖层；控制台保留主题 / 语言 DialogTrigger 包裹 li 的既有 Base UI nativeButton
  语义警告，属于 #104 范围。本轮未执行后端全量或多浏览器验收。
