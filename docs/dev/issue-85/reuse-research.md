# Issue #85：旧实现替代与 Table V9 迁移调研

2026-09-10 的实施前调研依据；版本与源码描述以调研基线为准。当前实现、实测结论和保留项见 [实施结果](./README.md)。

## 结论与本次升级范围

**TanStack Table 纳入本次依赖升级范围，目标为 `8.21.3 → 9.2.4`。** 完成条件包含迁移 V9 API、删除 CustomTable 的 `use no memo` 和旧解释、精简列类型与 core row model 配置，并验证实际编译后的刷新行为。保留 V8 包装且只提高版本号不算完成；不采用长期 legacy 入口。

其他值得优先替换的实现是主题模式管理、手写页面标题、Markdown 排版、原生 select 和编辑器降级文本框。作者／标签选择器、导航、404、会话空态等已使用 shadcn，文件创建时间早不代表实现仍然过时。替代应能删除职责重复的代码，或统一可访问性与主题行为。

## Table V9：可以删除什么，仍需维护什么

### 已核实的支持与所有者

[官方迁移指南](https://tanstack.com/table/latest/docs/framework/react/guide/migrating)说明 V9 使用 TanStack Store 并支持 React Compiler；[9.2.4 标签中的 Compiler 指南](https://github.com/TanStack/table/blob/%40tanstack/react-table%409.2.4/docs/framework/react/guide/react-compiler.md)明确解释了 V8 需要退出编译器、V9 `useTable` 可以正常编译的区别。

已读取 [9.2.4 发布包元数据](https://registry.npmjs.org/%40tanstack%2Freact-table/9.2.4)及包内 `dist/useTable.js`、类型定义。目标依赖 `@tanstack/table-core 9.2.4`、`@tanstack/react-store ^0.11.1`，要求 Node ≥20、React ≥18。发布实现根据 options 和选中状态返回 React 层的新值；内部 core table 仍是稳定对象。这不是仅凭文档版本号推断兼容。

当前唯一直接依赖所有者是 `web/common/custom-table`。八个渲染入口为：

| 应用        | 表格入口                                                                 |
| ----------- | ------------------------------------------------------------------------ |
| bookmarks   | 作者列表、小说列表、标签列表、集合列表、小说详情章节、小说抓取结果章节。 |
| collections | Item 列表、集合混合浏览列表。                                            |

以上入口都只传入 core row model；查询分页由应用持有。当前没有使用 Table 的排序、过滤、列隐藏或 rowSelection 状态。章节批量操作属于业务动作，不能据其名称自动添加 Table rowSelection feature。

### 替换与删除清单

| 当前实现                                                                                                                                            | V9 方案                                                                                                                 | 删除或简化范围                                                                                                                               |
| --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| [CustomTable](../../../web/common/custom-table/src/index.tsx) 使用 `useReactTable`，整段渲染退出 Compiler。                                         | 改为 `useTable`，由共享包定义实际需要的 features，继续使用已有 shadcn Table。                                           | 删除 `use no memo`、旧注释，并更新 `web/README.md` 的 V8 契约说明。                                                                          |
| 各页面重复 import／构造 `getCoreRowModel()`。                                                                                                       | V9 自动包含 core row model。                                                                                            | 删除八个入口的参数、import 和共享 re-export；`getFilteredRowModel`、`getPaginationRowModel` 当前只有共享 re-export、没有消费者，也一并删除。 |
| [columns.ts](../../../web/common/custom-table/src/columns.ts) 手写 `AccessorFn`／`DeepKeys`／`DeepValue` 条件类型和 accessor／display／group 签名。 | 使用 V9 `createColumnHelper<TFeatures, TData>()` 与 `helper.columns([...])`；把 HTML 单元格属性放入 typed column meta。 | 删除手写 `CustomColumnHelper` 泛型接口和为扩展顶层属性而复制的类型；仅保留项目的 meta、features 和必要的类型别名。                           |
| `cellProps`／`headerCellProps` 放在 ColumnDef 顶层，渲染时断言为 CustomColumnDef。                                                                  | `tableFeatures({ columnMeta: metaHelper<CellPresentation>() })`，列使用 `meta: { cellProps, headerCellProps }`。        | 同步迁移现有列声明；渲染从 columnDef.meta 取值，消除两处自定义列断言，保留表头属性回退到 cellProps 的既有规则。                              |
| `row.getVisibleCells()`，但没有任何列隐藏配置／控件。                                                                                               | 当前产品可用 core 的 `row.getAllCells()`；确实需要隐藏时才注册 columnVisibilityFeature。                                | 不为沿用一个方法名引入未使用功能；不会机械使用 stockFeatures。                                                                               |
| 每个页面以 useMemo 拼装几乎相同的 options，并用数组断言宽化列类型。                                                                                 | features 在共享包定义，页面提供 columns／data；先用上游 helper 保留列值类型。                                           | 可删除纯粹服务于 V8／稳定 options 的机械包装与断言；仅在确认该组件被 Compiler 编译且无其他引用契约后移除对应 useMemo。                       |

列 meta 与 helper 的可行性已核对 [固定版本 column helper](https://github.com/TanStack/table/blob/%40tanstack/table-core%409.2.4/packages/table-core/src/helpers/columnHelper.ts)、[meta helper](https://github.com/TanStack/table/blob/%40tanstack/table-core%409.2.4/packages/table-core/src/helpers/metaHelper.ts)和发布类型。新的类型参数会传递到八个调用方，不能只修改包装文件。`createTableHook` 也是现成的可组合接口，但当前无需为了迁移新增一整套 Context／注册组件；简洁的共享 features 与渲染器已足够。

### shadcn Data Table 如何使用

[当前官方 Data Table 指南](https://ui.shadcn.com/docs/components/base/data-table)已使用 V9；它提供 TanStack + shadcn Table 的组合方式，并没有可以完全接管本项目数据流的通用成品 DataTable。现有包装已经使用 shadcn Table，因此应精简数据／类型胶水并对齐上游组合方式，而非复制支付表格示例中的筛选、排序、选择与客户端分页。

布局、单元格属性、业务操作列和分页入口仍由项目维护。操作列依赖当前写入状态时继续使用 display cell，不把动作回调塞入 accessor 的值缓存；Compiler 支持并未改变这条业务数据边界。

### 分页可以复用，但不能产生两份状态

[usePage](../../../web/common/custom-table/src/usePage.ts)保存 1-based 页码、pageSize，派生 offset／limit；[TablePagination](../../../web/common/custom-table/src/TablePagination.tsx)自行计算页数和边界。这里有两层不同的收益：

1. 基础 V9 迁移先保留服务端页码契约，删除 `limit = useMemo(() => pageSize)` 等没有额外语义的派生包装。无分页的两个章节表仍显示全部传入章节。
2. 若本批同时收敛分页控制，让应用持有唯一受控 `PaginationState`，Table 注册 `rowPaginationFeature`，设置 `manualPagination: true` 并传入 rowCount；控件消费 Table 的页数／前后页能力。GraphQL 边界把 0-based 转成现有 1-based，只转换一次；绝不再对服务器返回的一页数据执行客户端切片。[官方分页契约](https://tanstack.com/table/latest/docs/framework/react/guide/pagination)

第二项需要同步查询变量和页面状态，应作为明确的表格子范围实施；不要求为了删除 `use no memo` 同时重构所有分页。改 pageSize 时保持首条可见行还是回到第一页也属于产品行为，不能意外继承不同默认值。

页码跳转目前使用 Popover + Command + useDialog + 手写选中勾号，可由已安装的 Combobox 接管选择交互。它仍需页码数据，不能声称替换组件就解决了 `Array.from({ length: pageCount })` 的大页数开销。若采用新加的 [Pagination](https://ui.shadcn.com/docs/components/base/pagination)展示导航，应保留任意跳页和每页条数能力，按按钮语义处理禁用，避免默认 anchor 修改 URL hash。固定的 picker／rows-per-page ID 改为实例级 ID，避免多表实例冲突。

### 删除 Compiler 退出指令的必要验证

- 复用现有 [同一行更新与删除回归](../../../web/common/custom-table/src/index.test.tsx)，并检查列文案／操作禁用随状态和语言变化更新。
- 完成类型检查、受影响列表测试与生产构建；在确实经过 React Compiler 的构建中确认同 ID 改名、删除、刷新和服务端翻页后的 DOM。测试名字带 “under React Compiler” 不能代替转换覆盖证据。
- 如果后续把 row／cell／table 传给独立子组件并从其稳定对象读取变化状态，在读取处使用 Subscribe 或把选中值作为普通 prop 传入；不要给每个 cell 无条件加订阅。当前包装直接在 useTable 所在组件渲染，可先沿用默认订阅。

V9 方法绑定规则也要按对象区分：row／cell／column／header 的方法依赖实例调用；迁移指南明确 table 方法不属于该限制，不能把当前对 table.getRowModel 的解构误报成必然错误。为可读性改为 table.xxx 调用可以，但应准确说明理由。

## 可替代的旧实现：按实际删除收益排序

| 优先级与位置                                                                                                                                             | 替代能力及当前可用性                                                                                                                       | 建议与边界                                                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 高：[themeSlice](../../../web/common/ui/src/theme/themeSlice.ts)、[CustomTheme](../../../web/common/ui/src/theme/CustomTheme.tsx)                        | `next-themes 0.4.6` 已在 UI 包安装；本地类型支持 ThemeProvider、storageKey、attribute、theme／resolvedTheme。                              | 让 next-themes 唯一拥有 light／dark／system、系统监听、持久化与根节点 class。删除对应的 Zustand 模式字段、selector、matchMedia 监听及手写 class effect；项目特有的 color 和 theme-color meta 继续单独保留。                                                                   |
| 高：[useTitle](https://github.com/suxiaoshao/self-tools/blob/c83a5cef1c41ae00ebadec48f435cdbb02e97805/web/common/hooks/src/useTitle.ts) 与 12 个页面调用 | 已安装 React 19 支持原生 `<title>` 提升到 head。                                                                                           | 用页面 `<title>{单个字符串}</title>` 替代 hook，删除渲染期间 document.title 写入、prevTitleRef 和卸载恢复 effect。根 HTML 默认标题、未设置标题的页面及 Suspense 切换一起协调，保证同时只有一个有效标题。[React 文档](https://react.dev/reference/react-dom/components/title)  |
| 高：[Markdown](../../../web/common/markdown/src/index.tsx)                                                                                               | shadcn [Typeset](https://ui.shadcn.com/docs/typeset) 是可纳入仓库的 CSS；当前尚未添加。                                                    | 用一个 typeset 容器与本地 CSS 替代 H1–H4、P、Blockquote、普通列表／行内 code 的纯样式 wrapper，让 renderer 正常保留标题 ID 等属性。保留代码块复制、Prism 延迟加载与当前容器隔离；交互工具栏按需退出排版样式。无需增加另一套 Markdown parser 或高亮库。                        |
| 中：CreateNovelButton 的 novelStatus／site、CreateAuthorButton 的 site，共 3 个原生 select                                                               | shadcn [Native Select](https://ui.shadcn.com/docs/components/base/native-select) 可新增源码；现有 Select、RadioGroup、ToggleGroup 已安装。 | 推荐 NativeSelect／NativeSelectOption 保持当前 register、change、ref 与原生选择语义，统一主题和错误样式。若改为 Select 则需 Controller；不只换标签后继续机械 spread register。                                                                                                |
| 中：[编辑器降级框](../../../web/common/edit/src/index.tsx)                                                                                               | [Textarea](https://ui.shadcn.com/docs/components/base/textarea) 已安装，使用原生 textarea props。                                          | 替换手写 textarea 的边框／焦点／无效态样式，保留 ref、pending focus、草稿、readOnly 和 aria 属性；覆盖其内容自适应尺寸以满足编辑器固定容器。不能用普通 Textarea 替代整个 Monaco 功能。                                                                                        |
| 中：[请求反馈](../../../web/common/custom-graphql/src/feedback.tsx)                                                                                      | Button 已安装，shadcn [Alert](https://ui.shadcn.com/docs/components/base/alert) 尚未添加。                                                 | RequestNotice／WriteNotice 的 div 和原生按钮可替换为 Alert／Button，保留全部错误分类、requestId、未知写入结果与只读核对。当前 custom-graphql 清单和 common 依赖规则不允许依赖 UI，实施须同步声明／边界；UI 不依赖 custom-graphql，可保持单向依赖。不能只改 JSX 后忽略所有权。 |
| 中：[路由加载反馈](../../../web/packages/portal/src/components/RouteBoundary.tsx)                                                                        | Spinner、Empty 已安装。                                                                                                                    | 加载文案可组合 Spinner，失败展示可复用 Empty 与现有 Button；保留 PageToolbar、页面滚动边界与明确 reload 动作。AsyncBoundary 的错误捕获与 resetKey 仍有职责，不能靠反馈组件删除。                                                                                              |
| 中：[确认弹窗](../../../web/common/ui/src/confirmation-dialog.tsx)                                                                                       | 现用 Base UI AlertDialog 原语，已安装；shadcn AlertDialog 样式源码尚未添加。                                                               | 可用 shadcn AlertDialog 的布局／标题／描述组件删去重复 Backdrop／Popup class，保留 pending 禁止关闭、默认取消焦点、删除行后回退焦点和异步确认语义。不能无条件使用点击即关闭的 Action 代替现有异步流程。                                                                       |
| 中：[分页选择](../../../web/common/custom-table/src/TablePagination.tsx)                                                                                 | Combobox 已安装，可替代 Popover + Command 的选择组合。                                                                                     | 删除本地选中勾号和开关胶水；保留搜索、跳页、语言、键盘与边界。是否进一步采用 Pagination 见前述表格范围。                                                                                                                                                                      |
| 已确定方向：[CollectionMultiSelect](../../../web/common/collection-tree/src/CollectionMultiSelect.tsx)                                                   | 已有 Dialog、Button、Checkbox、Breadcrumb、Badge 可组合分栏选择器。                                                                        | 将递归缩进树改为 Finder 风格的分栏浏览，保留集合层级、独立选择与确认；桌面三栏可视窗口，移动端单栏逐层进入。具体行为见下节。                                                                                                                                                  |

以上“高／中”表示本地收益，不表示已发生生产故障；所有候选尚未做渲染验收。

### 主题需要同步的消费者

当前 [Sonner 包装](https://github.com/suxiaoshao/self-tools/blob/c83a5cef1c41ae00ebadec48f435cdbb02e97805/web/common/ui/src/components/sonner.tsx)调用 next-themes 的 useTheme，但 portal 使用 CustomTheme，没有 ThemeProvider。代码上存在页面显式主题与通知回落到 system 的两套来源；本轮未做视觉复现。

推荐使用 `ThemeProvider attribute="class" storageKey="colorSetting" defaultTheme="system"` 延用旧存储键。主题设置表单读取 theme／setTheme，Monaco 读取 resolvedTheme。通知按 [配置与 API 审查](./platform-research.md)迁移为 Base UI Toast 并删除 Sonner；若分批实施期间仍保留 Sonner，则先放在同一 Provider 下。保留独立 `color` 存储和 theme-color，禁止用第二个 store 镜像同步 theme。非法旧值、首次加载和切换到 system 需要核对，现有颜色不会被 next-themes 自动管理。[next-themes 官方 API](https://github.com/pacocoursey/next-themes#api)

### 已在复用，或没有等价替代品

- AuthorSelect、TagsSelect 已用 Base UI Combobox；TagsSelect 已用 multiple／Chips。可以定向核对锚点和升级 API，但不能将它们列为“待从零替换的老选择器”。
- SessionGate、404 已用 Empty；Sidebar／Dialog／PageToolbar、按钮和大部分表单已是共享组件。现有 Details 持有 label/value/span 网格；Item 组件并非等价描述列表，不能为了删这个小包丢掉跨列布局。后续若改用 dl/dt/dd 是语义修整，不是库替代收益。
- CollectionSelect 已组合 Sidebar／Collapsible，按已确定的分栏方案替换其浏览视图；集合的层级、ID 与路径仍由领域数据提供。
- useDialog 只是小型受控状态接口；需要在提交成功后关闭、失败时保留时，Dialog 原语不会自动接管业务时机。只有无外部状态需求的个别调用适合用非受控 Root／Close 精简，不新增 hooks 库取代它。
- Apollo 的读取／写入错误投影、认证代次、未知结果核对、编辑草稿隔离，以及 Prism／Monaco 资源生命周期，均不是 shadcn 组件可替代的职责。现有 Dayjs 已处理时间格式，无需再引入日期库。

## 已确定的集合选择器方案：分栏浏览

将集合选择器的递归缩进树改为类似 Finder 的分栏浏览，解决层级越深、名称可用横向空间越小的问题。保留现有集合数据结构与“选择后确认”的操作方式；作者、标签等平铺数据继续使用 Combobox。本节定义已实现的产品方向；验证结果见实施总览。

### 浏览与布局

- 桌面使用较宽的选择对话框，替换多选入口当前的小 Popover。每列展示同一层级的集合，名称不随深度增加缩进。
- 三栏是可视窗口，支持任意深度。进入更深层时向右推进窗口；上方 Breadcrumb 保留完整浏览路径，点击祖先可返回对应层级。
- 点击集合浏览其子级，同时显示当前浏览位置。浏览路径与选择状态独立；展开父集合不会隐式提交选择，父集合本身也允许被选中。
- 手机使用单栏逐层进入，提供返回上一级和路径导航，沿用相同选择状态，不横向压缩三栏。
- 提供集合名称／完整路径搜索，可从搜索结果直接选择或定位到对应层级；同名集合显示完整路径，选择仍以 ID 标识。

### 选择与确认

- 单选与多选共用分栏浏览视图，分别以明确的选择控件设置候选或勾选项。查看子级与选中集合是两个独立操作。
- 多选结果集中显示在底部，使用完整路径区分同名集合，允许移除；跨层浏览、返回祖先和搜索时保留已选结果，并按 ID 去重。
- 对话框内维护临时选择，确认后才提交给调用方；取消关闭丢弃本次临时修改，重新打开从调用方当前值初始化。选择确认只更新表单或调用方状态，领域写入仍由原功能入口执行。
- 保留 disabled、字段错误关联和焦点语义；禁止编辑时不能增删或确认，关闭后焦点返回触发入口。保留现有接口中 null／空选择的含义，不因视图替换改变业务校验。

### 复用与所有权

Dialog、Button、Checkbox、Breadcrumb、Badge 等已有 shadcn 组件负责外观、基础交互和焦点设施；`collection-tree` 负责浏览路径、列窗口与临时选择，不新增另一套树组件库。替换 CollectionSelect 的 Sidebar／Collapsible 递归视图，以及 CollectionMultiSelect 的小 Popover／树选择提交组合；内部单字段表单若仅用于“必须选一项”的检查，可随新确认状态删除，业务表单的 RHF／Valibot 保留。

继续接收各应用的只读集合快照，保留兄弟顺序；不把 Apollo 查询、认证状态或跨应用 ID 命名空间移入共享选择器。两个应用的实体 wrapper 仍拥有 loading／error／retry 与 RHF 接口。现有单选调用方也复用新的分栏视图，避免保留两套集合导航实现。

必要回归覆盖深于三层的进入与返回、父集合选择、跨层多选／去重／移除、搜索同名路径、确认与取消、禁用状态、键盘操作和移动端返回。验证选择结果及焦点行为即可，不按每个基础组件重复建测试。

## 建议实施顺序与验证

1. V9 表格迁移与 Compiler 配合：先完成实际 API／类型／删除项，必要检查通过后交付列表试用；分页进一步收敛有独立范围。
2. 复用已安装能力：next-themes、React title、Textarea／Button；每项同步实际消费者与直接相关回归。
3. 添加确有收益的 shadcn 源码／样式：Native Select、Typeset、Alert／AlertDialog。加入后核对本地定制、语言、焦点与生产包体；不执行 add --all。
4. 按已确定方案改造集合选择器：共享分栏浏览、确认式单选／多选、路径搜索与移动端单栏；同步两个应用的调用方，并完成直接相关回归。

本轮只修改调研文档。Table 目标发布包仅解压到临时目录用于读源码，未安装到 workspace。`pnpm dlx shadcn@latest docs ...` 的本机入口出现反复追加 dlx 参数、无输出的异常，已停止本轮进程，改从 llms.txt 指向的官方文档核对；未修改工具配置或项目依赖。
