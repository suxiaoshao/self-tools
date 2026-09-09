# Issue #104：操作安全、可访问性与表单反馈

状态：**Done**。前端实现、受影响检查与关键浏览器验证已完成。
基线 `59f3bc1`，对应 [Issue #104](https://github.com/suxiaoshao/self-tools/issues/104)。
本计划只涉及前端应用与共享包，因此位于 `web/docs/dev/`；当前架构见 [web README](../../../README.md)。

## 目标与范围

让删除操作在执行前说明对象和影响，让用户能通过键盘和可访问名称操作界面，并看到与当前语言一致的字段错误、请求状态与恢复入口。

复用 #98 的 WriteOutcome、useWriteAction / useBookmarkWrite 和现有只读核对，不改变服务端错误合同、认证代次隔离或 Apollo 查询策略。
保留 #101 的 Item 草稿、初始关联和短视口布局，以及 #103 的包与领域所有权。运行配置、分包与 CI 归 #105，crawler 归 #107。

## 实施基线与处理范围

| 入口                                                                                                                                                                                                                                                                    | 已确认现状                                                                                        | 本次处理                                                       |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [ItemActions](../../../packages/collections/src/features/item/components/ItemActions.tsx)、[作者列表](../../../packages/bookmarks/src/features/author/list/index.tsx)、[集合操作](../../../packages/bookmarks/src/features/collection/components/CollectionActions.tsx) | 删除菜单直接调用 mutation；请求层已有阻止并发与不确定写入重放的能力，但触发控件和确认流程未统一。 | 在领域操作外增加确认视图，复用写入状态。                       |
| [小说详情](../../../packages/bookmarks/src/features/novel/details/index.tsx)                                                                                                                                                                                            | 删除评论直接执行；部分图标仅有 Tooltip，没有显式名称。                                            | 评论删除确认与图标名称。                                       |
| [创建作者](../../../packages/bookmarks/src/features/author/list/components/CreateAuthorButton.tsx)、[创建小说](../../../packages/bookmarks/src/features/novel/list/components/CreateNovelButton.tsx)                                                                    | required 规则没有消息或 FieldError；FieldLabel 未关联输入；自定义作者选择器的必填失败不够可见。   | 字段消息、关联标识、无效状态与焦点。                           |
| [collections 集合表单](../../../packages/collections/src/features/collection/components/CollectionForm.tsx)                                                                                                                                                             | 服务端字段错误已映射，但 required 消息可能为空，description 的错误未展示。                        | 补齐已有校验与服务端错误的展示。                               |
| [TableActions](../../../common/custom-table/src/TableActions.tsx)、[Dialog](../../../common/ui/src/components/dialog.tsx)、[Sidebar](../../../common/ui/src/components/sidebar.tsx)                                                                                     | Open menu、Close、Loading 与部分读屏文案绕过翻译。                                                | 按所有者接入语言资源。                                         |
| [错误页](../../../packages/portal/src/components/Error/index.tsx)                                                                                                                                                                                                       | 未匹配路由显示“没有项目”的英文空状态。                                                            | 正确的本地化 404 与返回首页入口。                              |
| [useWriteAction](../../../common/custom-graphql/src/feedback.tsx)、[useBookmarkWrite](../../../packages/bookmarks/src/useBookmarkWrite.tsx)                                                                                                                             | 已处理 pending、身份变化、结果未知及只读核对。                                                    | 沿用状态语义，不再另建请求状态机。                             |
| [安全设置](../../../packages/portal/src/features/auth/Security.tsx)                                                                                                                                                                                                     | Passkey 删除已有独立操作弹窗、再认证和结果核对。                                                  | 保留流程，仅补本轮发现的语义或文案缺口，不叠加第二个确认弹窗。 |

## 操作安全合同

### 哪些操作确认

以下删除必须先显示对象名称和影响，再由明确的删除按钮执行；缺少名称时显示本地化资源类型和 ID，不为文案增加查询：

| 操作               | 确认中说明的影响                                         |
| ------------------ | -------------------------------------------------------- |
| 删除 Item          | 删除条目内容及集合关联。                                 |
| 删除集合（两应用） | 删除所选集合及全部子集合，移除关联；保留条目／小说本身。 |
| 删除小说           | 删除小说、章节、阅读记录、评论及集合关联。               |
| 删除作者           | 同时删除该作者的小说及上述相关记录。                     |
| 删除标签           | 删除标签并从小说上移除该标签；保留小说。                 |
| 删除小说评论       | 删除评论正文；不影响小说。                               |

影响文案以已核对的服务实现为准：[作者](../../../../server/packages/bookmarks/src/application/author.rs)、[小说](../../../../server/packages/bookmarks/src/application/novel.rs)、[集合](../../../../server/packages/bookmarks/src/application/collection.rs)、[条目](../../../../server/packages/collections/src/application/item.rs)。不展示未经查询支持的数量，不提供服务端不支持的 Undo。

移除单条集合关联、切换单章已读状态继续直接操作，提供明确名称、pending 和错误反馈。已有批量阅读编辑弹窗的提交继续作为确认，不重复叠加弹窗；Passkey 删除沿用现有确认和再认证。

### 确认与结果生命周期

- 打开确认时固定操作类型、目标 ID、名称和影响说明。取消、Escape 不发请求；初始焦点在取消，关闭后回到触发控件，触发控件被删除时回到所在列表的稳定入口。
- 确认按钮通过既有写入 hook 执行；pending 时禁止再次提交、切换目标和关闭确认。菜单项、图标按钮同时反映 disabled 状态，不仅依赖 hook 的内部拦截。
- 已确认成功才关闭／导航并触发读取刷新。刷新失败由读取反馈处理，不能显示成写入失败或重发 mutation。
- 已知拒绝或确定失败保留确认及安全错误信息，允许取消或按原合同重试。
- 结果未知时保留原目标，禁用再次删除，并显示只读核对入口。允许关闭视图，但写入状态由未卸载的领域操作拥有；重新打开同一目标仍显示核对状态。不得通过重建弹窗或切换其他行清除不确定状态。
- 删除与编辑各自拥有操作状态；不要复用一个会被另一操作覆盖的 recovery 引用。身份代次切换及页面卸载继续遵守现有失效规则。

## 所有权与跨包接口

### 共享确认视图

`common/ui` 使用已安装的 Base UI AlertDialog，沿用现有 base-nova Dialog 样式，提供 `ui/confirmation-dialog`。官方 registry 读取失败，因此未通过 CLI 引入或覆盖其他组件。它只拥有展示、焦点与关闭约束，不持有 GraphQL、实体 ID 或写入结果：

```ts
export interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description: React.ReactNode;
  confirmLabel: string;
  cancelLabel: string;
  pending: boolean;
  confirmDisabled: boolean;
  onConfirm: () => void;
  notice?: React.ReactNode;
  returnFocus?: () => HTMLElement | null;
}
export function ConfirmationDialog(props: ConfirmationDialogProps): React.JSX.Element;
```

普通确认按钮不使用会立即自动关闭弹窗的 action 行为；关闭由调用方确认结果后控制。`confirmDisabled` 包括结果未知等领域限制。调用方保证 onConfirm 的异步异常进入现有写入反馈。

各 feature 的删除组件拥有 hook、目标与恢复函数，列表／详情传入当前对象和刷新回调。表格菜单仍由 custom-table 展示；其文本项增加可选 `disabled?: boolean`，传递给 DropdownMenuItem；`triggerId` 为确认关闭提供稳定返回入口。作者、小说和标签的操作列使用 display cell，避免 accessor 缓存旧的禁用状态和操作闭包。不引入全局命令总线、确认 Promise 服务或跨 feature mutation。

### UI 基础文案

保持 `ui` 不依赖 i18n。增加 `ui/locale`，只接收普通字符串：

```ts
export interface UiMessages {
  close: string;
  loading: string;
  breadcrumb: string;
  more: string;
  toggleSidebar: string;
  sidebarTitle: string;
  sidebarDescription: string;
}
export function UiLocaleProvider(props: { messages: UiMessages; children: React.ReactNode }): React.JSX.Element;
```

UI 内部 context 提供英文默认值，各组件保留调用方显式传入 aria-label 等属性的优先级。portal 在现有语言运行时内通过 useI18n 构造 messages；切换语言时更新同一份 provider 值。实现时同步 ui exports 和所有可达消费者，依赖方向不变。

custom-table、collection-tree 等已有 i18n 依赖的包直接使用 useI18n；业务图标、404、表单和 Markdown 复制反馈由实际所有者翻译。Markdown 如需 useI18n，显式声明其已有允许方向的 i18n workspace 依赖。未使用 primitive 中的演示默认文本不作为本轮全量改造目标。

### 表单与公共错误

各 feature 继续拥有 RHF / Valibot 规则和生成变量类型。为已有 required 等规则提供翻译消息，不建立第二套业务约束来源。统一使用 Field 的 data-invalid、输入的 aria-invalid、FieldError，以及稳定的 id / htmlFor / aria-describedby；自定义选择器把这些属性传到实际可聚焦控件。

优先处理创建 Author / Novel、抓取 Author / Novel、collections 的 Collection 表单，再补 Tag、关联选择、评论、主题／语言表单的实际缺口。采用应用内联校验的表单使用 noValidate，避免浏览器原生提示遮盖 RHF 消息；保留 Enter 提交和首个无效控件聚焦。Monaco 通过既有 ref focus 接口聚焦。

服务端 validation 仍通过已有 rejectionFieldErrors 投影，按本表单字段白名单映射到 setError；无法归属字段的错误留在 WriteNotice。useBookmarkWrite 可暴露其现有 outcome / pending，让表单读取字段错误，不复制请求状态。

WriteNotice 增加可选 `fieldLabels?: Readonly<Record<string, string>>`：调用方传入已翻译的字段路径到标签映射，优先完整路径、再根字段、最后使用通用字段错误文案。资源类型、公共错误码的翻译继续归 custom-graphql / i18n；不展示服务端原始 message，不把协议字段名直接当作面向用户的标签。

## 语义与组件选择

- `<Button><Link /></Button>` 改为具有 buttonVariants 样式的 Link / a，保留链接语义。实际操作继续使用原生 button。现有 Sidebar 的 useRender 导航实现按最终 DOM 判断，不能机械改写所有 render 用法。
- Theme / Language 的 DialogTrigger 渲染实际 SidebarMenuButton，列表项放在外层；Tooltip、Dialog 组合保持单个可聚焦触发点。修正章节弹窗中孤立 li 等明确结构问题。
- 图标按钮提供翻译后的 aria-label，删除、移除关联等名称包含对象上下文；Tooltip 只补视觉提示。已读开关、编辑／预览切换等同样有可访问名称。
- Avatar 使用恰当的 alt 和 fallback；列表有相邻名称时避免重复播报，详情图像保留对象信息。
- 保留已有组件的样式、受控接口和有效定制，只补本次行为所需的 primitive 与属性。

官方依据：[AlertDialog](https://ui.shadcn.com/docs/components/base/alert-dialog)、[Base UI AlertDialog](https://base-ui.com/react/components/alert-dialog)、[Button 链接语义](https://ui.shadcn.com/docs/components/base/button#as-link)、[Field 校验](https://ui.shadcn.com/docs/components/base/field#validation-and-errors)。已通过 shadcn docs CLI 确认项目使用 Base UI 文档；实施增加组件前执行 dry-run，核对目标为 common/ui，不覆盖其余组件。

## 实施顺序与交付验证

1. **共享基础**：确认视图、UI 文案 provider、TableActions disabled，接入 portal；同时同步 exports 与实际消费者。
2. **删除流程**：先在 collections 完成列表／详情／混合页，再接入 bookmarks 的集合、作者、小说、标签和评论，核对各自级联文案和结果恢复。
3. **界面收口**：修复链接／按钮组合、图标名称和图片 fallback；补齐上述表单反馈、404、可达共享文案，更新 web README。

实现阶段完成受影响的类型／lint 检查和生产构建，复用现有写入、身份及表单覆盖。浏览器检查以实际操作为主：

- 取消删除不发请求；确认后只发一次；pending 和结果未知不能重复删除；成功、失败及只读核对反馈位置正确。
- 作者／集合等删除显示准确影响；操作对象与确认标题一致。用临时记录验证并清理，保留原业务数据。
- 键盘进入菜单、确认焦点、Escape／焦点恢复；导航保留链接角色，图标名称可辨认，控制台原有触发器语义警告消失。
- 缺少必填值或收到字段拒绝时显示本地化错误并能恢复提交；中英文切换、404、复制反馈与短视口按钮可见性正常。

这些是设计需保护的行为，不自动变成逐项新增单元测试。样式、标签、配置调整以手动检查和实际命令验证；只有实现中出现已有覆盖无法保护的关键逻辑，才判断是否需要补充针对性自动化覆盖。无需为本轮前端交付重跑后端或 Docker 全量验收。

## 本轮交付与验证

- 实现覆盖上述删除确认、独立写入状态、UI 语言 provider、表单反馈、可访问名称与链接语义；小说“查看列表”改为实际路由 `/bookmarks`。未改变 GraphQL operation、后端 schema、数据库或部署配置。
- 类型、Oxlint、Knip、包边界、格式及 diff 检查通过；portal 生产构建通过，保留既有的大 chunk 提示，分包归 #105。
- 复用 7 个现有测试文件，21 项回归通过：写入反馈、身份代次、共享表格、集合选择、collections Item 创建／编辑与 bookmarks 集合。未新增单元测试。
- 在本地 HTTPS 网关 `https://sushao.top` 使用内置浏览器验证：作者、评论和集合删除确认及取消；初始取消焦点、Escape、菜单焦点恢复；作者／小说必填消息、首个错误字段焦点；中英文切换及已有错误的语言更新；404 返回首页；1280×720 与原窄视口下弹窗和表单滚动。
- GraphQL 请求在发送前拦截并模拟网络失败，确认 pending 禁止再次提交与关闭、结果未知禁用其他行删除、原目标重新打开仍保留核对入口。拦截已清理，语言设置恢复为跟随系统，视口恢复原尺寸。
- 本轮未执行真实删除或修改现有业务记录；成功与只读核对的核心结果语义由已有回归覆盖。未做完整辅助技术或跨浏览器验收。
