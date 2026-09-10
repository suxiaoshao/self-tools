# Issue #85：依赖、配置与旧实现更新

- 状态：`Done`。已完成已确认范围的实现与必要验证，可交付试用。
- 范围：Cargo／pnpm workspace、前端组件与生成器、CI／Docker 配置和项目 shadcn skill。
- 需求：[Issue #85](https://github.com/suxiaoshao/self-tools/issues/85)。基线：`c83a5cef1c41ae00ebadec48f435cdbb02e97805`；实施日期：2026-09-10。
- 所有者：[前端](../../../web/README.md)、[后端](../../../server/README.md)、[Docker](../../../docker/README.md)。

## 实现结果

| 范围                | 当前实现                                                                                                                                                                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 前端依赖与 Compiler | React 19.2.8、Vite 8.2.2、原生 Compiler、Base UI 1.8、Table 9.2.4、Router 8.3.1 和其余已确认候选；pnpm 更新为 12.4.0。删除两个 Babel 直接依赖，按 plugin-react 的 peer 范围使用 oxc-transform-react 0.145。                                                                                  |
| Table 与类名        | 原生 useTable／Store、column helper 和 columnMeta；删除 Compiler 退出指令、V8 泛型包装和重复 row model 配置。三个旧操作列改用 display cell。分页跳转改为 Combobox；cn 替代 clsx／tailwind-merge 的直接声明，CVA 通过 alias 使用同一实现。                                                    |
| GraphQL             | 52 个手写 operation 移至调用点旁的 .graphql，直接插件生成具名 TypedDocumentNode；同步 IDE 配置和后端 operation 回归读取入口。删除 client-preset、字符串查表、fragment-masking、根 ts-node 及 Knip 例外。IDE 配置删除已退役子域的认证 endpoint，继续使用本地 schema。                         |
| 集合选择            | 单选／多选共用分栏 Dialog；桌面最近三层、手机当前层，独立浏览／选择、完整路径搜索、跨层草稿、确认／取消和 ID 去重。删除递归缩进视图与仅用于内部选择的 RHF／Valibot 依赖。Apollo、领域写入与调用方表单仍归各应用。                                                                            |
| 共享 UI 与原生能力  | next-themes 接管模式、持久化和系统监听；React title 取代 useTitle。接入 Native Select、Textarea、Alert／AlertDialog、Base UI Toast 和 Typeset，删除 Sonner／Command／cmdk。WebAuthn 原生 JSON 优先，缺少 API 时保留局部兼容路径。RHF watch 改为 useWatch，恢复核对状态不再在渲染时读取 ref。 |
| Rust                | 更新 27 个候选 crate 的声明及锁文件，覆盖 time 0.3.55、Pingora 0.9、摘要／编码和 DNS；time 解除旧精确固定。HMAC 显式导入 KeyInit；固定向量验证 token hash 与配置指纹字节不变，DNS 的迭代接口仍兼容。                                                                                         |
| CI／Docker／skill   | Node／pnpm 安装合并为 pnpm/setup@v2，checkout／Buildx／login 更新 major，移除无跨架构消费者的 QEMU。删除遗留 web／test 镜像资源与独立 Rust 发布 workflow；builder 固定 trixie variant，collections 恢复统一 mold 配置。安装工具更新 shadcn skill 及 lock。                                   |

## 实测后的保留项

- **GraphQL 保留 16.14.2。** 安装 17.0.2 后，传递依赖 graphql-config 5.1.6 和 graphql-ws 6.0.8 的 peer 范围不接受 17；直接 codegen 插件迁移已完成，不通过忽略 peer 错误强行升级。
- **Rust builder 保留 rustfmt。** 实际 Linux 构建证明 Volo/Pilota 的 build.rs 生成链会调用它，删除后生成失败；已恢复并重建通过。
- **Dracula 导入保留原路径。** monaco-themes 0.4.8 的 exports 没有开放主题 JSON，普通包子路径无法解析。Monaco 自身的 worker 已改为 0.56 的公开路径。
- 原生 Compiler 仍是实验能力，遇到 try/finally 和部分组件语法会跳过优化；保留必要的资源清理和写入保护。CustomTable 的实际 Vite 产物已确认包含 Compiler 缓存代码。
- @rolldown/plugin-babel 已没有直接声明或配置消费者，但 pnpm 仍将其解析为 plugin-react 的可选 peer；没有声称整个工具链已清除 Babel 传递依赖。浏览器模块报告未包含 clsx 或 tailwind-merge。
- git-cz 沿用原选择。WebAuthn 不提高原有浏览器支持下限。

## pnpm 配置更新

- 根 `packageManager` 更新为 pnpm 12.4.0，与本机版本一致；CI 的 pnpm/setup 继续从此处读取版本。
- 删除锁文件中已无对应依赖的 @swc/core、core-js、unrs-resolver 构建许可；保留 code-inspector 可选依赖 node-pty 的显式禁用。
- pnpm 12.4.0 冻结安装、workspace 边界、类型检查与生产构建通过；锁文件由安装器新增 packageManager 锁定文档，原 17 个 workspace、862 个依赖的锁定文档逐字节未变。构建仍有既有 React Compiler 跳过优化和 chunk 大小提示。

## 必要验证

pnpm 12.4.0 下完整 `pnpm lint`、`pnpm test`（24 个文件、72 项测试）、`pnpm graphql:check` 和 `pnpm build:check` 均通过；`cargo fmt --all --check`、`cargo clippy --all` 与 `cargo test --all`（99 项通过、18 项按既有规则忽略）通过。

| 检查           | 结果与边界                                                                                                                                                                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 前端静态与构建 | 类型、Oxlint、Knip、workspace 边界与格式检查通过；生产 build:check 通过，首屏 JS gzip 263,308 B、CSS 18,131 B，既有预算未调整。冻结锁文件安装通过。                                                                                                 |
| 前端回归       | 覆盖表格同 ID 刷新／删除、同数据引用下的翻译与回调更新、分页搜索／每页数量的一基契约、分栏深度／搜索／草稿／禁用／焦点、RHF 表单、未知写入和认证。编辑器失败用例改为受控失败时机，验证已编辑草稿跨 chunk 失败保留；编辑器与认证定向复测 11 项通过。 |
| 生成契约       | 两应用 generate 与 graphql:check 通过；后端直接读取迁移后的 52 个 operation 进行实际 schema／预算回归。                                                                                                                                             |
| 浏览器         | 隔离 Chrome、模拟 API 数据：1440×1000 桌面三栏、390×844 手机单栏、五层浏览／返回／确认、深色持久化、Monaco 输入与 Markdown 预览通过；没有运行时错误或页面横向溢出。实际 Passkey 设备认证、旧浏览器和生产 API 联调未在本轮执行。                     |
| Rust           | cargo check --workspace、cargo clippy --all 通过；默认 workspace tests 99 通过、18 个外部数据库／公网场景按既有规则忽略。未迁移或操作业务数据库。                                                                                                   |
| Linux 产物     | 正式 Bake 构建 collections／gateway 并加载 latest 成功；无网络临时容器中动态库解析、collections --export-schema 通过。未替换运行服务，未做生产 TLS／上游联调。                                                                                      |
| 配置与 skill   | 六份 workflow YAML 与 Bake 配置解析通过，pnpm/setup 输入与 v2.1.0 对照通过；shadcn lock 由安装工具生成。未执行远程 CI。                                                                                                                             |

## 调研依据

[Changelog](./changelog-research.md)、[组件替代与 Table V9](./reuse-research.md)、[配置／API／维护状态](./platform-research.md)保留上游版本区间和迁移依据；以上实测结果为当前结论。

## 完整候选清单

以下是实施前的候选快照，按包名去重；当前版本、被替代依赖和实际保留项以上文为准。JS 初始值来自 pnpm，Rust 初始值来自 Cargo.lock。

### JS

| 包                             | 当前    | 最新候选 | 版本分组     | 直接消费者                                                                                                                                 |
| ------------------------------ | ------- | -------- | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| @apollo/client                 | 4.2.6   | 4.2.12   | 同线         | bookmarks、collections、custom-graphql、self-tools                                                                                         |
| @base-ui/react                 | 1.6.0   | 1.8.0    | 同线         | ui                                                                                                                                         |
| @graphql-codegen/cli           | 7.2.0   | 7.4.0    | 同线         | bookmarks、collections                                                                                                                     |
| @graphql-codegen/client-preset | 6.1.0   | 6.1.3    | 同线         | bookmarks、collections                                                                                                                     |
| @hookform/resolvers            | 5.4.0   | 5.9.1    | 同线         | bookmarks、collection-tree、collections、portal                                                                                            |
| @rolldown/plugin-babel         | 0.2.3   | 0.2.4    | 同线         | portal                                                                                                                                     |
| @tailwindcss/vite              | 4.3.2   | 4.3.3    | 同线         | portal                                                                                                                                     |
| @tanstack/react-table          | 8.21.3  | 9.2.4    | major        | custom-table                                                                                                                               |
| @testing-library/jest-dom      | 6.9.1   | 7.0.1    | major        | self-tools                                                                                                                                 |
| @testing-library/react         | 16.3.2  | 16.3.3   | 同线         | self-tools                                                                                                                                 |
| @types/react                   | 19.2.17 | 19.2.18  | 同线         | self-tools                                                                                                                                 |
| @types/react-dom               | 19.2.3  | 19.2.7   | 同线         | self-tools                                                                                                                                 |
| @vitejs/plugin-react           | 6.0.3   | 6.1.1    | 同线         | portal                                                                                                                                     |
| code-inspector-plugin          | 1.6.6   | 2.0.8    | major        | portal                                                                                                                                     |
| dayjs                          | 1.11.21 | 1.11.23  | 同线         | time                                                                                                                                       |
| graphql                        | 16.14.2 | 17.0.2   | major        | bookmarks、collections、self-tools                                                                                                         |
| i18next                        | 26.3.6  | 26.4.2   | 同线         | i18n                                                                                                                                       |
| jsdom                          | 29.1.1  | 30.0.1   | major        | self-tools                                                                                                                                 |
| knip                           | 6.26.0  | 6.35.1   | 同线         | self-tools                                                                                                                                 |
| lucide-react                   | 1.24.0  | 1.43.0   | 同线         | bookmarks、collection-tree、collections、custom-table、portal、ui                                                                          |
| markdown-to-jsx                | 9.8.2   | 9.10.2   | 同线         | markdown                                                                                                                                   |
| monaco-editor                  | 0.55.1  | 0.56.0   | 0.x 跨 minor | edit                                                                                                                                       |
| oxc-parser                     | 0.137.0 | 0.149.0  | 0.x 跨 minor | self-tools                                                                                                                                 |
| oxfmt                          | 0.58.0  | 0.67.0   | 0.x 跨 minor | self-tools                                                                                                                                 |
| oxlint                         | 1.73.0  | 1.82.0   | 同线         | self-tools                                                                                                                                 |
| oxlint-tsgolint                | 0.24.0  | 7.0.2001 | major        | self-tools                                                                                                                                 |
| react                          | 19.2.7  | 19.2.8   | 同线         | bookmarks、collection-tree、collections、custom-graphql、custom-table、details、edit、hooks、i18n、markdown、portal、self-tools、types、ui |
| react-dom                      | 19.2.7  | 19.2.8   | 同线         | portal、self-tools                                                                                                                         |
| react-hook-form                | 7.81.0  | 7.87.0   | 同线         | bookmarks、collection-tree、collections、portal                                                                                            |
| react-i18next                  | 17.0.9  | 17.0.13  | 同线         | i18n                                                                                                                                       |
| react-router                   | 7.18.1  | 8.3.1    | major        | bookmarks、collections、portal                                                                                                             |
| shadcn                         | 4.13.0  | 4.21.0   | 同线         | portal                                                                                                                                     |
| sonner                         | 2.0.7   | 2.0.8    | 同线         | bookmarks、ui                                                                                                                              |
| tailwindcss                    | 4.3.2   | 4.3.3    | 同线         | portal                                                                                                                                     |
| vite                           | 8.1.4   | 8.2.2    | 同线         | markdown、portal、self-tools                                                                                                               |
| vite-bundle-analyzer           | 1.3.8   | 1.3.9    | 同线         | portal                                                                                                                                     |
| vitest                         | 4.1.10  | 5.0.0    | major        | self-tools                                                                                                                                 |
| zustand                        | 5.0.14  | 5.0.15   | 同线         | i18n、portal、ui                                                                                                                           |

### Rust

| crate        | 当前锁定版本   | 当前声明 | 兼容候选 | 最新候选 |
| ------------ | -------------- | -------- | -------- | -------- |
| anyhow       | 1.0.103        | 1.0.103  | 1.0.104  | 1.0.104  |
| async-trait  | 0.1.89         | 0.1.89   | 0.1.92   | 0.1.92   |
| base64       | 0.21.7、0.22.1 | 0.22.1   | 0.22.1   | 0.23.1   |
| bollard      | 0.21.0         | 0.21.0   | 0.21.1   | 0.21.1   |
| bytes        | 1.12.1         | 1.11.1   | 1.12.1   | 1.12.1   |
| clap         | 4.6.1          | 4.6.1    | 4.6.6    | 4.6.6    |
| diesel       | 2.3.11         | 2.3.11   | 2.3.13   | 2.3.13   |
| dns-lookup   | 3.0.1          | 3.0.1    | 3.0.1    | 4.0.1    |
| futures      | 0.3.32         | 0.3.32   | 0.3.34   | 0.3.34   |
| futures-util | 0.3.32         | 0.3.32   | 0.3.34   | 0.3.34   |
| hmac         | 0.12.1         | 0.12.1   | 0.12.1   | 0.13.0   |
| http         | 1.4.2          | 1.4.2    | 1.5.0    | 1.5.0    |
| http-body    | 1.0.1          | 1.0.1    | 1.1.0    | 1.1.0    |
| pingora      | 0.8.1          | 0.8      | 0.8.1    | 0.9.0    |
| rcgen        | 0.14.8         | 0.14.8   | 0.14.10  | 0.14.10  |
| reqwest      | 0.13.4         | 0.13.4   | 0.13.5   | 0.13.5   |
| serde        | 1.0.228        | 1.0.228  | 1.0.229  | 1.0.229  |
| serde_json   | 1.0.150        | 1.0.150  | 1.0.151  | 1.0.151  |
| sha2         | 0.10.9         | 0.10.9   | 0.10.9   | 0.11.0   |
| thiserror    | 1.0.69、2.0.18 | 2.0.18   | 2.0.20   | 2.0.20   |
| time         | 0.3.47         | =0.3.47  | 0.3.47   | 0.3.55   |
| tokio        | 1.52.3         | 1.52.3   | 1.53.1   | 1.53.1   |
| tokio-rustls | 0.26.4         | 0.26.4   | 0.26.5   | 0.26.5   |
| tower-http   | 0.6.11、0.7.0  | 0.7.0    | 0.7.1    | 0.7.1    |
| uuid         | 1.23.4         | 1.23.4   | 1.26.1   | 1.26.1   |
| volo         | 0.12.3         | 0.12.3   | 0.12.4   | 0.12.4   |
| volo-thrift  | 0.12.4         | 0.12.4   | 0.12.6   | 0.12.6   |
