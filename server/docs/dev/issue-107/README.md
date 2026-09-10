# Issue #107：crawler 所有权与确定性测试

状态：**Done**。crawler 重构、实测发现的标签解析与抓取表单修复，以及必要验证均已完成。

基线 `cfdb30a`。对应 [Issue #107](https://github.com/suxiaoshao/self-tools/issues/107)；所有者为 `novel_crawler` 与 bookmarks 的私有 crawler adapter。稳定运行合同归 [后端 README](../../../README.md)，本计划只记录本次改动的依据、目标和必要验证。

## 目标与事实

让已抓取的数据通过同步借用读取，默认测试不依赖公网，并把 crawler 的公开接口收敛到真实消费者需要的能力。

| 基线事实                                                                | 证据与影响                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 两站小说都在初次抓取时保存完整章节，但 `chapters()` 异步返回 `Vec` 副本 | [NovelFn](../../../common/novel_crawler/src/novel.rs)、两站实现均 `Ok(self.chapters.clone())`；[bookmarks adapter](../../../packages/bookmarks/src/application/crawler.rs) 随后再次转换为拥有所有权的 `DraftChapter`，产生一次多余的整表复制。 |
| 作者、小说共四项默认测试访问真实站点，主要断言只是请求成功              | 两站 `author.rs`、`novel.rs` 的 `#[tokio::test]`；网络、反爬或页面变化会影响 workspace tests 与提交钩子。                                                                                                                                      |
| 页面下载与解析混在抓取入口                                              | [网络辅助函数](../../../common/novel_crawler/src/implement.rs) 及四个站点模型入口；现有纯测试只覆盖少量 URL 解析与错误所有权。                                                                                                                 |
| 唯一仓库内生产消费者为 bookmarks                                        | 根 workspace 和 bookmarks manifest 的依赖声明，以及 `application/crawler.rs`；#99 已将作者作品与小说作者的按需抓取放入 application。                                                                                                           |
| 部分公开面没有实现或消费者                                              | `ChapterDetail` 无实现；`AuthorFn::novels`、`NovelFn::author` 没有调用方；多个关联类型仅维持循环类型关系。具体站点类型仍被 adapter 用于构造 URL，不能全部隐藏。                                                                                |

此次修改 Rust crate 内部合同与唯一消费者。保留现有 GraphQL 字段、应用快照、来源 ID 校验、错误分类和数据库行为；移动端、依赖升级、抓取调度、缓存与图片代理不属于本计划。仓库外消费者未得到验证；本次以仓库内合同为兼容边界，不保留无消费者的过渡 API。

用户后续授权在同一 Issue 修复两处实测问题，扩展到 bookmarks 的两个抓取表单：起点标签改取 DOM 纯文本，过滤空标签与“相似标签小说”功能入口，保留以名称作为 ID 的合同，不自动修改已存数据；Select 初值使用 `value ?? null`，用本地化 `items` 映射显示值，保留原有必填校验和 GraphQL 枚举参数。使用实际嵌套链接结构的合成 fixture 复现标签问题，并用两个真实表单验证选择、提交参数与警告；依据 [shadcn Base Select 文档](https://ui.shadcn.com/docs/components/base/select) 接入现有组件，不修改共享 UI 的实现或版本。计划继续保留在原位置，前端修复作为本计划的受影响消费者扩展。

## 一、数据读取与公开接口

### 章节使用同步 slice

选择 `&[Self::Chapter]`：两站都已存储 `Vec`，消费者按顺序遍历，无需额外分配、共享引用计数或动态 iterator。以下为目标接口的变化部分，其余字段 getter 与抓取入口沿用现有签名：

```rust
pub trait NovelFn: Sized + Send + Sync {
    type Chapter: ChapterFn;
    type Tag: TagFn;
    const SITE: NovelSite;

    fn chapters(&self) -> &[Self::Chapter];
    // 保留 get_novel_data、author_id、tags 及已有元数据 getter。
}
```

`chapters()` 只借用已解析的完整章节，保持来源顺序，不发请求、返回错误或复制元素。合法空目录返回空 slice；下载或解析失败仍由 `get_novel_data` 返回。结构缺失不能在提取 parser 时改成成功的空目录，bookmarks 的刷新空列表保护继续由 application 持有。

`NovelFn::SITE` 由两站实现指定。bookmarks 直接遍历 `value.chapters()`，移除该处 `.await` 与错误转换；小说及其章节的站点均取 `T::SITE`，不再沿 `T::Author` 或 `T::Chapter::Author` 间接推导。转换后的 `DraftNovel` / `DraftChapter` 仍拥有数据，离开 adapter 后不借用 crawler 模型。

### 删除无消费者的关系与能力

| 接口                 | 目标                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `AuthorFn`           | 保留 `SITE`、抓取入口、`novel_ids() -> &HashSet<String>` 和元数据 getter；删除 `novels()`、`type Novel` 与重复的 `Sized`。           |
| `NovelFn`            | 删除 `author()`、`type Author` 与重复的 `Sized`；保留 `author_id()`，按上面的合同新增 `SITE`。                                       |
| `ChapterFn`          | 保留章节元数据和 URL 方法；删除 `type Author`、`type Novel`。                                                                        |
| `TagFn`              | 保留 ID、名称和 URL 方法；删除 `type Author`、`type Novel`、`type Chapter`。                                                         |
| `ChapterDetail`      | 删除 trait 与根 re-export；不预留未实现的正文抓取能力。                                                                              |
| 站点模型、枚举、错误 | 保留两站作者／小说／章节／标签类型、`NovelSite`、`NovelStatus` 和 `NovelError` 的实际公开用途；站点 parser 和 HTTP helper 保持私有。 |

删除两个作者实现中随 `novels()` 失效的 `try_join_all`，移除 crawler manifest 的 `futures` 依赖；bookmarks 仍用它实现按需抓取，不改根 workspace 或其他消费者的依赖。由 Cargo 更新锁文件，只保留实际解析变化。

上述接口与所有实现、调用方在同一工作包更新。bookmarks 的作者作品与小说作者仍由 `Application::draft_author_novels` / `draft_novel_author` 按字段请求触发，不因删除旧快捷方法而提前抓取。

## 二、下载与解析分离

保留公开的 `get_author_data(id)` / `get_novel_data(id)` 作为异步网络入口。每个入口先下载和解码，再调用所属站点模型内的纯解析函数，最终返回同一模型：

```text
bookmarks application
  → 站点 get_*_data(id)
  → 私有 HTTP 下载与字符解码
  → 纯 parser（来源 ID + 解码后的页面）
  → crawler 模型
  → 拥有所有权的 application 快照
```

- 起点作者使用一个 UTF-8 页面；小说保留详情页与目录页并发下载，parser 显式接收这两个页面。
- 晋江作者、小说各使用一个页面，HTTP 层继续按现有 GB18030 fallback 解码；parser 接收 Rust 字符串，不承担字符编码探测。
- parser 不访问网络、环境、数据库或当前时间，结果仅由输入决定。选择器、标签、章节时间的 UTC+8 解释和当前字段规范化保持不变。
- 合并重复下载流程时保留 20 秒超时、`error_for_status`、字符集行为和当前 User-Agent 差异：现有 `text_from_url` 使用移动端 UA，晋江小说的 `get_doc` 未设置该 UA。不要在拆分中默默改变请求策略。
- 保留 `crawler.http` span 和 `NovelError` 的 source；bookmarks 的 timeout/connect/upstream 错误映射不变。解析失败不记录完整页面。

通过私有 HTTP helper 接受 URL 的现有能力，用 loopback 测试真实 reqwest 响应处理。无需新增公开 transport trait、运行时站点地址配置、通用爬虫框架或录制代理；纯 parser 已提供主要测试接缝。

## 三、测试与 fixture

### 默认测试

在 `server/common/novel_crawler/tests/fixtures/` 保存最小、手工维护的 HTML／目录 JSON 样本，通过 `include_str!` 交给所属私有 parser 的单元测试。初始样本按当前已支持结构构造，名称、简介、ID 和章节信息使用合成值；在 fixture README 标明合成来源及覆盖的结构，不能宣称它们证明当前公网仍兼容。

固定样本覆盖两站作者与小说的完整解析入口，并组合断言关键输出：

- 作者 ID、名称、图片、简介和去重后的作品 ID，避免依赖 `HashSet` 的遍历顺序。
- 小说状态、作者 ID、标签，以及跨卷章节顺序、所属小说 ID、字数与 UTC+8 时间；起点兼顾有／无秒的时间格式，晋江兼顾已有 `href`／`rel` 与非章节行规则。
- 合法空目录与缺失必需结构的区别，以及损坏目录 JSON、无效日期或数字的代表性错误。对基础样本做定向变体，避免为每个字段复制一整页。
- 保留现有 URL 和错误 source 测试；新增借用检查确认重复读取指向模型内同一非空章节存储。

HTTP 层使用本地受控响应验证成功解码、GB18030 fallback 和非 2xx 错误传播；只绑定 `127.0.0.1` 的随机端口。若需缩短超时测试，使用私有测试注入而不改变生产的 20 秒预算。测试不得通过真实代理、DNS 或公开站点完成。

默认 `cargo test` 只执行纯解析和 loopback 测试。`cargo --offline` 只控制依赖获取，不能用它证明测试本身没有公网访问；验证时检查所有实际测试入口与 URL 来源。

### 显式 live suite

四项真实站点检查位于 `tests/live.rs`，全部使用带原因的 `#[ignore]`。只通过现有公开抓取入口测试，并断言返回 ID、必需元数据及章节所属关系，取消整份模型的打印。不使用登录 Cookie，不抓章节正文，不发写请求。

显式运行命令：

```bash
cargo test -p novel_crawler --test live -- --ignored --test-threads=1
```

live suite 要求公网可用，由开发者显式执行，不加入默认提交钩子、PR CI 或定时任务。站点改变时，先核对公开页面，再最小化更新 fixture 与 parser；记录采样日期、公开来源和删改说明。样本不保留正文、Cookie、token、访问者数据或无关脚本。

沿用已锁定的 reqwest、scraper、tokio 等依赖；测试所需 Tokio runtime / 网络能力在 crawler 的 dev-dependencies 显式声明，不依赖其他 workspace crate 恰好启用 feature，不新增专用 mock 库。

## 四、实施顺序与验证

1. **接口及消费者**：修改 traits、两站实现、根 exports 与 bookmarks adapter，删除失效依赖。编译两 crate，确认 application 快照与错误边界保持一致。
2. **解析与默认测试**：提取四个纯 parser，接入固定样本及必要 loopback 测试，再迁移 live suite。默认测试始终保留关键解析断言，不能仅把旧测试全部忽略后交付。
3. **所有者说明与检查**：更新后端 README 中的借用、按需抓取及测试入口说明；完成下表验证，把实际结果和剩余限制写回本计划。

| 必要验证                                                                                 | 保护的行为                                                                            |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `cargo fmt --all -- --check`、`cargo clippy -p novel_crawler -p bookmarks --all-targets` | traits、feature、测试 target 与唯一消费者一致；使用最小范围格式化修复，保留无关文件。 |
| `cargo test -p novel_crawler`                                                            | 固定样本、错误来源、章节借用、字符解码与受控 HTTP；live 测试默认忽略。                |
| `cargo test -p bookmarks`                                                                | 消费者默认回归及 schema 快照；沿用专用数据库测试的现有忽略条件。                      |
| 检查测试入口与请求来源，依赖准备好后在可用的公网受限环境执行默认测试                     | 默认测试无需真实站点；loopback 仍应可用，不把 Cargo 的 offline 选项当成网络隔离。     |
| `git diff --check` 与受影响文档格式检查                                                  | 文档和改动完整性。                                                                    |

本轮实现交付不要求重新部署 Docker、执行数据库测试或跑全站 UI。生产业务合同与 schema 不变时无需重生成前端文件；如果实现暴露实际合同变化，应先回到该边界判断范围。CI 保持现有 workspace 测试入口，bookmarks 镜像 workflow 已覆盖 `server/common/novel_crawler/**`，无需新增触发配置。

## 完成记录

- 已落实同步章节 slice、`NovelFn::SITE`、无消费者接口删除和 bookmarks adapter 同步；应用快照继续拥有数据，关联字段仍按需抓取。
- 四个抓取入口调用各自的私有纯 parser；HTTP 下载集中到 `implement/http.rs`，保留两类 User-Agent、字符集 fallback、非 2xx 错误和 trace。仅从 crawler 移除 `futures`，Cargo.lock 没有版本升级。
- 五份合成页面样本覆盖两站作者／小说与起点目录；固定测试保留 URL 和错误 source 回归，新增完整解析、章节借用及 loopback HTTP 覆盖。四项公网检查已独立为 ignored live target。
- `cargo check -p novel_crawler -p bookmarks --offline`、`cargo clippy -p novel_crawler -p bookmarks --all-targets --offline` 通过。
- crawler 默认测试 **17 项通过**，live **4 项忽略**；bookmarks 默认测试 **21 项通过、6 项按原配置忽略**，包含 schema／浏览器 operation 回归。
- 在 macOS `sandbox-exec` 中禁止 `network*`，只允许 localhost inbound／outbound，重新运行 crawler 默认测试全部通过；另确认非 loopback 连接被规则拒绝。初次普通沙箱运行仅因禁止本机监听而阻塞两项 HTTP 测试，已在允许 loopback 的环境完成验证。
- Rust 格式检查、受影响文档／样本格式检查和 `git diff --check` 通过。未运行专用数据库测试；固定样本本身不能证明当前公网兼容性。

### 后续应用内浏览器验证

按用户要求，用当前工作区构建并更新本机 bookmarks，确认 `/bookmarks --check-ready` 成功；其他服务及 PostgreSQL 容器 ID 保持不变。恢复 3000 端口 Vite 后，使用真实 HTTPS 会话在应用内浏览器以 1280×900 验证，没有 API mock 或业务写入。浏览器尺寸在结束时恢复。

| 真实来源              | 观察结果                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------ |
| 起点小说 `1040796068` | 《从背刺时间线开始》、作者及封面可见，返回 62 章，字数与时间可读。                         |
| 晋江小说 `6357210`    | 《别逼我放弃人籍》中文、封面和标签可读，返回 74 章。                                       |
| 起点作者 `4362948`    | 远瞳，返回 7 部作品，封面加载成功，《深海余烬》的章节弹窗正常打开和关闭。                  |
| 晋江作者 `809836`     | 素衣渡江，返回 17 部作品，封面加载成功，《大宋第一衙内》的章节弹窗正常打开和关闭。         |
| 无效作者 `0` 与恢复   | 显示安全错误及请求编号，保存草稿禁用；重新查询有效作者后恢复结果、清除错误并重新启用保存。 |

初次实测发现起点标签包含 HTML、抓取页 Select 出现受控状态警告并显示枚举值；用户随后授权在本 Issue 修复，结果如下。浏览器核对没有保存草稿、执行刷新写入或修改阅读记录。这些结果覆盖真实站点抽样，不表示所有来源页面或所有浏览器均已验收。

### 实测问题修复

- 起点 `map_tag` 原先使用 `inner_html()`，导致嵌套链接及“相似标签小说”入口进入标签数据。现改为提取并 trim DOM 文本，过滤空值与功能入口，保留标签 ID 等于名称的合同。已用嵌套链接 fixture 复现失败并验证修复，样本来源与替换说明写入 fixture README。
- 两个抓取表单原先将 RHF 的初始 `undefined` 直接传给 Select，后续切换为字符串；同时缺少 Base UI 的 `items` 映射。现以 `null` 表示未选状态，使用同一份本地化站点映射渲染选项和已选值，提交仍发送 `QIDIAN` / `JJWXC`。
- 新增两个真实表单的回归：未选站点不发请求，选择后显示中文，切换站点时请求参数保持枚举值，不出现受控状态警告。测试通过 feature 公开懒入口，明确等待动态导入完成，避免把模块加载耗时算进业务断言的等待窗口。
- 前端 **62 项测试通过**；lint／类型／依赖边界、生产构建预算检查通过；crawler **17 项测试通过、4 项 live 默认忽略**，受影响 Rust Clippy 通过。
- 已部署修复后的本机 bookmarks。应用内浏览器确认两个选择框显示中文、控制台没有警告或错误；起点真实样本显示 8 个纯文本标签，“相似标签小说”不再混入，62 章仍正常展示。没有修改存量标签或业务数据。
