# Issue #85：Changelog 与依赖精简机会

2026-09-10 的实施前调研依据；版本与源码描述以调研基线为准。当前实现、实测结论和保留项见 [实施结果](./README.md)。

## Vite 与原生 React Compiler

### 版本区间与实际收益

- Vite `8.1.4 → 8.2.2`：[核心 changelog](https://github.com/vitejs/vite/blob/v8.2.2/packages/vite/CHANGELOG.md)包含顶层 input、`resolve.tsconfigPaths` 转为稳定、依赖互操作、HMR、路径／符号链接以及 bundled dev 修复。portal 已用内置 `resolve.tsconfigPaths: true`，没有可再次删除的 tsconfig-paths 插件；新功能不要求顺带切换开发服务器模式。
- `@vitejs/plugin-react 6.0.3 → 6.1.1`：原生编译器入口来自 [6.1.0](https://github.com/vitejs/vite-plugin-react/releases/tag/plugin-react@6.1.0)。[6.1.1](https://github.com/vitejs/vite-plugin-react/releases/tag/plugin-react@6.1.1)增加诊断开关并修复共享插件的 sourcemap 选项读取。仅更新 Vite 核心不会自动替换现有 Babel 配置。
- [插件 README](https://github.com/vitejs/vite-plugin-react/blob/plugin-react@6.1.1/packages/plugin-react/README.md)与 [Oxc 文档](https://oxc.rs/docs/guide/usage/transformer/react-compiler)均明确原生支持仍为 experimental。它直接处理 Oxc AST；上游性能宣传不等于本仓库实测提升，也不作为迁移完成证据。

### 本仓库的替换边界

当前 [portal Vite 配置](../../../web/packages/portal/vite.config.ts)使用 `react()` 加 `babel({ cwd: rootDir, include, presets: [reactCompilerPreset()] })`。仓库未发现其他 Babel 直接调用者。建议迁移为：

```ts
react({ compiler: { target: '19', logDiagnostics: true } });
```

`compiler: true` 是官方最简入口。这里显式记录 React 19 目标，并在迁移验证时显示可恢复诊断，便于发现被跳过的代码；6.1.1 默认不输出这些诊断，致命诊断仍会使转换失败。

| 所有者                               | 后续修改                                                                                                                         |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| `web/packages/portal/package.json`   | 新增 `oxc-transform-react` 开发依赖；删除 `@rolldown/plugin-babel`、`babel-plugin-react-compiler`，同步更新 Vite／plugin-react。 |
| `web/packages/portal/vite.config.ts` | 删除 Babel import、`reactCompilerPreset` import 和整个 Babel 插件块，包括其专用 cwd 处理；保留其他用途仍需要的 `rootDir`。       |
| `web/README.md`                      | 删除“Babel 的插件解析目录固定为 portal”段落，改为原生编译器由 portal 声明的实际所有权。                                          |
| `pnpm-lock.yaml`                     | 由包管理器重算；shadcn 的代码生成链路仍可能使用 Babel，不能承诺整个依赖图不再有 Babel。                                          |

**版本配对有一个实际缺口。** npm 发布的 [plugin-react 6.1.1 元数据](https://registry.npmjs.org/%40vitejs%2Fplugin-react/6.1.1)仍要求 `oxc-transform-react ^0.145.0`；注册表当前该范围只有 `0.145.0`，最新为 `0.149.0`。0.x 的 `^0.145.0` 不接受 0.149.0。推荐初次迁移使用满足 peer 的 `^0.145.0`；如要采用更新的编译器，先核对新版插件或验证兼容性并明确记录约束调整，不能静默忽略 peer 警告。此事实同时核对了 tag 源码和发布包元数据。[0.145.0 元数据](https://registry.npmjs.org/oxc-transform-react/0.145.0)要求 Node `^20.19.0 || >=22.12.0`，发布了 macOS 与 Linux 等原生绑定；本机 Node 满足要求，CI 的实际绑定加载尚未验证。

### 必要验证与暂不能删除的内容

[插件源码](https://github.com/vitejs/vite-plugin-react/blob/plugin-react@6.1.1/packages/plugin-react/src/index.ts)按文件、代码及 environment 决定转换，并跳过 server consumer。后续需要检查 portal 与共享 workspace 源码确实进入原生编译器；单凭普通 Vitest/jsdom 通过，不能证明测试覆盖了编译后的行为。

完成对应构建与现有关键回归，再在实际浏览器确认 CustomTable 的数据刷新、选择与分页。`custom-table` 当前的 `use no memo` 属于 Table V8 的状态兼容边界，原生编译器替换本身不能作为删除理由；Table V9 另按迁移方案处理。编译器迁移也不自动授权批量删除业务 `useMemo`／`useCallback`。

## shadcn／cn：直接依赖与传递重复分别处理

### 4.13.0 → 4.21.0 的相关变化

对照 [完整 CLI changelog](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/CHANGELOG.md)与 [官方 CLI 文档](https://ui.shadcn.com/docs/cli)：

| 版本         | 与本仓库有关的变化                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.13.1       | 修复 registry 路径遍历、重定向头泄漏及包管理器参数注入，升级 CLI 本身有修复收益。                                                                                         |
| 4.14／4.14.1 | icon 迁移与 Base UI Toast 支持；本仓库已选 Lucide。结合最新 skill 的 Base UI 推荐，通知可迁移到已有 Base UI 原语并删除 Sonner，见配置与 API 审查。                        |
| 4.15–4.19    | 公共 `addRegistryItems` API、package.json registry 发现、monorepo 扫描、SOCKS 代理、私有 GitHub registry 与 base-color 迁移。按实际调用启用，无需新增 registry 或改色板。 |
| 4.20／4.20.1 | 新增 `migrate cn`，随后修复前导注释保留。                                                                                                                                 |
| 4.21         | registry 组件直接使用 `cn`；init 的 utils 缩为 re-export；CLI 自身也迁移到 cn。更新 CLI 不会自动重写仓库已有组件。                                                        |

`eject` 是早于当前基线的 4.9 功能，不能算成本次区间的新收益。当前 portal CSS 仍导入 `shadcn/tailwind.css`，删除 shadcn 包需要先处理这份 CSS 的所有权，不列入本次 cn 精简。仓库为 Base UI 的 `base-nova` 风格，无 Radix 迁移需求。

### 直接迁移：两项依赖变为一项

[cn 官方仓库](https://github.com/shadcn-ui/cn)提供零运行依赖的 `cn`，以及兼容的具名 `clsx`、`twMerge` 导出。查询候选为 [cn 0.2.6](https://registry.npmjs.org/cn/0.2.6)。本仓库只有 [共享 utils](../../../web/common/ui/src/lib/utils.ts)直接调用 clsx／tailwind-merge，二者由 [ui 清单](../../../web/common/ui/package.json)声明。其他组件通过 `ui/lib/utils` 或 `#lib/utils` 消费。

建议把该文件改为官方支持的一行形式：

```ts
export { cn } from 'cn';
```

在 UI 包新增 `cn` 运行依赖，删除 `clsx`、`tailwind-merge`。现有 `ui/lib/utils` 仍是正常的共享工具契约，无需为单次替换修改所有调用点；今后直接 import cn 的新增 registry 组件，应由其所在包声明依赖。

官方迁移入口可用于后续实施：

```sh
pnpm dlx shadcn@4.21.0 migrate cn --cwd web/common/ui
```

依据 [迁移源码](https://github.com/shadcn-ui/ui/tree/main/packages/shadcn/src/migrations/cn)，它递归扫描 cwd，并在同一 cwd 的清单中增删包。当前 repo root 或 portal 都不拥有这份 utils 和两个依赖；从它们运行不能代替对 UI 包的迁移。指定局部 path 会保留旧依赖，完整扫描也只有确认没有剩余引用才移除。该命令是写操作，没有可据以只读执行的 dry-run；本轮未运行。这里只有一个工具文件，后续也可按官方手动迁移方式精确修改。

### 进一步优化传递依赖

当前锁文件中 `class-variance-authority 0.7.1` 依赖 `clsx 2.1.1`；shadcn 4.13 依赖 tailwind-merge。前述迁移会删除 UI 的直接声明，shadcn 自身升级也会调整其依赖，但 CVA 仍可能让 clsx 留在锁文件和浏览器依赖图中。

[cn 官方 alias 文档](https://github.com/shadcn-ui/cn/blob/main/docs/aliasing.md)给出了把依赖中的 clsx／tailwind-merge 引用指向 cn 的方案。源码核对：当前 CVA 的 ESM 与 CJS 入口都消费具名 `clsx`，符合 cn 的导出形状。因此可在 portal 的 Vite 解析层为实际仍存在的 `clsx` 增加精确 alias；更新后若没有浏览器 tailwind-merge 消费者，无需额外添加它的 alias。

若 Vite 配置通过 `import.meta.resolve('cn')` 取得绝对路径，portal 作为构建配置消费者也需声明 cn 开发依赖，不能依赖 workspace 偶然可解析。两个清单声明可共用一个版本，并不代表要打包两份实现。

此方案尚未运行验证。alias 只影响经过该解析器的模块，不会删除 CVA 的 manifest 依赖，不能清除库内部已内联的副本；默认导入 clsx、`tailwind-merge/lite` 或 `extendTailwindMerge` 也需要逐项核对入口。后者属于 `cn/config`，不能全局把所有子路径机械映射到 cn 根入口。不建议未经核实使用全局包管理器 override。

完成迁移后检查共享组件的条件类名、Tailwind 冲突优先级及 CVA variants，再对照现有 bundle report 确认是否消除了重复实现。安装包数和前端包体收益分别报告，不把上游 benchmark 写成本项目结果。

## 其他 minor 与相关 patch：行为变化和适用性

下表按当前版本到目标版本的发布区间筛选，保留与现有消费者相关的变化；新功能若没有使用场景，不主动改写业务。

| 版本区间与官方证据                                                                                                                                                                                                                                                            | 上游变化                                                                                                                                                                               | 当前消费者、删除机会与验证                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Base UI 1.6.0 → [1.7.0](https://base-ui.com/react/overview/releases/v1-7-0)／[1.8.0](https://base-ui.com/react/overview/releases/v1-8-0)                                                                                                                                      | 1.7 涉及 Safari／Firefox 的键盘与焦点恢复、弹层卸载及 store 优化；1.8 修复控制项 ID／ref／标签关联和受控校验，忽略打开前已开始的外部按压；readOnly 的 Select／Combobox 允许打开浏览。  | 关联共享 UI、Dialog／Sheet、Select／表单。现有集合选择在写入锁定时使用 disabled 并关闭 picker，应保留其产品语义；不能替换成 readOnly。复用焦点、关闭、禁用选择与错误关联回归。未发现可仅凭 release note 删除的本地焦点保护。                                                   |
| react-hook-form 7.81.0 → [7.87.0](https://github.com/react-hook-form/react-hook-form/releases)                                                                                                                                                                                | 区间修复 delayError／setValue、dirty 状态、useController control 重订阅、values 与 keepDirtyValues 的数组问题；新增 getErrors、trigger shouldTouch、OpaqueTypes 和 Activity 相关选项。 | 三个应用与 collection-tree 使用 RHF；验证受控选择、reset／dirty、错误清除和提交禁用。新的选择性 API 不要求改写已有表单，也未发现应删除的对应 workaround。                                                                                                                      |
| resolvers 5.4.0 → [5.9.1](https://github.com/react-hook-form/resolvers/releases)                                                                                                                                                                                              | 5.4.1 把验证库 peer 设为可选；5.5.7 修复 Valibot peer；5.6 改进根级错误；5.9.1 修复数组方括号路径转嵌套错误。                                                                          | 本仓库实际使用 Valibot，Joi／Vest／Vine 等新增能力无直接收益。与 RHF 一起核对字段错误与根错误的展示，不额外安装其他校验器。                                                                                                                                                    |
| Apollo 4.2.6 → [4.2.12](https://github.com/apollographql/apollo-client/blob/main/CHANGELOG.md)                                                                                                                                                                                | 涉及 DevTools 在 jsdom 中的定时器、undefined 默认变量、refetch／fetchMore／lazy execute 的 errorPolicy 返回类型、partial cache 警告和 multipart UTF-8 分段解码。                       | custom-graphql 和两个业务应用是消费者。关注错误投影与返回类型；现有会话隔离、迟到请求保护和 generation 控制由业务所有，不能当成上游已修复的冗余代码删除。                                                                                                                      |
| codegen CLI 7.2.0 → [7.4.0](https://github.com/dotansimha/graphql-code-generator/blob/master/packages/graphql-codegen-cli/CHANGELOG.md)；client-preset 6.1.0 → [6.1.3](https://github.com/dotansimha/graphql-code-generator/blob/master/packages/presets/client/CHANGELOG.md) | CLI 调整 overwrite、watch 陈旧文件处理和内容比较缓存；preset 区间修复条件 fragment masking、撤回错误的可选 Partial 行为，并修复 union／条件 directive 的生成类型。                     | 当前生成脚本一次性输出临时目录再同步，不能因 watch 改进删除自己的同步逻辑。运行两个应用既有 generate 入口，检查生成类型与 graphql:check。peer 接受 GraphQL 17 与生成输出正确是两个问题。                                                                                       |
| i18next 26.3.6 → [26.4.2](https://github.com/i18next/i18next/releases)                                                                                                                                                                                                        | 新增语言解析层级缓存；fallbackLng 改动会自动失效，但动态修改 load／lowerCaseLng／cleanCode／nonExplicitSupportedLngs 需 clearCache；26.4.2 修复嵌套替换中的 `$&` 循环。                | 共享 i18n 在初始化后仅 changeLanguage，未发现修改这些解析选项；无需新增手动清缓存代码。复用语言切换、缺失键与插值行为验证。                                                                                                                                                    |
| Knip 6.26.0 → [6.35.1](https://github.com/webpro-nl/knip/releases)                                                                                                                                                                                                            | 6.27 改进 workspace exports、脚本转发和 alias；6.30 scoped run 纳入 workspace 依赖；6.32 识别通配 subpath alias；6.33 修正 Vitest setup／mock 解析；6.35.1 配置加载失败退出 2。        | 与本仓库 package imports、共享源码、Vitest 根入口和 knip.json 相关。升级后核查新报告和旧 ignore 项，删除经验证不再必要的例外；不直接用 --fix 清依赖。新增原生 compiler 的动态 peer 也需确认能被识别。                                                                          |
| Lucide 1.24.0 → [1.43.0](https://github.com/lucide-icons/lucide/releases)                                                                                                                                                                                                     | 区间多数是新图标和形状变更；1.37 统一 check／cross／plus 尺寸并旋转 key，1.41 调整 trash 图标，1.42 提取内部图标构建逻辑。                                                             | 多个 UI 组件使用 CheckIcon／XIcon，因此 minor 更新也有视觉影响。本仓库未命中 Trash 导入，不为它编写迁移。核对现有图标导出及常用按钮视觉，不引入上游构建工具。                                                                                                                  |
| markdown-to-jsx 9.8.2 → [9.10.2](https://github.com/quantizor/markdown-to-jsx/releases)                                                                                                                                                                                       | 9.9/9.10 修复原始 HTML 属性与编码 URL 过滤；9.10 调整标题 ID 和重复标题编号；9.10.1 修复浏览器 process 导入；9.10.2 修复长括号／脚注输入的解析复杂度。                                 | common/markdown 使用 React renderer 和链接、图片、标题、代码块覆盖；自定义标题只转发 children，当前 DOM 不应直接假定会获得上游 ID。验证危险 URL 到达自定义 Link／Image 的表现、普通链接与代码高亮；业务 Prism 延迟加载和 DOM 所有权逻辑仍有用途。RN 样式与流式输出功能不适用。 |
| Tailwind／@tailwindcss/vite 4.3.2 → [4.3.3](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md)                                                                                                                                                               | 修复扫描但未加载的模块触发全量刷新、嵌套来源顺序、Firefox 焦点、部分 CJK 字体和零间距单位问题。                                                                                        | 关联 portal 扫描共享组件与主题 CSS；构建及一次实际共享组件 HMR 检查即可覆盖直接影响，无需更换现有样式组织。                                                                                                                                                                    |

### Rust 中不能仅按版本号略过的 minor

| 版本区间与证据                                                                       | 已核实变化与本仓库处理                                                                                                                                                        |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| http 1.4.2 → [1.5.0](https://github.com/hyperium/http/blob/master/CHANGELOG.md)      | 新增 QUERY Method、修复 URI builder 空 path 与 URI 长度限制。无需主动添加 QUERY 路由；保留现有网关／中间件的 URI 解析与错误回归。                                             |
| http-body 1.0.1 → [1.1.0](https://github.com/hyperium/http-body/releases/tag/v1.1.0) | SizeHint 新增 Add／Copy。`server/common/middleware/src/trace.rs` 直接转发 inner.size_hint，没有手动累加或 clone 可删除；Body trait 的正常结束、错误和取消回归继续适用。       |
| Tokio 1.52.3 → [1.53.1](https://github.com/tokio-rs/tokio/releases)                  | 区间修复 runtime park／driver、mpsc permit 唤醒与 waker 释放、定时器构造栈问题，并增加指标与部分 IO API。现有 runtime／异步服务受益于修复，但不据此重构执行器或新增 metrics。 |
| uuid 1.23.4 → [1.26.1](https://github.com/uuid-rs/uuid/releases)                     | 增加 MaybeUninit 格式化、可选 serde bytes 和 V7 时间精度改进。auth 当前主要用 V4、parse_str 和标准序列化，没有相应手工实现可删除；保留既有 UUID 存储／字符串格式。            |

## 可执行范围与剩余证据缺口

[配置与 API 审查](./platform-research.md)进一步核实了 Apollo 的直接 codegen 插件方案；实施时优先替换 client-preset 的 runtime 映射，本文件保留的版本区间用于说明已读上游变化，不构成必须继续保留 preset 的要求。

- 已读本表列出的 minor 区间及关键相邻 patch，并对照当前入口、清单和必要的上游源码。Vite 原生 compiler 与 cn 有明确替换／删除方案；其余条目明确了实际行为收益和不适用能力。
- 版本盘点中的其余 patch 候选不全部具有逐条源码审计证据；完整 major／0.x 跨线迁移仍按主文档中注明的缺口补齐。不能把所有候选标为“已验证可直接升级”。
- 未安装新依赖，故未证明目标完整依赖图、原生绑定加载、编译覆盖、alias 的生产解析或包体下降；报告中的验证是后续实施边界。
- 本轮产物只做文档格式与差异检查，不把旧版本的代码测试结果当作新版本通过证据。
