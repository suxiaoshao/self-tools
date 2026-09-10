# Issue #85：配置、API、Web 基线与维护状态审查

2026-09-10 的实施前调研依据；版本与源码描述以调研基线为准。当前实现、实测结论和保留项见 [实施结果](./README.md)。

主结论与其他迁移见 [README](./README.md)、[changelog](./changelog-research.md)、[组件替代与 Table V9](./reuse-research.md)。下面保留迁移依据，维护状态为初次查询快照；实际取舍以实施结果为准。

实施核实：rustfmt 是 Volo/Pilota 生成链的必要工具，保留；GraphQL 17 因传递 peer 范围暂缓；monaco-themes 未导出主题 JSON，保留原导入。WebAuthn 采用原生 JSON 优先与局部兼容路径。

## 优先处理的发现

1. 删除失去当前构建入口的 `docker/web`、`docker/test` 遗留资源，并收敛独立发布 Rust builder 的 workflow；当前服务通过 Bake 从源码构建 builder。
2. CI 更新旧 Actions major，考虑用官方 `pnpm/setup` 合并 Node／pnpm／安装步骤；移除没有跨架构构建需求的 QEMU 设置。
3. 按 shadcn 新的 Base UI 推荐迁移 Toast，可删除 Sonner；分页改用 Combobox 后可连同无消费者的 Command／cmdk 删除。
4. Apollo codegen 改用直接插件生成 TypedDocumentNode，删除整张 operation 字符串映射；清理已被 jiti 替代的根 `ts-node` 声明与 Knip 例外。
5. Passkey 可以使用原生 WebAuthn JSON API，删除手工 Base64URL／响应对象拼装，但必须先明确浏览器支持下限；Vite 语法目标不代表 Web API 可用性。

## Docker：旧文件与正在使用的配置分开判断

