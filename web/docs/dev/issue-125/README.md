# Issue #125：导航入口与页面操作栏统一

- 状态：`Done`。页面接入、高度修复与必要验证已完成。
- 所有者：`web/common/ui`、`web/common/custom-table`、`web/packages/portal`、`web/packages/bookmarks`、`web/packages/collections`。
- 需求：[Issue #125](https://github.com/suxiaoshao/self-tools/issues/125)；用户已确认使用共享 PageToolbar，将导航按钮与页面操作放在同一行。
- 当前架构：[前端 README](../../../README.md)；计划入口：[前端索引](../README.md)、[根索引](../../../../docs/dev/README.md)。

## 目标与基线

现有 AppDrawer 已提供侧栏入口、移动端导航后关闭和焦点恢复，但导航按钮独占一行，页面自己的返回、添加、刷新等操作又占一行。目标是每个应用页面只有一条包含导航入口的页面工具栏；操作的业务逻辑仍由原页面拥有。

本轮基线包含已经实现的视口高度修复：应用内真实小说详情曾在 600px 视口形成 648px 页面，外层滚动会带走导航栏；固定外壳高度并去掉详情页 `h-screen` 后，实际页面高度恢复为 600px，滚动到底部仍保留导航。工具栏整合必须保留这条高度约束。

本计划覆盖 AppDrawer 内的 13 个页面及其路由加载／错误回退。页面内的筛选、表格、详情卡片和弹窗继续拥有各自功能；不调整 URL、菜单注册、认证、查询／mutation、生成物、依赖版本或部署。登录、会话检查及 AppDrawer 外的 404 页维持现有边界。

## 现有证据与取舍

| 入口                                                                                                                                                    | 当前结构与设计依据                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| [AppDrawer](../../../packages/portal/src/components/AppDrawer/index.tsx)                                                                                | SidebarProvider 下放置独立 header 与 Outlet；移除独立 header，保留状态和视口边界。        |
| [Sidebar](../../../common/ui/src/components/sidebar.tsx)                                                                                                | 已有 SidebarTrigger、独立移动端状态、可见关闭按钮和本地化标题；PageToolbar 直接复用。     |
| [RouteBoundary](../../../packages/portal/src/components/RouteBoundary.tsx)、[AppRouter](../../../packages/portal/src/components/AppRouter.tsx)          | 懒加载页面由嵌套边界处理；现在回退依赖外层 header 保留导航，需要同步接入工具栏。          |
| [小说抓取](../../../packages/bookmarks/src/features/novel/fetch/index.tsx)、[作者抓取](../../../packages/bookmarks/src/features/author/fetch/index.tsx) | 抓取和保存草稿位于筛选卡片的 CardAction，外层是真实 form；搬动按钮必须保留其表单归属。    |
| [路由与菜单组合](../../../common/types/src/micro.ts)                                                                                                    | MicroConfig 只负责应用、菜单和路由；页面操作依赖局部状态，不扩充 MicroConfig 来登记按钮。 |

采用声明式组合：PageToolbar 渲染公共导航入口，页面通过 children 提供自己的操作。按钮始终留在原页面的 React Provider 和 DOM 表单层级中，不引入全局按钮注册、effect 清理或跨层 Portal。此处只需要一个共享工具栏，不新增通用 PageLayout 或新的页面状态容器。

## C-01：共享工具栏与页面组合合同

新增手写组件 `web/common/ui/src/page-toolbar.tsx`，在 [ui/package.json](../../../common/ui/package.json) 增加显式导出 `./page-toolbar`，供以下消费者使用：

```text
portal AppDrawer：SidebarProvider、动态视口高度、导航关闭行为
  └─ 路由页面 / RouteBoundary 回退
       └─ ui/page-toolbar：SidebarTrigger + 页面提供的 children
            └─ 原页面操作组件：继续使用所在页面的 Provider、回调和状态
```

公开接口：

```tsx
import type { ComponentProps, JSX } from 'react';

export type PageToolbarProps = ComponentProps<'header'>;
export function PageToolbar(props: PageToolbarProps): JSX.Element;
```

- 消费方统一从 `ui/page-toolbar` 导入。组件内部先渲染一个 SidebarTrigger，再按原顺序渲染 children；转发 header 属性，合并 className，支持 ref。
- 必须位于已有 SidebarProvider 内，不由每个页面新建 Provider。组件复用 UiLocaleProvider 的 `toggleSidebar` 文案，不依赖业务 i18n、GraphQL 或路由包。
- PageToolbar 使用普通 header 语义和标准 Tab 顺序，不声明需要额外方向键交互的 ARIA toolbar。导航按钮明确为 `type="button"`，避免放入 form 时提交表单；保留 SidebarTrigger 的展开状态、弹窗语义和可访问名称。
- 统一工具栏间距、内边距和至少 48px 的行高，作为不收缩的 flex 子项。导航按钮不收缩；正常宽度下与操作按钮同行，窄屏操作过多时允许工具栏内部换行，内容区随工具栏实际高度收缩，不用固定偏移或负外边距对齐。
- children 直接参与工具栏 flex 排版，页面可沿用 `ml-auto` 或弹性间隔将刷新等操作放在右侧。数据加载、disabled、点击回调和成功／失败反馈仍由页面控制。

例如小说详情只需要用工具栏替换当前返回／刷新行：

```tsx
<PageToolbar>
  <Button type="button" aria-label={t('back')} onClick={() => navigate(-1)}>
    <ChevronLeft />
  </Button>
  <div className="flex-1" />
  <Button type="button" aria-label={t('refresh')} onClick={handleRefresh}>
    <RefreshCcw />
  </Button>
</PageToolbar>
```

示例只表达组合关系，按钮继续使用现有 variant、图标、大小和状态。

## 页面接入清单

各页面将原操作行替换为 PageToolbar，删除被替代的行级间距，保留内容区自身的 padding。只有页面级操作进入工具栏；评论编辑／删除、集合关联、章节已读开关、表格行菜单及详情卡片内操作仍留在所属内容中。

| 页面与实际实现                                                                                                | 工具栏内容与特殊处理                                                                               |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `/`：[Home](../../../packages/portal/src/features/home/index.tsx)                                             | 导航入口与首页标题；复用 `home` 文案。                                                             |
| `/settings/security`：[Security](../../../packages/portal/src/features/auth/Security.tsx)                     | 导航、现有安全设置标题、添加通行密钥；列表和重命名／删除／再认证流程留在内容区，避免重复页面标题。 |
| `/bookmarks`：[小说列表](../../../packages/bookmarks/src/features/novel/list/index.tsx)                       | 导航、添加小说、爬取、刷新。                                                                       |
| `/bookmarks/novel/:novelId`：[小说详情](../../../packages/bookmarks/src/features/novel/details/index.tsx)     | 导航、返回、刷新；保留已修复的父容器高度与内部滚动。                                               |
| `/bookmarks/novel/fetch`：[小说抓取](../../../packages/bookmarks/src/features/novel/fetch/index.tsx)          | 导航、抓取、保存草稿；移除筛选卡片中的重复操作，筛选字段保留原位。                                 |
| `/bookmarks/authors`：[作者列表](../../../packages/bookmarks/src/features/author/list/index.tsx)              | 导航、添加作者、爬取、刷新。                                                                       |
| `/bookmarks/authors/:authorId`：[作者详情](../../../packages/bookmarks/src/features/author/details/index.tsx) | 导航、返回、刷新；保留资料与小说列表的内容布局。                                                   |
| `/bookmarks/authors/fetch`：[作者抓取](../../../packages/bookmarks/src/features/author/fetch/index.tsx)       | 与小说抓取采用同一表单组合方式。                                                                   |
| `/bookmarks/collections`：[书签集合](../../../packages/bookmarks/src/features/collection/view.tsx)            | 导航、添加集合、刷新；面包屑保留在工具栏下方。                                                     |
| `/bookmarks/tags`：[标签管理](../../../packages/bookmarks/src/features/tags/view.tsx)                         | 导航、添加标签、搜索；保留原 `onSearch` 行为。                                                     |
| `/collections`：[条目列表](../../../packages/collections/src/features/item/list/index.tsx)                    | 导航、添加条目、刷新。                                                                             |
| `/collections/item/:itemId`：[条目详情](../../../packages/collections/src/features/item/details/index.tsx)    | 导航、返回、刷新；编辑等内容操作保留原位。                                                         |
| `/collections/collections`：[集合浏览](../../../packages/collections/src/pages/collection-browser/index.tsx)  | 导航、添加集合、条件显示的添加条目、刷新；面包屑保留在工具栏下方。                                 |

路由路径、懒加载入口和业务 Provider 保持不变。首页／安全页标题复用现有 `home`、`auth_security`，操作与图标名称复用各自页面当前键，覆盖现有中英文资源；不新增同义文案。

## 高度、回退与状态行为

### 高度与滚动

AppDrawer 保留 `h-dvh min-h-0` 和可收缩的 main／Outlet 区域，移除自己的 header 后将整个内容高度交给路由。路由根节点使用父容器高度和纵向 flex；PageToolbar 不收缩，页面内容区域使用 `min-h-0` 和剩余空间，长内容在页面内部滚动。不使用 `h-screen`，也不按固定 48px 手写高度差，因为窄屏工具栏可能换行。

接入时沿各页面自身的实际滚动结构处理：保留表格的横向滚动；抓取表单的输入和预览、作者详情的资料和小说卡片，以及安全设置的长列表都要能在剩余区域内访问到底部。不要让外层页面高度被内容撑开，也不要仅隐藏溢出来掩盖不可达内容。

### 加载、错误和空状态

- AppDrawer 内每个已渲染页面或其替代回退显示一个 PageToolbar。业务包 App 仍只组合 Provider／Outlet，不额外添加工具栏。
- RouteBoundary 的 pending 和 failed 均组合 PageToolbar 与回退内容；导航入口保持可用，失败时保留原来的显式重新加载操作。嵌套边界以实际替代内容为准，避免内外两层同时出现工具栏。
- 已加载页面的数据 loading、空结果、部分失败和资源不存在状态，保留本页工具栏；回退内容不得要求存在实体数据才渲染导航按钮。
- 当前根据 location key 关闭移动端侧栏的逻辑仍归 AppDrawer，保留当前页面链接和账号安全导航行为。菜单分组和主题／语言弹窗不触发关闭；页面切换不重建 SidebarProvider。

### 表单与操作生命周期

两类抓取页的 PageToolbar 放在原 form 内，抓取按钮继续 `type="submit"` 并走原 RHF／Valibot 校验；导航和保存草稿等按钮为 `type="button"`。回车提交、required 错误、加载禁用、保存草稿的结果未知保护保持原语义。

页面原有 mutation、refetch、删除确认及状态 hook 不搬到 PageToolbar，也不因布局调整添加重新挂载的 key。业务弹窗保留原 Provider 和触发关系；工具栏位于实际滚动区之外，焦点返回后操作入口仍可见。

## 实施顺序

1. **共享 UI 合同**：实现 PageToolbar 与显式 package export，复用 SidebarTrigger 和现有文案。建立组合、表单内导航不提交等关键行为覆盖。
2. **页面与壳层同步接入**：按清单迁移 13 个页面、RouteBoundary 回退和 AppDrawer；完成全部消费者接入后删除壳层独立 header。整个变更作为一次协调迁移，不保留两套工具栏或按运行时注册数量判断是否显示的兼容逻辑。
3. **回归与所有者文档**：调整受影响的测试挂载层，完成下述验证，并将最终高度、工具栏和回退合同同步到前端 README。

已知需要同步的现有测试：

- [AppDrawer 测试](../../../packages/portal/src/components/AppDrawer/index.test.tsx)：其占位 Page 需要使用真实 PageToolbar，继续覆盖导航后关闭、桌面状态及设置弹窗焦点恢复。
- [抓取表单测试](../../../packages/bookmarks/src/crawler-forms.test.tsx)：补充真实 SidebarProvider 挂载，继续验证两类抓取表单的 required、站点枚举和请求变量；补充导航按钮不触发表单提交的行为。
- [书签集合测试](../../../packages/bookmarks/src/features/collection/index.test.tsx)：补充真实 SidebarProvider，保留创建后页面与共享集合数据同时刷新的回归。

不通过 mock 掉 PageToolbar 或另建每页 SidebarProvider 来隐藏接入错误。没有 schema／operation 输入变更，不运行生成流程，也不升级组件或依赖。

## 最小充分验证

| 范围           | 必要证据                                                                                                                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 接入完整性     | 按 13 个路由与 RouteBoundary 清单核对工具栏位置、Provider 和分支；没有残留的独占导航行或重复操作按钮。                                                                                       |
| 关键交互       | 复用并调整上述回归，覆盖当前页面导航关闭、表单提交归属及加载／失败回退中的导航可用性；不以 CSS 类名断言代替布局验证。                                                                        |
| 实际界面       | 在应用内浏览器用真实页面和已有数据检查小说详情、列表、抓取表单、集合面包屑及安全设置这几类结构。查看导航与操作同行、菜单开关、弹窗关闭后的焦点以及内容底部可达性；不为视觉验证写入业务数据。 |
| 响应式高度     | 至少检查 390×600 与桌面视口；实际滚动长内容，确认页面没有额外外层滚动、工具栏不被带走。操作换行时按实际工具栏高度验证剩余内容区域。                                                          |
| 构建与静态检查 | 运行 `pnpm lint`、受影响回归和 `pnpm build:check`，检查新 export、类型、依赖边界与产物预算；范围内格式和 `git diff --check` 通过。                                                           |

## 实现与验证结果

- 13 个页面及 RouteBoundary 的两类回退均已接入 PageToolbar，AppDrawer 的独立 header 已移除。导航关闭仍由原 SidebarProvider 与 location key 处理，抓取按钮保留原 form 与提交回调。
- 实际列表暴露出分页按钮的 `sr-only` 文本越过滚动容器、将 600px 页面撑到 739px 的问题。CustomTable 的现有滚动容器增加 `relative` 建立定位边界后，实际页面恢复为 390×600，外层滚动与工具栏位移均为 0。
- 在应用内浏览器通过真实 HTTPS 联调服务与已有数据检查了小说详情、小说／条目列表、两类抓取表单、嵌套集合面包屑、安全设置和作者详情。小说详情滚至第 104 章、桌面作者详情滚至末尾时，工具栏仍在顶部；未写入业务数据。
- 390×600 下导航与操作同排，桌面 1280×900 下侧栏与页面正常组合。额外用 260×600 检查安全设置工具栏换行：工具栏高度 85px，内容区从 y=85 填至 y=600，页面无额外溢出。
- 实测移动导航在跳转后关闭、添加小说弹窗取消后焦点回到原工具栏按钮；抓取页导航不触发校验，点击获取仍显示 required 错误。表单请求变量与路由加载／失败导航由组件回归覆盖，未在真实服务中人为制造懒加载失败。
- `pnpm test`：23 个测试文件、67 项测试通过；`pnpm lint`、`pnpm build:check` 和 `git diff --check` 通过。没有 schema／operation 变化，无需生成或后端验证。

本轮浏览器检查使用现有数据，未执行抓取后保存、安全凭据变更或后端部署验收；这些业务流程不属于本次布局调整。
