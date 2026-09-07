# Issue #97：将外部请求收敛为两站图片代理，并精确限定 CORS 来源

## 1. 状态、目标与检查重点

- 状态：`In progress`（代码和受控验证已完成；真实网络与浏览器验收尚未完成）。
- Issue：[#97](https://github.com/suxiaoshao/self-tools/issues/97)，对应 RF-003、RF-007。
- 分支：`codex/issue-97-http-trust-boundaries`；代码基线：`0b71c48`。
- 证据日期：2026-09-07。
- 规范计划：`docs/dev/issue-97/README.md`；由[根索引](../README.md)发现，由 [#94](../issue-94/README.md)跟踪。
- 所有者：bookmarks HTTP 图片代理、middleware CORS；消费者为 login、bookmarks、collections 及现有前端图片标签。
- 实施提交：尚未提交。生产代码已实现，受控测试与包级检查通过；未部署。

目标是保留起点和晋江的小说封面、作者头像显示，让 `/fetch-content` 无法请求任意网站、内网或非图片资源，同时消除 CORS 将相似域名误判为可信来源的问题。

用户已明确：当前仅支持起点和晋江，并在检查文档后要求按照计划实现。D-01 至 D-08 是本轮实施合同。

检查时优先看第 3 节：公开访问方式、图片白名单的覆盖范围、容量限制，以及默认仅信任 `https://sushao.top`。首次范围只承诺已核验地址模式；未命中的历史图片显示现有占位图，不自动扩大白名单。

不包含认证/session 改造（#96）、全仓错误日志改造（#98）、通用配置集中化（#105）、crawler API 重构（#107）、数据库修复或 UI 组件替换。本次仍需避免图片路由继续使用现有会返回内部错误的适配器。

## 2. 事实与调查证据

### 2.1 仓库证据

路径均相对仓库根目录。

| 编号 | 分类     | 已确认事实                                                                                                                                                                            | 影响                                                     |
| ---- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| E-01 | 当前代码 | `server/packages/bookmarks/src/router.rs::get_router` 注册 `/fetch-content`；`router/fetch_content.rs::fetch_content` 直接 `reqwest::get(url)`，转发 status、全部 headers 和流式 body | 无鉴权、目标限制或本地响应预算                           |
| E-02 | 当前代码 | `web/packages/bookmarks/src/utils/image.ts::getImageUrl` 把原图 URL 放进代理查询参数；AuthorSelect、小说/作者列表、详情、抓取预览使用图片标签消费                                     | 保留现有请求形状；不能要求图片标签附加 Authorization     |
| E-03 | 当前代码 | crawler 起点小说读 `og:image` 并补 HTTPS，作者读 `data-src`；晋江读 `.noveldefaultimage`、`.authordefaultimage` 的 `src`                                                              | 页面装饰图、读者头像和懒加载占位图不属于本需求           |
| E-04 | 当前代码 | `server/common/middleware/src/cors.rs` 用 `ends_with("sushao.top")`；允许 credentials、GET/POST/PUT 和 Content-Type/Authorization                                                     | `evilsushao.top` 会被误接受；共享消费者三个服务一起迁移  |
| E-05 | 当前代码 | gateway 默认主站 `sushao.top`；portal 是唯一应用入口，Vite 的 origin/HMR 指向 `https://sushao.top`                                                                                    | 默认可信来源取主站；API 的目标域名不等于浏览器 Origin    |
| E-06 | 当前代码 | bookmarks `GraphqlError::IntoResponse` 包含内部 source；共享 `trace_layer` 记录 URI 和 headers                                                                                        | 图片错误使用独立空响应；图片路由从共享详细请求日志中分离 |
| E-07 | 当前依赖 | workspace 已有 reqwest 0.13.4、url 2.5.8、tokio 1.52.3；middleware 使用 tower-http 0.7.0                                                                                              | 复用现有库，不新增安全代理框架、不升级工具链             |

### 2.2 两站图片实测

官方页面的原始 HTML 标签是地址来源；抽样不是站方承诺的完整 CDN 列表。下表六种模式均已读取图片响应头与前 12 字节；未下载、入库或提交原站图片。

| 编号 | 官方页面                                                                                             | 页面字段与图片样例                                                                                                 | 网络核验                                                           |
| ---- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| E-08 | [起点作品](https://m.qidian.com/book/1026909178.html)                                                | `og:image`：`//bookcover.yuewen.com/qdbimg/349573/1026909178/180`                                                  | HTTPS 200，无重定向，JPEG；Content-Length 23668                    |
| E-09 | [起点作者](https://m.qidian.com/author/4362120/)；另核对[远瞳](https://m.qidian.com/author/4362948/) | `data-src`：`https://ccportrait.yuewen.com/apimg/349573/p_3626960803214301/100`                                    | 首个样本 HTTPS 200，无重定向，JPEG；Content-Length 9341            |
| E-10 | [晋江作品](https://www.jjwxc.net/onebook.php?novelid=4375938)                                        | `src`：`https://i4-static.jjwxc.net/tmp/backend/authorspace/s1/19/18294/1829338/20230316185201_300_420.jpg`        | HTTPS 200，无重定向，JPEG；Content-Length 64536                    |
| E-11 | [晋江生成封面](https://www.jjwxc.net/onebook.php?novelid=951169)                                     | `src`：`https://i9-static.jjwxc.net/novelimage.php?novelid=951169&coverid=21&ver=6c95f52cd5e5d1c46c1df1da8abaa2d4` | HTTPS 200，无重定向；header 声称 JPEG，实际 PNG；无 Content-Length |
| E-12 | [晋江默认作者图](https://www.jjwxc.net/oneauthor.php?authorid=809836)                                | `src`：`http://static.jjwxc.net/tmp/guanli/authordefaultcover/20230411155238_643511c6e50a1_350.png`                | 改 HTTPS 后 200，无重定向，PNG；Content-Length 45320               |
| E-13 | [晋江自定义作者图](https://www.jjwxc.net/oneauthor.php?authorid=1322620)                             | `src`：`http://i5-static.jjwxc.net/tmp/backend/authorspace/s1/14/13227/1322620/20240326161418.png`                 | 改 HTTPS 后 200，最终 URL 不变，PNG                                |

E-11 表明必须检查实际字节，不能依赖扩展名或上游 Content-Type。E-10 中另有 `_src` 生成封面，但当前 crawler 读取的是 `src`，本计划不改变 crawler 选择策略。

### 2.3 上游能力依据

- [OWASP SSRF 防护](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)：白名单、重定向约束、DNS/IP 检查是此类固定目标代理的适用防护。
- [reqwest 0.13.4 Resolve](https://docs.rs/reqwest/0.13.4/reqwest/dns/trait.Resolve.html)：resolver 返回实际用于连接的 `SocketAddr` 迭代器。本机同版本源码确认 `ClientBuilder` 提供 `dns_resolver`、`no_proxy`、`redirect`、`https_only`、`timeout`、`connect_timeout`、`retry`。
- [Rust IpAddr 文档](https://doc.rust-lang.org/std/net/enum.IpAddr.html#method.is_global)：`is_global` 仍是 nightly API；不升级工具链或写不可用调用，使用第 4 节的显式保守地址规则。
- 标准 URL 解析复用 workspace `url`；CORS 复用现有 tower-http，不自写 CORS 协议处理器。

## 3. 设计决定

| 编号 | 决定                                                                                                                  | 理由及取舍                                                                                                                      |
| ---- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | 保留 `GET /fetch-content?url=...`，作为公开、无身份凭据的受限图片代理                                                 | 兼容 `<img>`；不引入签名 URL、session 或 token 查询参数。CORS/Referer 不作为身份验证。公开代理仍可能被消耗带宽，D-05 只限制上界 |
| D-02 | 精确域名与路径白名单固定在 bookmarks 源码中                                                                           | 不提供任意域名环境变量，不支持 `*.jjwxc.net`/`*.myqcloud.com`。新增模式须有官网样本和测试                                       |
| D-03 | 允许已知来源的 HTTP、协议相对 URL 作为输入，规范化为 HTTPS 后才请求；禁止所有重定向                                   | 样本均可直接 HTTPS；未知跳转拒绝，未来确需支持时重新设计逐跳规则                                                                |
| D-04 | 校验 DNS 返回地址并直接交给连接器；禁用系统代理和 HTTP 自动重试                                                       | 避免校验后二次解析或通过代理绕过地址约束；保留正常证书及主机名校验                                                              |
| D-05 | 单进程最多 16 个下载；全局令牌桶每秒补 8 个、容量 32；连接 3 秒、总时长 10 秒；URL 输入最大 2048 字节；单图最大 5 MiB | 参数是本轮采用的初始预算；不依据未经信任的 X-Forwarded-For 分配额度。多副本各自计数，无分布式限流承诺                           |
| D-06 | 完整读取并校验后再返回；JPEG/PNG/GIF/WebP 签名识别；禁止 SVG/HTML                                                     | 能在超限前返回明确错误；不转码、不开解码器、不做图片内容净化。峰值下载缓冲约 80 MiB，另有 HTTP/分配开销及已发送响应占用         |
| D-07 | CORS 使用完整 Origin 集合；默认仅 `https://sushao.top`；显式配置覆盖默认                                              | 生产不隐式放行所有子域名或 localhost。保留业务请求所需 credentials、GET/POST/PUT、Content-Type/Authorization                    |
| D-08 | 不修改数据库历史图片；不搬动前端组件；未知图片显示原有回退效果                                                        | 后端负责受支持的 URL 规范化。暂未观察的旧 CDN 地址不保证兼容；不会批量访问数据库或静默扩大白名单                                |

### 3.1 图片白名单（L-01）

所有匹配都在标准解析和原始输入检查后执行，路径区分大小写。下面的数字段为非空 ASCII 十进制数字，文件路径匹配整个字符串。

| 精确主机                                                            | 允许路径/参数                                                                                                                                            | 覆盖                               |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `bookcover.yuewen.com`                                              | `/qdbimg/349573/{数字}/180`；无查询参数                                                                                                                  | 起点当前 crawler 封面              |
| `ccportrait.yuewen.com`                                             | `/apimg/349573/p_{数字}/100`；无查询参数                                                                                                                 | 起点作者头像                       |
| `i0-static.jjwxc.net`、`i4-static.jjwxc.net`、`i5-static.jjwxc.net` | `/tmp/backend/authorspace/s{数字}/{数字}/{数字}/{数字}/{文件名}`；文件名仅 ASCII 字母、数字、下划线、连字符，加 `.jpg/.jpeg/.png/.gif/.webp`；无查询参数 | 已观察的晋江自定义封面与头像路径族 |
| `i9-static.jjwxc.net`                                               | 精确 `/novelimage.php`；`novelid`、`coverid`、`ver` 各一次且必需；前两者为数字，ver 为 32 位十六进制；参数顺序不限，无其他参数                           | 晋江生成封面                       |
| `static.jjwxc.net`                                                  | `/tmp/guanli/authordefaultcover/{文件名}`，文件名规则同上；无查询参数                                                                                    | 晋江默认作者图                     |

`i0-static.jjwxc.net` 还允许精确 `/authorimagespace.php`，仅 `path`（标准 Base64 编码的非空数字作者 ID）与 `imageName`（上述图片文件名）各一次，参数顺序不限，拒绝其他参数。

允许三处自定义 CDN 上相同路径族，是基于同站同类上传资源的设计选择，未声称已遍历所有路径组合。暂不放行 i1/i2/i3/i6 等未核验分片、旧 `qpic.cn`、读者头像、装饰图片、任意腾讯云 bucket、外部自定义图床。

## 4. 目标实现与合同

### 4.1 文件所有权

以下为本轮新增/修改的手写路径；F-17 由 Cargo 维护。

```text
docs/dev/issue-97/README.md                         F-01 本规范计划
docs/dev/README.md                                F-02 注册索引
docs/dev/issue-94/README.md                         F-03 #97 设计进度
server/packages/bookmarks/src/
├── router.rs                                      F-04 组合图片状态和 GraphQL 路由
├── router/fetch_content.rs                         F-05 HTTP 请求/响应及限额入口
├── router/fetch_content/
│   ├── policy.rs                                  F-06 URL 和地址白名单纯函数
│   ├── client.rs                                  F-07 经验证的 DNS、专用 HTTP client、下载预算
│   ├── error.rs                                   F-08 图片专用错误及 HTTP 映射
│   └── tests.rs                                   F-09 隔离测试、合成响应与签名字节
└── main.rs                                        F-10 仅调整路由层日志挂载，保留 CORS 外层
server/common/middleware/
├── src/cors.rs                                    F-11 Origin 配置解析与 CORS 层
├── src/lib.rs                                     F-12 导出 CORS 配置错误类型
└── Cargo.toml                                     F-13 CORS 用 url 替换 nom
server/packages/{bookmarks,login,collections}/src/main.rs
                                                   F-10/F-14/F-15 处理 CORS 初始化 Result
server/packages/bookmarks/Cargo.toml                F-16 声明 url、必要 tokio feature、显式 TLS
Cargo.lock                                         F-17 由 Cargo 更新依赖边；不手改
server/README.md、web/README.md                     F-18/F-19 记录来源配置、图片兼容与运维限制
server/packages/gateway/src/proxy.rs                F-20 图片 query 与错误日志脱敏
server/packages/gateway/README.md                   F-21 记录该路径日志边界
```

仅 bookmarks 拥有站点图片策略；middleware 不依赖业务服务。F-11 内就地维护单元测试，无新 crate 或 `mod.rs`。其他业务错误仍归 #98；不批量清理 GraphqlError 的历史 variant。

### 4.2 HTTP 合同（C-01）

```http
GET /fetch-content?url=<编码后的原图片地址>

HTTP/1.1 200 OK
Content-Type: image/png
Content-Length: <实际字节数>
Cache-Control: public, max-age=3600
X-Content-Type-Options: nosniff
Content-Security-Policy: default-src 'none'; sandbox
```

成功 body 是完整图片字节；实际类型只能为 `image/jpeg`、`image/png`、`image/gif`、`image/webp`。服务端不保留图片缓存，浏览器缓存最多一小时。图片下载路径仅 GET；CORS 层可处理 OPTIONS 预检，图片 handler 显式拒绝 HEAD/其他方法为 405，不能因 axum GET 自动支持 HEAD 而触发无用下载。不支持 Range 或条件请求；不向上游转发用户请求头。

查询参数只允许一个 `url`，缺失、重复、未知字段、过长或无法解码返回 Error-01。应用层总 URI 限制不能防止 HTTP server 解析之前的流量消耗，本次不重构整个入口限额。

所有错误空 body、`Cache-Control: no-store`、`Content-Length: 0`、`nosniff`；429 增加 `Retry-After: 1`。不返回 JSON、上游 body、重定向 Location、内部 URL 或错误 cause。旧前端无需解析新错误码，图片加载失败按现有浏览器/Avatar 回退；不新增 toast、i18n 或客户端重试循环。

### 4.3 URL、DNS 与连接（L-01/L-02）

规范化顺序：

1. 查询解码后的 URL 最多 2048 字节；拒绝控制字符、首尾空白、反斜杠、fragment、userinfo，以及路径中的百分号编码或 `.`/`..` 段，防止 URL 库规范化后掩盖输入。
2. `//` 补 `https:`；只接收 HTTP/HTTPS、域名主机，拒绝 IP literal、尾点主机、非默认端口。HTTP 仅允许 80 或省略，HTTPS 仅允许 443 或省略。
3. 按 L-01 精确验证规范主机、路径和参数，转为 HTTPS 并移除显式默认端口，构成唯一请求 URL；不得回退 HTTP。
4. 专用 reqwest client 使用受控 `Resolve`：异步系统解析，结果非空且每个地址都通过下述地址策略后，直接返回该批 SocketAddr。不得先查 DNS，再由默认 resolver 重新查询。
5. 禁止重定向、系统代理、自定义请求 Host、关闭证书验证及 HTTP 自动重试。连接复用只复用本 client 已验证的连接；每次新解析均校验。DNS 层完成取消的行为以底层系统解析能力为限，HTTP 请求本身受总截止时间约束。

地址策略是保守规则，不宣称覆盖所有网络部署：

- IPv4 拒绝 `0/8`、`10/8`、`100.64/10`、`127/8`、`169.254/16`、`172.16/12`、`192.0.0/24`、`192.0.2/24`、`192.88.99/24`、`192.168/16`、`198.18/15`、`198.51.100/24`、`203.0.113/24`、`224/4`、`240/4`。
- IPv6 只接收 `2000::/3` 内地址，额外拒绝 `2001::/23`、`2001:db8::/32`、`2002::/16`、`3fff::/20`；IPv4-mapped、NAT64、ULA、link-local、multicast 等不在允许集合内。
- 用整数掩码匹配，表及边界测试由 F-06 拥有；若 CDN 使用被保守拒绝的特殊地址，先调查，不在运行时自动豁免。
- 公网地址若被部署网络特殊路由到内部资源，应用层无法独立识别。上线前必须确认实际 DNS/出站网络可满足此策略；需要企业代理的部署不默认兼容。

核心接口如下，已通过编译验证；完整定义以对应实现文件为准：

```rust
// policy.rs：字段私有，调用者只能经 parse 获得已验证目标。
#[derive(Clone)]
pub(super) struct ImageTarget { url: url::Url }
impl ImageTarget {
    pub(super) fn parse(input: &str) -> Result<Self, ImageProxyError>;
    pub(super) fn url(&self) -> &url::Url;
    pub(super) fn source(&self) -> &'static str;
}
pub(super) fn is_allowed_ip(ip: std::net::IpAddr) -> bool;

// client.rs
pub(super) struct ValidatedResolver;
impl reqwest::dns::Resolve for ValidatedResolver {
    fn resolve(&self, name: reqwest::dns::Name) -> reqwest::dns::Resolving;
}
pub(super) struct ImagePayload {
    pub(super) bytes: axum::body::Bytes,
    pub(super) content_type: &'static str,
}
pub(super) async fn download_image(
    client: &reqwest::Client, target: &ImageTarget,
) -> Result<ImagePayload, ImageProxyError>;
```

### 4.4 下载、限额与取消（L-03）

启动时创建一个专用 reqwest client 和图片状态，通过 `Extension<Arc<ImageProxyState>>` 仅注入图片子路由，保持现有 GraphQL state 不变。client 显式开启 TLS；总超时包住 DNS、连接、headers 和读取。禁止所有自动解压并发送 `Accept-Encoding: identity`；上游若仍返回非 identity Content-Encoding，作为无效上游响应拒绝。

```rust
pub(crate) struct ImageProxyState {
    client: reqwest::Client,
    permits: std::sync::Arc<tokio::sync::Semaphore>,
    bucket: std::sync::Mutex<TokenBucket>,
}
struct TokenBucket { tokens: f64, updated_at: std::time::Instant }
impl ImageProxyState {
    pub(crate) fn new() -> Result<Self, reqwest::Error>;
    // 获取成功后调用者持有 permit；不排队、不持 mutex 跨 await。
    fn try_admit(&self, now: std::time::Instant)
        -> Result<tokio::sync::OwnedSemaphorePermit, ImageProxyError>;
}
```

先完成纯 URL 校验，再取令牌和并发许可；任何一个不足返回 429。令牌按单调时钟补充，成功接纳消耗 1 个；并发许可从下载开始持有到有限字节收集完成。下载失败/超时/未来被取消均通过 RAII 释放，无后台继续下载任务。许可释放后 HTTP 发送期间的内存不计入 16 个下载名额，预算不是进程总内存硬上限。

只接受上游 200。先检查 Content-Length（有则不得超过 5 MiB），随后按每块字节累加，上限含所有收到的 body 字节；不能对超大单块先无界追加。超限即丢弃上游 response，不向浏览器发送任何部分图片。禁止自动重试，避免限额被重试放大。

收集后识别 JPEG 的 SOI/标记前缀、PNG 的 8 字节签名、GIF87a/GIF89a、RIFF+WEBP；仅将其视为类型识别，不承诺图像完整解码。签名匹配时忽略错误的上游 MIME，返回本地识别值；无匹配返回 502。SVG/HTML 不在签名允许集合中。

### 4.5 错误与日志（Error / EM / EA）

```rust
#[derive(Debug)]
pub(super) enum ImageProxyError {
    InvalidUrl, ForbiddenTarget, RateLimited,
    UpstreamNotFound, UpstreamTimeout, UpstreamFailure,
    ImageTooLarge, UnsupportedImage, Internal,
}
impl axum::response::IntoResponse for ImageProxyError { /* 按下表生成空响应 */ }
```

| 错误 ID  | 生产条件（EM）                                         | HTTP 适配（EA） | 诊断标识           |
| -------- | ------------------------------------------------------ | --------------- | ------------------ |
| Error-01 | Query 拒绝、长度/URL 语法错误                          | 400             | invalid_url        |
| Error-02 | 不在 URL 白名单                                        | 403             | forbidden_target   |
| Error-03 | 令牌或并发不足                                         | 429             | rate_limited       |
| Error-04 | 上游 404                                               | 404             | upstream_not_found |
| Error-05 | 总截止时间或连接超时                                   | 504             | upstream_timeout   |
| Error-06 | DNS 拒绝/失败、TLS、网络、重定向、其他非 200、无效编码 | 502             | upstream_failure   |
| Error-07 | 实际字节或声明长度超限                                 | 502             | image_too_large    |
| Error-08 | 不支持的文件签名/空 body                               | 502             | unsupported_image  |
| Error-09 | 内部状态异常                                           | 500             | internal           |

所有映射由 F-08 单一维护，C-01 统一响应和浏览器回退语义；不依赖错误字符串判断类型。DNS 拒绝不向客户端泄露具体 IP。日志记录静态错误标识、允许来源类别、状态、耗时；成功时记录最终字节数，失败不累积额外共享字节计数；不记录原始 URL/query、请求头、凭据、图片内容或 reqwest 原始 Debug。

F-10 将共享详细 `trace_layer` 从 bookmarks 整体移到 GraphQL 子路由，图片子路由使用自身有限诊断。保留 GraphQL 原有行为，跨服务日志问题仍归 #98。gateway 的 `proxy.rs::logging` 已对 `/fetch-content` 使用 `logged_path` 去除 query，并用固定错误说明替代该路径的原始 error；其余路径保留现状。

### 4.6 CORS 配置合同（C-02）

```rust
// middleware/src/cors.rs，导出错误类型到 src/lib.rs
#[derive(Debug)]
pub enum CorsConfigError { InvalidEncoding, InvalidOrigin { index: usize } }
pub fn get_cors() -> Result<tower_http::cors::CorsLayer, CorsConfigError>;
```

`CorsConfigError` 实现 Display/Error；只输出变量名和元素序号，不输出原始配置内容。三个 main 的调用统一改为 `get_cors()?`；无效配置在监听前启动失败，禁止静默扩大允许范围。

唯一配置键：`CORS_ALLOWED_ORIGINS`，逗号分隔完整 Origin，启动读取一次。

- 未设置：默认仅 `https://sushao.top`。
- 显式空字符串：允许集合为空，全部不授予跨域读取权限。
- 非空：覆盖默认；去除每项外层空白后解析、去重。空项为错误。
- 仅 HTTP/HTTPS、有效主机和端口；无用户名密码、path（根 `/` 可接受）、query 或 fragment；拒绝尾点域名和 `null`。规范化默认端口后按完整 Origin 比较。
- localhost/127.0.0.1/[::1] 和任意自托管来源必须显式列出；不支持通配符、suffix 或正则配置。
- 请求 Origin 同样解析并精确比较；多个 Origin 或非法值拒绝授予 CORS。无 Origin 的请求正常执行。
- 允许 methods/headers/credentials 保持 D-07，预检和 `Vary: Origin` 由 tower-http 处理；不允许的 Origin 不产生 ACAO，不能声称服务器拒绝了所有这类请求。CORS 不替代认证、CSRF 或图片目标检查。

部署示例（本轮已实现）：

```dotenv
CORS_ALLOWED_ORIGINS=https://sushao.top
# 本地直连时显式覆盖，例如：
# CORS_ALLOWED_ORIGINS=https://sushao.top,http://localhost:3000
```

PR #111 配置补修（已实现）：login 在 Compose 中以 `environment: { CORS_ALLOWED_ORIGINS: null }` 单键透传，避免 CLI 注入整个共享环境文件。xtask 的 `ComposeService.environment` 支持可空值，统一容器创建与配置签名的环境解析：显式值覆盖；null 从进程环境、项目 `.env` 依次解析，均缺失则移除该键。保留未设置使用服务默认值、显式空值禁用跨域、自定义来源原样传递的语义；不增加 `${…}` 插值。更新 Docker/xtask owner 文档，以真实 Compose 配置覆盖上述三态及透传优先级，并用 CLI `config` 核对；提交 hooks 覆盖受影响 Rust 消费者。补修验证：`cargo test -p xtask` 13 项通过；Docker Compose v5.1.2 对隔离的真实配置副本执行 `config --format json`，未设置、空值、自定义值三态在 login/bookmarks/collections 均一致，login 未收到测试共享密钥。未运行容器重建或浏览器部署验证。公开图片请求不依赖 CORS 才能被 `<img>` 展示，因此不以其作为防盗链保证。

## 5. 影响面、依赖与兼容

| 范围 ID                  | 处理                                                                 |
| ------------------------ | -------------------------------------------------------------------- |
| S-01/S-07/S-14           | bookmarks 拥有专用代理模块和安全目标；保持 HTTP 路径，收窄可接受输入 |
| S-10/S-15                | 图片错误与诊断独立；CORS 配置错误在启动时失败                        |
| S-16                     | CORS 新环境变量、禁用代理的部署前置条件；不改变服务拓扑              |
| S-19                     | 显式依赖和 feature 变更，保持版本；见下表                            |
| S-21/S-22                | 中文计划、owner 文档与关键不变量测试                                 |
| S-06/S-11/S-12           | 不变：无 GraphQL/schema、数据库或 codegen 修改                       |
| S-02/S-03/S-04/S-05/S-18 | 不变：现有图片组件、路由、store、浏览器存储、文案保持原行为          |

| 依赖       | 当前 → 目标                                                                                                         | 所有者与理由                                           |
| ---------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| url        | workspace 已有 2.5.8；bookmarks 新增 `workspace = true`，middleware 新增 optional workspace 依赖并接入 cors feature | 标准 URL/Origin 解析；不新增版本                       |
| nom        | middleware optional，仅 CORS 使用 → 移除该 crate 的依赖及 feature 项                                                | 删除旧手写 Origin parser；其他 crate 的 nom 不动       |
| reqwest    | 0.13.4，bookmarks gzip/stream → 保留现有 feature 并显式添加 `rustls`，client 禁用压缩                               | 不依赖其他 crate 的 feature 合并获得 HTTPS；不升级版本 |
| tokio      | 1.52.3，bookmarks 显式补 `net`、`time`、`sync`                                                                      | DNS、截止时间、并发许可                                |
| Cargo.lock | 当前解析 → 由 Cargo 依据 manifest 更新依赖边                                                                        | 无手写改锁，无全量依赖升级                             |

上述能力按锁定版本源码/文档核对，并已通过 Cargo metadata、受影响消费者编译与严格 Clippy。测试新增 dev-only tower util、tokio io-util、axum（middleware），以及锁文件已有的 rcgen 0.14.8、tokio-rustls 0.26.4（bookmarks 受控 TLS）。不变更依赖版本，仅更新 Cargo.lock 的直接依赖边。

兼容顺序：先完成离线测试与来源抽样，再按实际前端 Origin 配置三个服务，发布 CORS/代理改动。现有前端调用形状不变；旧后端与现有前端能运行但仍有旧风险，新后端拒绝白名单外地址是预期行为。图片问题不自动回退到任意 URL 代理；CORS 配置遗漏通过修正配置处理。

## 6. 工作包

用户已要求按计划实施。WP-01/02/03 代码已完成；WP-04 运行说明已更新，真实网络与视觉验收保留为未完成边界。

### WP-01：定义图片目标与 HTTP 边界

- 所有者：bookmarks；文件 F-05/F-06/F-08/F-09/F-16。
- 合同：D-01/02/03/06、L-01、C-01、错误表。
- 顺序：实现标准解析与精确白名单；实现地址规则和签名识别；实现独立空错误响应；加入表驱动边界用例。
- 失败：非法输入在 DNS 和网络前拒绝，无持久化副作用。
- 验证：T-01/T-02/T-04。
- 完成：所有允许样本和拒绝规则有离线证据，未匹配 URL 不产生请求。

### WP-02：连接、资源预算与路由接入

- 所有者：bookmarks（gateway 日志由 gateway 拥有）；依赖 WP-01；文件 F-04/F-05/F-07/F-09/F-10/F-16/F-17/F-20/F-21。
- 合同：D-04/05、L-02/03、C-01。
- 顺序：接入专用 resolver/client；有限收集响应；令牌桶和许可；以 Extension 组合图片状态；调整该路径日志挂载。
- 失败：超时/取消/超限丢弃上游 response，释放许可，无后台重试；不持有数据库连接。
- 验证：T-03/T-04/T-05/T-07。
- 完成：实际请求使用经校验地址，代理/重定向无法旁路，错误不产生部分图片或内部内容。

### WP-03：精确 CORS 与全部消费者

- 所有者：middleware；文件 F-11/F-12/F-13/F-10/F-14/F-15/F-17；可独立于图片下载实施。
- 合同：D-07、C-02。
- 顺序：用 url 替换 nom；改 Result 接口和导出；同步三个 main；验证配置失败与实际预检响应。
- 失败：无效配置导致监听前退出，不回退宽泛来源；部署前检查配置。
- 验证：T-06/T-08。
- 完成：三个消费者一起可构建，相似域名、协议/端口错配及未配置开发来源不会得到 ACAO。

### WP-04：兼容抽样与文档交付

- 所有者：bookmarks/middleware；依赖 WP-02/03；文件 F-18/F-19/F-01/F-03。
- 顺序：完成两站真实图片手工抽样和前端场景核对；记录配置、限制、扩展白名单流程与验证结果。
- 失败：线上图片来源变化记录具体来源与未覆盖范围，不临时放宽规则；真实网络验证失败不解释为测试通过。
- 验证：T-07/T-08；适用 CI/hooks 按仓库要求。
- 完成：运行说明准确，旧直接代理实现不再存在，实际影响和未验证部署范围可追溯。

## 7. 实际验证

默认测试使用合成 URL、字节、内存证书和受控本地服务器，不访问业务数据库或两站公网。F-09 的测试专用 resolver 仅用于本地受控连接，生产无跳过 IP/TLS 校验的配置。

| ID   | 对应行为                                                                                                      | 结果                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| T-01 | 已支持 URL 模式、规范化、恶意主机/路径/参数、解析失败无网络请求                                               | 通过                                                              |
| T-02 | 保守 IPv4/IPv6 地址集合、边界样本、空/混合 DNS 结果                                                           | 通过                                                              |
| T-03 | 共享 client builder 的 resolver 接线、禁止明文、重定向拒绝；内存证书的真实 HTTPS 请求验证域名、路径和实际连接 | 通过受控测试；生产公网连接另见下表                                |
| T-04 | 有/无 Content-Length、分块、超限、短 body、错误 MIME、非图片、上游错误和头隔离                                | 通过；不承诺完整图片解码                                          |
| T-05 | 并发许可、令牌补充与耗尽、任务取消释放                                                                        | 通过                                                              |
| T-06 | 精确 Origin、默认/覆盖/空/非法配置、预检、重复 Origin、无 Origin                                              | 通过；三个服务使用同一 Result 初始化接口                          |
| T-07 | 真实来源与前端浏览器显示                                                                                      | 八个真实图片样本与浏览器列表/详情已通过；历史阻塞和补修记录见下文 |
| T-08 | 受影响包编译、单元/受控测试、严格 Clippy                                                                      | 通过，命令如下                                                    |
| T-09 | 修改文档格式、相对链接、Rust 格式与差异检查                                                                   | 通过：范围内格式、相对链接、Rust 格式和差异检查                   |

| 实际命令                                                                                                   | 结果与边界                                                                                  |
| ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `cargo metadata --no-deps --format-version 1 --offline`                                                    | 通过；后续 Cargo test/clippy 也验证最终 manifest/lockfile                                   |
| `cargo check -p bookmarks -p login -p collections -p gateway --offline`                                    | 通过，覆盖生产消费者                                                                        |
| `cargo test -p bookmarks -p middleware -p gateway --all-features --offline`                                | 初始受控测试通过；bookmarks 增补 TLS/分块场景后单独重跑                                     |
| `cargo test -p bookmarks --offline`                                                                        | 最终 12 通过、1 个 live smoke 默认忽略；middleware 2 通过、gateway 4 通过的结果仍有效       |
| `cargo clippy -p bookmarks -p middleware -p gateway --all-features --all-targets --offline -- -D warnings` | 通过；bookmarks 后续新增测试后用下一条重跑                                                  |
| `cargo clippy -p bookmarks --all-targets --offline -- -D warnings`                                         | 最终通过                                                                                    |
| `cargo test -p bookmarks --offline live_image_sources -- --ignored --nocapture`                            | 已执行，6 个来源均失败于目标连接前后的受控拒绝；下述 DNS 核对确认无法在本机完成正常公网验收 |

沙箱首次禁止本地 listener（Operation not permitted），因此受控网络测试在宿主环境执行。真实来源测试后只读核对六个域名，均返回 `198.18.0.47` 至 `198.18.0.52` 以及 `fdfe:dcba:9876::2e` 至 `::33`。它们属于明确拒绝的 benchmarking/ULA 地址；没有修改生产策略或本机代理设置来绕过。

实际 HTTPS handler 测试使用 rcgen 内存证书、tokio-rustls 本地 listener、仅该测试 client 信任的证书与专用 resolver；验证不向上游转发 Authorization/Cookie、JPEG header 配 PNG 字节会以 PNG 返回、上游 Set-Cookie 不透传。测试使用有限伪图片字节，不保存原站资产。

本轮按实际影响验证，不运行无前端代码变更的 pnpm lint/test，不提前重复全量 CI。若后续提交 PR，现有 CI/hooks 仍须完成且不绕过。

## 8. 剩余验收与交付边界

代码实施和受控验证已完成，以下需要实际运行环境：

1. 已配置精确域名及 CDN 别名真实 DNS/直连，live smoke 的八个样本和运行容器抽样均通过；后续 CDN 别名变化仍需维护本机规则。
2. 小说列表和作者详情的真实图片已在内建浏览器验证，分别为 10/10、18/18 加载成功；晋江抓取预览已返回小说信息与章节列表。
3. 本地部署后三个服务的合法来源/相似恶意来源 CORS 预检已通过；自定义来源三态由前次 Compose 配置检查覆盖，未在本轮修改环境文件或轮换运行配置。

## 9. 完成记录

| 内容               | 当前结果                                                                                    |
| ------------------ | ------------------------------------------------------------------------------------------- |
| 代码               | WP-01/02/03 已实施；WP-04 文档已更新                                                        |
| 实际变更           | F-01 至 F-21 中标注文件已新增或修改；新增 4 个图片模块文件，无数据库/GraphQL 生成物变更     |
| 依赖               | 声明显式 URL/TLS/Tokio 能力及受控测试依赖；移除 middleware nom；无版本升级                  |
| 兼容               | 现有前端 API 形状不变；来源白名单与 CORS 收紧按计划生效                                     |
| 诊断调整           | 失败不收集额外共享字节计数；gateway 图片路径 query 与原始错误脱敏，其他路径保留现状         |
| 测试               | 原受控测试及提交 hooks 通过；补修 13 个测试、Clippy、八个 live 图片样本及桌面浏览器验收通过 |
| 提交/PR/部署       | PR #111 已合并并在本地部署；CA/i0 补修已在本地部署但尚未提交，GitHub #97 保持开放           |
| 文档与当前稳定说明 | 根索引、#94 进度、server/web/gateway README 已同步                                          |
| 工作区其他修改     | 保留原有 package.json pnpm 版本修改，不纳入本 Issue                                         |

### PR 提交阶段补充

完整提交 hook 的首次 workspace 测试发现：依赖 feature 合并后 Rustls 同时启用 ring 与 aws-lc-rs，受控 TLS 测试的 ServerConfig 自动选择 provider 会 panic。测试现已使用 `ServerConfig::builder_with_provider` 明确选择 aws-lc-rs；不修改进程全局 provider、不改变生产 client 的 TLS 策略。修正后重新执行完整提交 hooks，结果记录于 PR。

### 本地容器验收补修：运行时 CA（已实现并验证）

2026-09-07 在 OrbStack 重建并启动合并后的镜像时，bookmarks 因 `No CA certificates were loaded from the system` 重启。`ImageProxyState` 在启动时建立 HTTPS client，运行镜像原来只安装 `libpq5`，没有系统信任根。

- 修改所有者：`docker/server/bookmarks.Dockerfile` 的 prod 阶段在原 apt 安装命令追加 Debian trixie 的 `ca-certificates`；系统证书包及其依赖由 apt 解析，沿用现有发行版来源。仅补齐运行依赖，不改变 TLS 校验、IP 策略或 Rust 依赖。
- 消费者：bookmarks HTTPS 图片 client；同步 `docker/README.md` 的运行依赖说明。没有 schema、数据库、生成物或前端接口变化。
- 验证：重建 bookmarks，确认系统证书 bundle 非空、容器不再重启；实测 CORS 预检与图片代理，继续浏览器列表/详情验收。保留原有数据库 volume 和本机环境配置。
- 已有证据：本地 Rust/五个服务镜像已构建；login、collections 的合法来源与相似恶意来源预检符合预期，浏览器 collections GraphQL 返回 200；图片验收尚未完成。

补修验证结果：

- bookmarks 镜像构建通过；`xtask compose` 仅重建 bookmarks，其他容器和 PostgreSQL volume 保留。容器稳定运行、重启计数为 0，`/etc/ssl/certs/ca-certificates.crt` 非空。
- 三个服务均在本地 HTTPS 实测 OPTIONS：`https://sushao.top` 获得 ACAO，相似恶意来源 `https://evilsushao.top` 不获得 ACAO。
- 内建浏览器 `https://sushao.top`，桌面 1280×900：集合、小说列表、小说详情、作者详情均可读取已有数据；作者详情 GraphQL 实际返回 200，图片失败后显示首字回退。未创建或修改业务数据。
- 六种已支持来源通过实际 `/fetch-content` 抽样均返回空 502；容器解析六个域名仍为 `198.18.0.47` 至 `.52`，符合 Fake-IP 被拒绝的现有策略。内网目标 `http://127.0.0.1/` 返回空 403。没有放宽 IP/TLS 校验。
- 现有作者数据包含 `i0-static.jjwxc.net` 的 `/tmp/backend/authorspace/...` 和 `/authorimagespace.php?...` 图片，实际返回 403。当前白名单不含该主机；扩展前需要官方来源证据与单独的策略/回归覆盖，不能把这类失败归因于 DNS。
- 浏览器另观察到现有窄窗口侧栏无展开入口，以及 Theme/I18n DialogTrigger 的 Base UI nativeButton 错误；未纳入这次 Dockerfile 修复。
- 本轮未修改前端或 Rust 源码，未重复 workspace 单元测试；验证以实际镜像构建、容器启动、HTTP 与浏览器为主。修改文档格式检查和 `git diff --check` 通过。整体 T-07 仍未通过，计划不标记 Done。

### i0 来源与本机 DNS 补充（已实现并验证）

用户明确要求纳入 `i0-static.jjwxc.net`。本地作者/小说数据含两类图片，直接 HTTPS 抽样均为 200 JPEG，无重定向：`/tmp/backend/authorspace/s1/9/8099/809836/20240725231344_300_420.jpg`（77480 字节）以及 `/authorimagespace.php?path=ODA5ODM2&imageName=20250127020807.jpeg`（207562 字节）。当前官方作者页 `oneauthor.php?authorid=809836` 已改为默认头像，故本次证据明确区分用户授权的历史数据与当前页面，不能声称当前页面仍引用上述图片。

- 扩展 L-01：i0 允许现有 authorspace 静态路径族；另外仅允许精确 `/authorimagespace.php`，`path` 与 `imageName` 必需且各一次，无其他参数。path 为标准、带必要 padding 的规范 Base64，解码结果必须是非空 ASCII 数字作者 ID；imageName 沿用受限图片文件名规则。禁止相似主机、其他端点、目录穿越、未知参数和重复参数。
- 使用锁文件已有的 `base64 0.22.1`，通过 workspace 声明为 bookmarks 直接依赖，用标准解码器验证作者 ID；无版本升级。Cargo 负责更新 lockfile。
- 同步 policy、允许/拒绝回归测试、live 样本、server README 和本计划白名单；重建 bookmarks，运行容器图片抽样及浏览器列表/详情/抓取预览验收。
- Clash Verge 全局扩展脚本已仅对七个精确图片域名追加 DIRECT 和 fake-ip-filter，保留其他规则；容器 DNS 已从 Fake-IP 恢复公网地址。该配置是本机环境状态，不提交到仓库。

最终复测：

- Clash 脚本保留原规则，配置 7 个精确图片域名及实际解析链的 9 个精确 CDN 别名；真实 DNS 与 DIRECT 生效。未增加后端 CNAME 主机白名单，也未放宽 IP/TLS 校验。追加 CDN 别名前的脚本已备份；未改订阅节点和其他域名策略。
- `cargo test -p bookmarks --offline -- --include-ignored` 中 13 个非公网测试通过；最初的 live 失败经 CDN 别名配置修正后，单独重跑 `live_image_sources -- --ignored --nocapture` 通过，八个样本均成功。
- `cargo clippy -p bookmarks --all-targets --offline -- -D warnings` 通过。base64 使用本机 0.22.1 源码验证的标准解码器：要求规范 padding，拒绝非法尾位；Cargo.lock 仅新增 bookmarks 对既有 base64 的依赖引用。
- bookmarks 新镜像构建并启动通过；实际 HTTPS `/fetch-content` 八个样本全部 200，大小和 JPEG/PNG 签名符合预期。
- 内建浏览器桌面 1280×900：作者详情 18/18 图片加载成功且请求均 200，小说列表 10/10 图片加载成功；晋江小说 3854336 的抓取预览返回小说信息和章节列表，未点击保存、未写入业务数据。
- 上述结果取代前次 Fake-IP/i0 的阻塞结论；移动端导航、Base UI 警告仍为已记录的其他前端问题。代码补修尚未提交，未关闭 #97。