| 位置与证据                                                                                                                                                         | 当前问题／是否过时                                                                                                                                                                                                     | 建议与必要验证                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docker/web/web.Dockerfile](https://github.com/suxiaoshao/self-tools/blob/c83a5cef1c41ae00ebadec48f435cdbb02e97805/docker/web/web.Dockerfile)、Nginx 配置及 .npmrc | Docker README、Compose、xtask 均指向 Rust gateway；根 .dockerignore 只允许 Rust 构建输入，已不包含 web、package.json 或 docker/web 文件，旧 Dockerfile 的 COPY／前端构建条件不成立。还保留全局安装最新 pnpm 的旧流程。 | 删除整个未接入的 docker/web 目录并更新 Docker README；不再为旧 Nginx 链路升级 Node／pnpm。若另有仓库外调用，应先迁到正式入口；本轮只核对仓库内引用。                                                                                                                 |
| [docker/test/test.Dockerfile](https://github.com/suxiaoshao/self-tools/blob/c83a5cef1c41ae00ebadec48f435cdbb02e97805/docker/test/test.Dockerfile)及其脚本／配置    | 基础镜像来自当前 Debian Rust builder，却运行 `apk add`、修改 ash；其 COPY 的 docker/test 也被根构建输入排除。未接入常规编排，还安装已归档 cargo-watch，保留一份大段 shell 安装脚本。                                   | 建议删除整套失效测试镜像资源及文档入口；不要通过重新引入 Alpine、放宽 .dockerignore 和修补旧脚本来延续无现用消费者的路径。                                                                                                                                           |
| [.github/workflows/rust_update.yaml](https://github.com/suxiaoshao/self-tools/blob/c83a5cef1c41ae00ebadec48f435cdbb02e97805/.github/workflows/rust_update.yaml)    | 每两天发布 `suxiaoshao/rust:latest`；[Bake](../../../docker/docker-bake.hcl)已通过 `contexts = { "suxiaoshao/rust" = "target:rustbase" }` 将 FROM 映射为本地构建目标，常规服务构建不拉这份已发布 builder。             | 随遗留测试镜像收敛，建议删除独立定时发布 workflow。明确 Bake／xtask 为正式入口；直接 `docker build` 服务 Dockerfile 或仓库外镜像消费者不在本轮已核实范围。[Docker target context](https://docs.docker.com/build/bake/contexts/)                                      |
| 五份服务 workflow 的 setup-qemu 步骤                                                                                                                               | 当前无 platforms 配置，ubuntu runner 构建默认本机架构；QEMU 并不令产物自动变成多架构。                                                                                                                                 | 删除无实际作用的 QEMU 设置；保留 Buildx，因为 Bake 与命名 context 正在使用。若以后明确发布多架构，再成组处理 platforms、原生库与对应验证。                                                                                                                           |
| [collections.Dockerfile](../../../docker/server/collections.Dockerfile) 的 `RUSTFLAGS="-C target-feature=-crt-static"`                                             | 当前为 GNU Linux builder，已读取 rustc 目标 cfg，未默认启用 crt-static；该环境变量还会覆盖 `.cargo/config.toml` 的目标 rustflags，使 collections 绕过统一 mold 链接参数。                                              | 删除这项旧覆盖，沿用统一链接配置；必要验证是 collections release 构建及运行库依赖，不借此改变部署 target。                                                                                                                                                           |
| [rust.Dockerfile](../../../docker/server/rust/rust.Dockerfile) 的 rustfmt 与未限定 `FROM rust`                                                                     | 实际 Linux 构建证明 Volo/Pilota 的 build.rs 会调用 rustfmt，不能删除。浮动 Rust 镜像的 Debian variant 需与 runtime 对齐。                                                                                              | 保留 rustfmt，builder 使用 rust:trixie 跟随稳定 Rust。保留 clang、cmake、pkg-config、mold 与运行时 libpq／CA／OpenSSL 的实际需求。                                                                                                                                   |
| Cargo cache mounts 与 CI 缓存                                                                                                                                      | `sharing=locked` 正在防止并行写入冲突，不能因升级删除；没有跨 job 的 cache-from／cache-to。                                                                                                                            | 若优化 CI 耗时，区分镜像层缓存与 Cargo mount 缓存。GHA exporter 默认不保存 cache mount，不能仅新增 cache-to 就宣称 target／registry 已跨运行复用；先选缓存所有者再验证命中。[Docker cache 文档](https://docs.docker.com/build/ci/github-actions/cache/#cache-mounts) |

`debian:trixie-slim` 与当前 PostgreSQL 18 的数据目录、volume、digest 不属于已发现的过时配置。数据库版本升级仍遵循原迁移所有权，不随镜像文件清理改动数据卷。`.dockerignore` 的输入收口、服务按需注入环境变量、提交标签与 latest 分开发布均保留。

## CI/CD：版本迁移与步骤替代

以下候选从各 Action 官方 releases 查询。工作流使用 `@vN` 时会跟随该 major 的标签更新，不能把它误写成固定的早期 patch。

| 当前引用                      | 查询时最新稳定版                                                            | 本仓库处理                                                                                                                                                          |
| ----------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| actions/checkout@v4           | [v7.0.1](https://github.com/actions/checkout/releases/tag/v7.0.1)           | 更新到新 major；v7 调整敏感事件下 fork PR checkout 的默认限制。当前为 pull_request／push／schedule，没有依赖被禁止的 pull_request_target 用法，不需要开启绕过选项。 |
| actions/setup-node@v4         | [v7.0.0](https://github.com/actions/setup-node/releases/tag/v7.0.0)         | 若保留两步安装，升级并核对运行时／缓存输入；当前不消费它删除的 dummy NODE_AUTH_TOKEN。也可由下述 pnpm/setup 替代。                                                  |
| pnpm/action-setup@v4          | [v6.1.0](https://github.com/pnpm/action-setup/releases/tag/v6.1.0)          | 6.0 增加 pnpm 11 支持，6.1 支持 12；当前已声明 pnpm 11.20，应更新安装 action 或迁移到 pnpm/setup，不只改 packageManager。                                           |
| docker/setup-buildx-action@v3 | [v4.3.0](https://github.com/docker/setup-buildx-action/releases/tag/v4.3.0) | v4 使用 Node 24，删除旧输入／输出；当前只调用默认设置，没有相应旧参数需搬迁。                                                                                       |
| docker/login-action@v3        | [v4.6.0](https://github.com/docker/login-action/releases/tag/v4.6.0)        | 更新 major，保留当前 DockerHub 凭据来源与登录用途。                                                                                                                 |
| docker/setup-qemu-action@v3   | [v4.3.0](https://github.com/docker/setup-qemu-action/releases/tag/v4.3.0)   | 本仓库优先删除无消费者的步骤，避免升级后继续执行无效工作。                                                                                                          |
| docker/bake-action@v7         | [v7.3.0](https://github.com/docker/bake-action/releases/tag/v7.3.0)         | 已在最新 major；核对实际标签解析即可，无需为版本盘点机械重写。                                                                                                      |
| docker/build-push-action@v6   | [v7.3.0](https://github.com/docker/build-push-action/releases/tag/v7.3.0)   | 仅独立 Rust builder workflow 消费，建议随 workflow 删除；若保留则升级 v7。已删除的 DOCKER_BUILD_NO_SUMMARY／DOCKER_BUILD_EXPORT_RETENTION_DAYS 在本仓库没有使用。   |

目标 Actions 使用 Node 24；[Buildx v4 说明](https://github.com/docker/setup-buildx-action/releases/tag/v4.0.0)要求 runner ≥2.327.1。当前为 GitHub 托管 ubuntu runner，没有发现固定旧 self-hosted runner。不能据 major 落后直接断言现有 CI 已失败，本轮未触发远程运行。

### pnpm 新的单步安装入口

[pnpm/action-setup 官方 README](https://github.com/pnpm/action-setup/tree/v6.1.0)已介绍 [pnpm/setup](https://github.com/pnpm/setup)，可同时安装 pnpm 与 Node 等 runtime，替代部分 setup-node 用途。已核对 [v2.1.0](https://github.com/pnpm/setup/releases/tag/v2.1.0) 和固定版本 action.yml，当前 ubuntu + pnpm 11.20 场景符合其平台／版本范围。

建议候选配置：

```yaml
- uses: pnpm/setup@v2
  with:
    runtime: node@lts
    cache: true
    require-lockfile: true
```

pnpm 版本继续从根 packageManager 读取，不另写第二个版本；它默认运行 install，可删除当前两个 setup 步骤和 run_install 数组。若需要非默认安装参数，关闭自动 install 后显式运行命令，不能把旧数组原样搬过去。新 action 自己也弃用了 `package-json-file`，应使用 `working-directory`；根目录场景不需要设置。`require-lockfile` 同时要求锁文件存在并冻结安装；原 pnpm 在 CI 且锁文件存在时已经默认冻结，不能把原配置描述成必然任意更新锁文件。

保留 lint、test、graphql:check、build:check 和 Rust 检查。Rust job 的 `protoc` 步骤实际只装 mold／clang，应改成准确名称。五份服务发布步骤可抽成共享 workflow，保留各自 paths 与依赖闭包；这是减少重复维护的建议，不要求为了现代化改变触发范围或新增自动部署。

## Web API 与浏览器基线

### 已经采用原生能力的实现

| 当前实现                   | 核查结果                                                                                                                                                                                                               |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Markdown 复制              | 已用 `navigator.clipboard.writeText`；未发现 execCommand、选区复制或 clipboard 库。保留点击触发、失败反馈与安全上下文要求，不再新增兼容复制逻辑。[MDN](https://developer.mozilla.org/docs/Web/API/Clipboard/writeText) |
| auth／GraphQL 的取消与超时 | 已用 AbortSignal.any／timeout；没有 setTimeout 计时器包装可再删。保留业务取消、超时与会话代次的区别。                                                                                                                  |
| 标题、主题                 | React 19 `<title>` 与 next-themes 的替代已列入组件报告；不再为其增加 hooks 库。                                                                                                                                        |
| Dialog／Popover／树浏览    | 原生 HTML 同名能力不自动覆盖组合触发器、嵌套焦点和受控业务状态；继续使用已有 Base UI／shadcn。                                                                                                                         |

### 可以明显删除代码：WebAuthn JSON API

[auth/service.ts](../../../web/packages/portal/src/features/auth/service.ts)手写 `decodeBase64Url`、`encodeBase64Url`、descriptor 转换和 `credentialJSON`，逐字段处理 challenge、user.id、rawId、attestation、signature 等。浏览器已有三个对应 API：

- `PublicKeyCredential.parseCreationOptionsFromJSON()`：转换创建选项。
- `PublicKeyCredential.parseRequestOptionsFromJSON()`：转换认证选项。
- `credential.toJSON()`：序列化注册／认证结果。

已读取 [MDN 官方兼容性数据](https://github.com/mdn/browser-compat-data/blob/main/api/PublicKeyCredential.json)：这三项为标准、非实验、非弃用 API，Chrome 129、Firefox 119、Safari 18.4 起支持。方案是将已验证的 publicKey JSON 交给浏览器转换，并直接发送原生 JSON 结果，删除手工编解码与响应类型分支。

保留 ceremonyId、服务器返回值校验、信号取消、用户确认、密码退路、未知写入结果与后端 WebAuthn 类型契约。转换异常仍需投影到安全错误；后端应验证浏览器输出字段、扩展、transport 和空 userHandle，与现有序列化一致，不能只凭 TS 类型通过删除旧路径。

若还要单独操作字节，[Uint8Array.fromBase64／toBase64](https://github.com/mdn/browser-compat-data/blob/main/javascript/builtins/Uint8Array.json)支持 base64url 等选项，可替代 atob／btoa 加字符数组；其 Chrome 门槛为 140，Firefox 133、Safari 18.2。这里优先用 WebAuthn 整体 JSON 接口，避免先引入更高浏览器要求再逐字段维护转换。

### 必须补齐的配置契约

portal 没有显式 build.target。已核对已安装 Vite 8.1.4 和 [8.2.2 目标常量](https://github.com/vitejs/vite/blob/v8.2.2/packages/vite/src/node/constants.ts)，默认编译到 Chrome／Edge 111、Firefox 114、Safari／iOS 16.4。`tsconfig` 的 DOM／ESNext lib 只提供类型；构建器也不会自动补齐 Web API。

现有 [AbortSignal.any](https://github.com/mdn/browser-compat-data/blob/main/api/AbortSignal.json)已要求 Chrome 116、Firefox 124、Safari 17.4，超过上述语法目标；Chrome 124 之前的 timeout 部分实现还会给出 AbortError 而非 TimeoutError，可能影响本项目的错误分类。因此应在前端所有者文档中明确真实运行时支持范围，再让 build.target、必要检测和浏览器回归与它一致。

原生 WebAuthn 的直接替换以该支持范围为条件：支持下限覆盖三项 JSON API 后可完全删除手工转换；若仍需给旧设备提供 Passkey，则保留局部兼容路径或先保持现状。不能以“已进入 Baseline”笼统推导任意旧设备都可用，也不在调研阶段擅自提高产品下限。

## 包的新推荐方式与实际弃用 API

### Apollo：删除 runtime operation 映射

[官方 codegen 指南](https://www.apollographql.com/docs/react/development-testing/graphql-codegen)明确不推荐 Apollo 应用使用 client-preset，建议直接使用生成插件；本项目两个应用仍使用该 preset。生成的 `src/gql/gql.ts` 已自带注释，指出整张 operation 字符串映射不可有效 tree-shake、重复 query 字符串且不利于死代码删除；当前没有 codegen Babel／SWC optimizer。

建议改用 `typescript-operations` 与 `typed-document-node`，消费者直接 import 生成的具名 Document，保留静态 AST 和类型；删除 gql.ts 的 runtime 查表、未使用的 fragment-masking 产物及 client-preset 直接依赖。手写 operation 仍保留在可被现有扫描器识别的位置，生成目录继续排除，避免把旧生成物误当成输入。无需为了优化这张映射重新引入本次准备删除的 Babel 链路。

已查询目标 [typescript-operations 6.1.6](https://registry.npmjs.org/%40graphql-codegen%2Ftypescript-operations/6.1.6) 与 [typed-document-node 7.1.0](https://registry.npmjs.org/%40graphql-codegen%2Ftyped-document-node/7.1.0)，二者直接 peer 接受 GraphQL 17；前者的 graphql-sock peer 为 optional。本轮未安装完整图。按新版 operations v6 的配置处理，不能把旧 v5 必须另加 typescript 插件的示例机械照搬。

两个应用各自的 codegen.ts、manifest、operation 消费者和生成物成组修改，保留 scalar 字符串约定、__typename 判别、错误策略与生成同步脚本。运行各自 generate、graphql:check、类型／关键查询回归，并用现有 bundle report 验证优化；尚无实测字节收益。

### shadcn：Base UI Toast 与 cmdk 的退出路径

[最新上游 skill](https://github.com/shadcn-ui/ui/blob/main/skills/shadcn/SKILL.md)和 [Base UI Toast 文档](https://ui.shadcn.com/docs/components/base/toast)已推荐 Base UI 项目使用自己的 toast，Radix／React Aria 继续使用 Sonner。本项目为 base-nova，已安装 @base-ui/react；当前仅四处 `toast.success`（作者／小说抓取与详情）及一个 Toaster 挂载，迁移范围明确。

新增共享 toast 源码，把成功通知改为 `toast.add({ title, type: 'success' })`，切换 portal 挂载，再删除共享 sonner.tsx 和 bookmarks／UI 的 sonner 依赖。成功写入与读取刷新边界保持原样，不将请求错误改成全局 toast。next-themes 仍可用于替代项目手写主题管理，它与 Sonner 是否保留是两个独立选择。

另一个明确删除链是分页：当前只有 TablePagination 消费共享 Command，而 command.tsx 是唯一 cmdk 调用者。分页改用已安装 Combobox 后，可删除 command.tsx 与 UI 的 cmdk 声明；无需因维护日期较旧去另找 command palette 库。

### 弃用标记要落到实际消费者

- `useReactTable` 的迁移已纳入 Table V9；旧 Babel Compiler 入口按既有方案删除。
- Apollo `useSuspenseQuery` 的 skip 在当前类型中明确 `@deprecated`，推荐 skipToken；仓库两处 skip 实际用于 `useQuery`，该类型没有相同弃用标记。可为变量类型安全采用 skipToken，但不能误报这两处正在调用被弃用的 Suspense API。
- 未在手写前端发现 execCommand、findDOMNode、ReactDOM.render／hydrate、旧生命周期或 matchMedia.addListener。后端未发现显式 allow(deprecated) 压制；这不等于完成所有传递库 API 的编译审计。
- 目标 Docker Actions 删除的旧环境变量、输入，以及 pnpm/setup 的 deprecated package-json-file，在当前配置中没有消费者；迁移时避免引入它们即可。
- Monaco 当前使用的 model／editor dispose、事件订阅及 getWorker 仍有用途。0.4.8 的 exports 未开放主题 JSON，普通包路径实测不能解析，保留 Dracula 的原导入；Monaco worker 已使用 0.56 的公开子路径。

## Skill：只更新有实质漂移的内容

依据 [skills-lock.json](../../../skills-lock.json)查询五个外部 skill 的官方源，并比较入口；另查看 Apollo codegen／Suspense 引用。自有 implementation-plan-design 沿用项目契约，本轮未发现需替换的外部版本。

| 本地内容                                | 对比结果                                                                                                        | 建议                                                                                                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn/SKILL.md 与 rules/composition.md | 本地一律推荐 Sonner，上游已按 base 区分 Toast；是实质差异。                                                     | 更新这份 skill 及配套引用，并按安装流程更新 lock，不手填 computedHash。组件迁移后同步前端 README，避免 skill 引回已删除的依赖。                          |
| Apollo／GraphQL／Router 的 SKILL.md     | 已比较的入口主要是引号、换行、表格格式差异，不能以文件日期认定全部过时。                                        | 不为格式变化整包覆盖；保留项目当前声明式 Router 模式，不因“更现代”强行迁到 Framework mode。                                                              |
| Apollo codegen 引用                     | 外部 skill 仍展示较旧的插件配置；Apollo 当前文档已区分 operations v6／v5。                                      | 当前项目采用上述已核实 v6 配置；升级 skill 不能代替对实际生成器版本的核对。                                                                              |
| Apollo／GraphQL 的一般性建议            | 一处强调 fragment colocation，另一处要求不要重复任何 field selection；cache／Suspense／refetch 的建议也有前提。 | 不当成过时 API 或无条件重构要求。保留本项目 no-cache 集合快照、部分错误、只读核对与跨应用边界；需要流式或 masking 时再核对客户端、后端与生成器完整支持。 |

未对所有 skill 引用逐字审计，也未运行批量 skill update。报告建议与最终配置均服从当前用户范围和项目所有权。

## 更新较慢的依赖：维护状态与处置

稳定版日期来自 npm time 字段，归档／活动来自官方 GitHub 仓库；pushed_at 只说明仓库有推送，不代表稳定版已包含修复。本表所列 npm 包查询时均没有 deprecated 标记。

| 包／工具                       | 查询时证据                                                                                                                             | 处置                                                                                                                                                                                                                  |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ts-node 10.9.2                 | 稳定版 2023-12-08，仓库最近推送 2024-07-18、未归档。当前仅根 manifest 与 Knip ignore 提及；已安装 codegen CLI 通过 jiti 加载 TS 配置。 | 优先删除根声明及 ignoreDependencies 的对应例外；用 generate／graphql:check 核实隐式加载链，不另装一个 TS runner。Node 原生 TS 支持也不代表会自动接管 CLI 自己的 loader。[仓库](https://github.com/TypeStrong/ts-node) |
| cargo-watch                    | [仓库](https://github.com/watchexec/cargo-watch)已归档，README 推荐 Bacon／Watchexec；只在遗留测试 Dockerfile 安装。                   | 随失效镜像删除，无需给不存在的现用 watcher 自动安装替代品。                                                                                                                                                           |
| Prism 1.30.0                   | 稳定版 2025-03-10；仓库未归档，默认分支 v2，2026-09 仍有推送；README 说明正在做 v2，当前只接受安全相关 PR。                            | 记录维护限制，但保留当前功能与本地 grammar 资源方案；不把它说成完全停更。若 v1 的缺陷或维护限制实际阻碍功能，再独立评估高亮引擎迁移。[官方声明](https://github.com/PrismJS/prism#readme)                              |
| cmdk 1.1.1                     | 稳定版 2025-03-14；仓库现跳转 dip/cmdk，未归档。                                                                                       | 按已核实的唯一消费者退出链删除；删除依据是无需其能力。[仓库](https://github.com/dip/cmdk)                                                                                                                             |
| class-variance-authority 0.7.1 | 稳定版 2024-11-26，CVA 仓库未归档且 2026-09 有活动。                                                                                   | 仍被多个共享组件的 variants 使用；保留。cn 替代的是 clsx／tailwind-merge，不覆盖 CVA 的 variant 类型和组合职责。[仓库](https://github.com/joe-bell/cva)                                                               |
| monaco-themes 0.4.8            | 稳定版 2025-11-25，未归档且 2026-09 有活动；本仓库只用 Dracula JSON。                                                                  | 包路径因 exports 未开放而保留现状。采用 Monaco 内置主题可删包，但会改变现有视觉；不因只用一份数据就复制整库或改变主题。[仓库](https://github.com/brijeshb42/monaco-themes)                                            |
| git-cz 4.9.0                   | 稳定版 2022-05-14，未归档；根 commit 脚本和 changelog.config.js 仍是消费者。                                                           | 可用普通 git commit 取代交互向导，从而删除依赖、配置和相应检查例外；这属于提交体验取舍，不能当成已确认安全故障。[仓库](https://github.com/streamich/git-cz)                                                           |
| Husky 9.1.7                    | 稳定版 2024-11-18，未归档且 2026-03 有活动。当前 hook 直接执行检查，没有旧版 husky.sh 引导行。                                         | 保留检查与入口，不因稳定版日期绕过或删除 hooks。[仓库](https://github.com/typicode/husky)                                                                                                                             |

## 实施边界与验证

- 配置清理先删失效消费者，再更新其余 Actions；检查 Docker/Bake/Compose 引用与 workflow 语法。只在实际修改的构建链路上进行必要构建，不在调研阶段启动部署或数据库迁移。
- Base UI Toast、Command／cmdk 退出、ts-node 清理分别检查调用、manifest 和锁文件；codegen 迁移必须通过既有生成入口，并检查实际 bundle 变化。
- 原生 WebAuthn 替代先解决运行时支持下限，再验证注册／认证／再认证、取消、错误和序列化；不能用仅有 mock 的通过结果代替浏览器支持证据。
- 未做全量漏洞数据库扫描、所有 patch／传递依赖源码审计或远程 CI 验收。本报告没有把未发现弃用标记等同于不存在兼容性问题，也没有把任何推荐写成已实施。
