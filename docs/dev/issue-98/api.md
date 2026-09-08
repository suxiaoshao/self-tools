# 浏览器 API 与消费者契约

本文件从属于 [规范计划](README.md)，拥有 W1–W4 的浏览器边界。原始证据见 [调研记录](research.md)，状态和验收归父计划管理。

## C1：GraphQL mutation 的结果

两服务各自的 Rust schema 是业务契约事实源。下列是目标 SDL 增量：替换现有 MutationRoot；未列出的输入、scalar、业务对象字段保持原定义。名称和参数沿用现有 operation，数值 ID 沿用 Int，不顺带迁移 ID 格式。新类型/字段的描述在实现 schema 时同步加入，说明下述语义。

ValidationCode、FieldViolation、ValidationFailure 由 graphql-common 提供；依赖 ResourceKind/ConflictReason 的结构与结果 union 由各服务定义，避免共享包反向依赖领域。`ValidationFailure.issues` 和 `MissingResources.resources` 至少一项；path 从该 mutation 的参数名开始，数组索引使用十进制字符串，不包含原始输入值。min/max 仅用于长度或数值边界。`Conflict` 的 reason 是本服务的封闭枚举，resources 仅包含已知且允许向当前用户公开的资源；没有可公开标识时为空列表。

```graphql
enum ValidationCode {
  REQUIRED
  INVALID_FORMAT
  TOO_LONG
  OUT_OF_RANGE
}
type FieldViolation {
  path: [String!]!
  code: ValidationCode!
  min: Int
  max: Int
}
type ValidationFailure {
  issues: [FieldViolation!]!
}
type ResourceRef {
  kind: ResourceKind!
  id: Int!
}
type MissingResources {
  resources: [ResourceRef!]!
}
type Conflict {
  reason: ConflictReason!
  resources: [ResourceRef!]!
}
type ResourceDeleted {
  resource: ResourceRef!
}
type CollectionSaved {
  collectionId: Int!
}
type CollectionMembershipChanged {
  collectionId: Int!
  resource: ResourceRef!
  present: Boolean!
}
union DeleteResult = ResourceDeleted | ValidationFailure
union RemoveMembershipResult = CollectionMembershipChanged | ValidationFailure
```

成功 payload 只携带已提交结果的标识，不运行会失败的二次数据库/关联 resolver。`ResourceDeleted` 表示目标已不存在，不声称该请求实际删除了多少行；关系删除的 `present` 为 false，关系添加成功为 true。输入 ID 不合法返回 ValidationFailure；鉴权成功后删除目标/关系已不存在仍成功，不伪造被删对象。

### collections

```graphql
enum ResourceKind {
  COLLECTION
  ITEM
}
enum ConflictReason {
  COLLECTION_PATH_EXISTS
  MEMBERSHIP_EXISTS
}
type ItemSaved {
  itemId: Int!
}
union CollectionWriteResult = CollectionSaved | ValidationFailure | MissingResources | Conflict
union ItemWriteResult = ItemSaved | ValidationFailure | MissingResources
union AddMembershipResult = CollectionMembershipChanged | ValidationFailure | MissingResources | Conflict
type MutationRoot {
  createCollection(name: String!, parentId: Int, description: String): CollectionWriteResult!
  deleteCollection(id: Int!): DeleteResult!
  updateCollection(id: Int!, name: String!, description: String): CollectionWriteResult!
  createItem(name: String!, content: String!, collectionIds: [Int!]!): ItemWriteResult!
  deleteItem(id: Int!): DeleteResult!
  updateItem(id: Int!, name: String!, content: String!): ItemWriteResult!
  addCollectionForItem(collectionId: Int!, itemId: Int!): AddMembershipResult!
  deleteCollectionForItem(collectionId: Int!, itemId: Int!): RemoveMembershipResult!
}
```

### bookmarks

```graphql
enum ResourceKind {
  COLLECTION
  AUTHOR
  TAG
  NOVEL
  CHAPTER
  COMMENT
}
enum ConflictReason {
  COLLECTION_PATH_EXISTS
  SOURCE_ID_EXISTS
  MEMBERSHIP_EXISTS
  COMMENT_EXISTS
}
type AuthorSaved {
  authorId: Int!
}
type TagSaved {
  tagId: Int!
}
type NovelSaved {
  novelId: Int!
}
type CommentSaved {
  novelId: Int!
}
type ChaptersAlreadyRead {
  chapterIds: [Int!]!
}
type ReadRecordsUpdated {
  chapterIds: [Int!]!
  changedCount: Int!
}
union CollectionWriteResult = CollectionSaved | ValidationFailure | MissingResources | Conflict
union AuthorWriteResult = AuthorSaved | ValidationFailure | MissingResources | Conflict
union TagWriteResult = TagSaved | ValidationFailure | Conflict
union NovelWriteResult = NovelSaved | ValidationFailure | MissingResources | Conflict
union AddMembershipResult = CollectionMembershipChanged | ValidationFailure | MissingResources | Conflict
union CommentWriteResult = CommentSaved | ValidationFailure | MissingResources | Conflict
union AddReadRecordsResult = ReadRecordsUpdated | ValidationFailure | MissingResources | ChaptersAlreadyRead
union DeleteReadRecordsResult = ReadRecordsUpdated | ValidationFailure
type MutationRoot {
  createCollection(name: String!, parentId: Int, description: String): CollectionWriteResult!
  deleteCollection(id: Int!): DeleteResult!
  updateCollection(id: Int!, name: String!, parentId: Int, description: String): CollectionWriteResult!
  createAuthor(
    name: String!
    avatar: String!
    description: String!
    site: NovelSite!
    siteId: String!
  ): AuthorWriteResult!
  deleteAuthor(id: Int!): DeleteResult!
  createTag(name: String!, site: NovelSite!, siteId: String!): TagWriteResult!
  deleteTag(id: Int!): DeleteResult!
  createNovel(data: CreateNovelInput!): NovelWriteResult!
  deleteNovel(id: Int!): DeleteResult!
  saveDraftAuthor(author: SaveDraftAuthor!): AuthorWriteResult!
  saveDraftNovel(novel: SaveDraftNovel!): NovelWriteResult!
  updateNovelByCrawler(novelId: Int!): NovelWriteResult!
  updateAuthorByCrawler(authorId: Int!): AuthorWriteResult!
  addCollectionForNovel(collectionId: Int!, novelId: Int!): AddMembershipResult!
  deleteCollectionForNovel(collectionId: Int!, novelId: Int!): RemoveMembershipResult!
  addCommentForNovel(novelId: Int!, content: String!): CommentWriteResult!
  deleteCommentForNovel(novelId: Int!): DeleteResult!
  updateCommentForNovel(novelId: Int!, content: String!): CommentWriteResult!
  addReadRecordsForChapter(novelId: Int!, chapterIds: [Int!]!): AddReadRecordsResult!
  deleteReadRecordsForChapter(chapterIds: [Int!]!): DeleteReadRecordsResult!
}
```

COMMENT 的 id 是 novelId，与现有每小说至多一个评论的模型一致。阅读记录的 chapterIds 去重；空输入正常成功，changedCount 为 0。添加时仍整体拒绝不存在/不属于目标小说的章节或已读章节，不隐式改成忽略冲突；删除不存在的阅读记录正常成功，changedCount 为实际删除数。批量操作不返回部分成功。

### 用例映射与恢复

| 操作组                       | 业务分支与必要约束                                                                                              | 结果未知时的动作                                                             |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| 两站目录创建/更新            | 字段校验；父目录或更新目标缺失；路径冲突；bookmarks 移动目录时禁止自身/后代作为父目录，按 parentId 校验失败返回 | 已知 ID 更新可查询当前字段；新建不自动重放，保留输入、提供查看列表入口       |
| Item 创建/更新               | 引用目录或更新目标缺失；collectionIds 去重；输入与关联写入原子提交                                              | 创建缺少可靠结果标识时保持未确认；更新按 ID 核对目标值，禁止自动覆盖后续修改 |
| 作者/标签/小说创建与草稿保存 | 来源标识冲突；作者/标签缺失；草稿章节-小说引用不一致按输入 path 校验失败；不改数据库唯一性规则                  | 刷新列表供人工核对；匹配名称/来源不自动宣告本次请求成功，不自动重新保存      |
| crawler 更新                 | 更新目标缺失；抓取完整后才提交；抓取系统故障走 errors，不能伪装为空抓取结果并删除既有内容                       | 刷新当前资源展示当前状态；无可靠完成标记时保持未确认，重新抓取由用户显式触发 |
| 添加集合关系                 | 两端缺失、关系已存在分别是 MissingResources / MEMBERSHIP_EXISTS                                                 | 按资源 ID 查询当前关系；已存在可提示目标已达成，但不把冲突分支改成请求成功   |
| 删除资源/关系/评论           | 保留现有级联语义并确保事务；目标或关系已不存在成功；删除资源不再承诺返回旧对象                                  | 只有可确认的不存在才判目标已达成；列表/详情请求故障不能当作不存在            |
| 评论创建/更新                | 小说/更新目标缺失；创建重复为 COMMENT_EXISTS                                                                    | 查询当前内容判断目标状态；未确认不重放                                       |
| 阅读记录                     | 上述全量拒绝与去重规则；冲突明确包含章节 ID                                                                     | 刷新章节已读状态并呈现当前目标状态，不自动重放原批次                         |

手动 `createTag` 会去除名称首尾空白后校验并保存：不能为空，允许“甜”“虐”等单字符标签，最多 20 个 Unicode 字符（与数据库容量一致）。空名称返回 `ValidationFailure` 的 `name/REQUIRED`；超长返回 `name/TOO_LONG`、`max: 20`。前端在提交前执行同一内容与长度规则。

所有 mutation 先执行现有认证边界。业务输入校验移到用例/adapter 的有类型路径，移除会提前抛出 GraphQL 自定义错误的业务 validator；GraphQL 语法、类型强制转换和框架限额仍使用 C3 执行/请求错误。目录名称长度 1–255、禁止字符等现有规则复用，补到同规则的更新入口；不新增无业务依据的文案或字段限制。

### 手写 operation 与 UI 投影

下列为 collections 的准确目标 operation，代表三种消费形态；其他操作按其 SDL 选择对应成功标识和全部拒绝分支。所有 mutation 必须选择 `__typename`，不保留只依赖 promise 完成的消费者。

```graphql
mutation CreateItem($name: String!, $content: String!, $collectionIds: [Int!]!) {
  createItem(name: $name, content: $content, collectionIds: $collectionIds) {
    __typename
    ... on ItemSaved {
      itemId
    }
    ... on ValidationFailure {
      issues {
        path
        code
        min
        max
      }
    }
    ... on MissingResources {
      resources {
        kind
        id
      }
    }
  }
}
mutation DeleteItem($id: Int!) {
  deleteItem(id: $id) {
    __typename
    ... on ResourceDeleted {
      resource {
        kind
        id
      }
    }
    ... on ValidationFailure {
      issues {
        path
        code
        min
        max
      }
    }
  }
}
query GetItem($id: Int!) {
  getItem(id: $id) {
    id
    name
    content
    createTime
    updateTime
    collections {
      id
      name
      path
      description
    }
  }
}
```

成功后导航/刷新只依赖返回的标识；刷新作为独立读取状态处理。typed result 不再转换成公共层的 Error 或 toast。表单使用生成类型的 `__typename` 穷尽匹配，将 FieldViolation.path 映射到现有字段；无对应字段的拒绝显示在操作区域。数据缺失、未知 typename 或缺少成功标识属于协议失败，保留输入且不导航。

消费者覆盖 `web/packages/{bookmarks,collections}/src` 中全部变更 operation，包括通用 Actions、Create/Edit 表单、列表行操作、详情工具栏、抓取草稿与阅读记录批量入口。更新 schema 快照和原 operation 后通过各包现有 generate 刷新 `src/gql/`，禁止为 mutation 结果维护另一套手写 TS wire union。

## C2：查询、空列表与部分数据

以下是字段的准确替换签名，未列字段保持原声明：

| schema                        | 目标字段                                                                                                                                 |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| collections QueryRoot         | `getCollection(id: Int!): Collection`；`getItem(id: Int!): Item`                                                                         |
| collections Item / Collection | `collections: [Collection!]`；`ancestors: [Collection!]`                                                                                 |
| bookmarks QueryRoot           | `getCollection(id: Int!): Collection`；`getAuthor(id: Int!): Author`；`getNovel(id: Int!): Novel`                                        |
| bookmarks Author              | `novels: [Novel!]`                                                                                                                       |
| bookmarks Collection          | `ancestors: [Collection!]`；`children: [Collection!]`                                                                                    |
| bookmarks Chapter             | `novel: Novel`；`author: Author`                                                                                                         |
| bookmarks Novel               | `author: Author`；`tags: [Tag!]`；`chapters: [Chapter!]`；`collections: [Collection!]`；`wordCount: BigDecimal`；`readPercentage: Float` |

详情无相关错误的 null 表示不存在；关联列表 [] 表示正常无关联，null 加相关 errors 表示该区域失败。已有 nullable `firstChapter`、`lastChapter`、`comments` 沿用正常 null 语义，但消费者仍检查关联路径上的错误。允许局部失败的字段不再非空向上抹掉整个详情。页面的主标识、名称、内容等直接数据失败时展示主区域失败；编辑所必需的关联尚未成功读取时禁用提交并提供重试，禁止 null→[] 后覆盖关系。

顶层列表仍是非空列表/分页 payload。合法分页超过最后一页返回 `data: []` 与实际 total，删除末页最后一项后 UI 可以回退一页；page/pageSize 本身非法或算术溢出是 INVALID_REQUEST。筛选参数引用不存在目录/标签时返回 NOT_FOUND/INVALID_REQUEST 的结构化详情，不能把非法查询条件混作正常空列表。现有分页范围规则以 `graphql-common::Pagination` 为依据，修正偏移超过总数被报错的路径。

Apollo watchQuery/query 使用 `errorPolicy: 'all'` 并显式消费 data/error，mutation 使用 `'none'` 处理执行故障、正常 resolve 后检查业务 union；删除旧 DeclareDefaultOptions 的 ignore 契约。保持现有 no-cache 策略。本轮不新增自动 RetryLink；页面提供读取重试，读取重试不得继续使用过期 generation。页面按 `errors.path` 定位局部故障；无 path 或关键路径故障进入主错误区。所有关键分支都有安全本地文案。

## C3：HTTP 与 GraphQL 的非业务错误

服务端只公开以下 code、requestId 和对应可选详情；任意第三方 message/source/Debug 均不属于合同。GraphQL message 固定为 code 的安全英文描述，前端仅用 code 本地化。HTTP JSON 使用 `{"error": <PublicError>}`，GraphQL 使用 `errors[].extensions = <PublicError>`。GraphQL 的 path/locations 留在规范位置；以下 code 不与 C1 typed result 重复返回。

```ts
type FieldViolation = {
  path: string[];
  code: 'REQUIRED' | 'INVALID_FORMAT' | 'TOO_LONG' | 'OUT_OF_RANGE';
  min?: number;
  max?: number;
};
type PublicResource = {
  kind: 'COLLECTION' | 'ITEM' | 'AUTHOR' | 'TAG' | 'NOVEL' | 'CHAPTER' | 'COMMENT' | 'PASSKEY';
  id: string; // HTTP/extensions 使用十进制 ID 或 UUID 字符串
};
type PublicError = { requestId: string } & (
  | { code: 'INVALID_REQUEST'; fieldErrors?: FieldViolation[] }
  | { code: 'NOT_FOUND'; resources?: PublicResource[] }
  | { code: 'RATE_LIMITED'; retryAfterSeconds: number }
  | {
      code:
        | 'UNAUTHENTICATED'
        | 'REQUEST_REJECTED'
        | 'REAUTH_REQUIRED'
        | 'AUTHENTICATION_FAILED'
        | 'CEREMONY_INVALID'
        | 'NO_PASSKEY'
        | 'PASSKEY_EXISTS'
        | 'INTERNAL'
        | 'UNAVAILABLE'
        | 'UPSTREAM_TIMEOUT'
        | 'UPSTREAM_FAILURE';
    }
);
```

这是非 SDL 边界的规范结构，服务端手写序列化投影与 request-errors 的 Valibot 解码共同覆盖；已安装 Valibot 可复用。未知 code、非法 requestId、错误详情形状或不合法数字降为本地 ProtocolFailure，不能直接 cast 后消费。解码丢弃未列字段；不把未知 message/source 放入 console。requestId 为服务器生成的 32 位小写十六进制标识，HTTP 同时回 `X-Request-ID`；缺少/无效标识的网关或网络错误仍能给本地提示，但不能接受它为可信关联字段。

| 场景                          | HTTP 状态                                   | GraphQL/前端行为                                                        |
| ----------------------------- | ------------------------------------------- | ----------------------------------------------------------------------- |
| JSON/输入格式错误             | 400 INVALID_REQUEST                         | GraphQL 语法/校验错误安全化为同码；mutation 的领域校验走 C1             |
| 无有效 session                | 401 UNAUTHENTICATED                         | schema 执行前拒绝；只有解码到此码才触发 generation 保护的失效处理       |
| Origin/CSRF/请求边界拒绝      | 403 REQUEST_REJECTED                        | 不清空会话，不自动重试                                                  |
| 重新认证要求                  | 403 REAUTH_REQUIRED                         | 保留会话和操作输入，请求重新认证                                        |
| 登录凭证错误                  | 401 AUTHENTICATION_FAILED                   | 操作局部提示，不当作 session 失效                                       |
| ceremony 不可用               | 400 CEREMONY_INVALID                        | 重新开始 ceremony，不重放 finish                                        |
| 无凭据/凭据重复               | 409 NO_PASSKEY / PASSKEY_EXISTS             | 操作局部反馈                                                            |
| HTTP 资源或查询条件引用不存在 | 404 NOT_FOUND                               | 允许的 ID 供当前页面修正；详情正常不存在按 C2，不产生此错误             |
| 限流                          | 429 RATE_LIMITED                            | Retry-After 与 retryAfterSeconds 同值非负整数；倒计时后也不自动重放写入 |
| 本地内部错误                  | 500 INTERNAL                                | 安全兜底并附关联 ID                                                     |
| 依赖不可用/池耗尽             | 503 UNAVAILABLE                             | 保留当前会话与输入，读取允许手动重试                                    |
| 上游超时/协议失败             | 504 UPSTREAM_TIMEOUT / 502 UPSTREAM_FAILURE | 读取可重试，写入结果按 C4 判断                                          |

上述 HTTP 状态适用于直接 HTTP 和进入 schema 前的错误；schema 执行中的故障按 GraphQL 规范返回 errors，可伴随 HTTP 200 与部分 data。异步框架、自定义 scalar、validator、handler extractor 的错误统一经过安全投影，包含语法/变量强制转换失败，不能留下 raw Display 的旁路。

Auth 原请求、SessionView、PasskeyView、options 的成功数据沿用 [现有 router](../../../server/packages/login/src/router.rs) 合同，客户端分别验证这些形状；`GET /api/auth/session` 的 `data: null` 是正常未登录。唯一成功响应改动是 `DELETE /api/auth/passkeys/{id}`：改为 200 JSON `{"data":{"id":"<uuid>","sessionInvalidated":true|false}}`，明确消费 [RPC 删除结果](rpc.md)。失效时服务端清 cookie，前端按 generation 清状态；logout 继续 204 空体。Cookie 安全属性、Origin、no-store、请求体限额与 WebAuthn 校验保持现有合同。

图片代理仍为空错误 body、既有状态/Retry-After 与资源限制；只接入安全诊断和关联 ID，不套 JSON。内部 readiness 仍 204/503 或 RPC bool，公开内容不增加原因链。gateway 的非 JSON/传输错误由客户端识别为协议或网络故障，不推断登录失效。

## C4：前端标准化与恢复状态

request-errors 的公共导出如下；GraphQL typed 业务结果不进入该模型：

```ts
export type RequestFailure =
  | { kind: 'public'; error: PublicError }
  | { kind: 'network' | 'timeout' | 'protocol'; requestId?: string }
  | { kind: 'cancelled' };
export type WriteState =
  { kind: 'idle' | 'pending' | 'succeeded' | 'rejected' } | { kind: 'unconfirmed'; failure: RequestFailure };
export function decodePublicError(value: unknown): PublicError | undefined;
export function normalizeRequestFailure(error: unknown): RequestFailure;
```

kind 只分类原因，WriteState 表达确定性，公共层不根据 network 一词宣告业务失败。请求已发出后，transport/timeout/protocol 和不能证明回滚的系统故障令写入进入 unconfirmed；确认的业务拒绝进入 rejected；仅成功分支进入 succeeded。框架在发送前发现非法输入可直接判 rejected。取消等待抑制提示和旧回调，但下次打开页面仍按服务器状态刷新。

Auth 服务层具体解码 HTTP 状态、JSON 和对应成功数据；custom-graphql 解析 C3 并保留 errors.path，删除全局 toast/console source。`registerAuthBoundary` 的 generation/unauthenticated 签名及状态清理注册点保持现有契约，只替换“任意 HTTP 401 立即失效”为“可信 UNAUTHENTICATED”。request-errors 不直接修改 store；页面和 portal 边界拥有状态。

登录响应丢失后保留 session 核对；重新认证核对 recentAuthenticationUntil；删除凭据先处理当前 session 是否仍有效，再核对列表。注册凭据不能按同名列表项认定成功，未确认时提供列表与重新开始入口。其余写入按 C1 表处理。本轮不建立后台重放、持久化待确认队列或幂等键，页面离开后不承诺记住某次未确认提交。

未实现代码前，本文件仅是目标契约；schema、operation 及 TS 片段的静态检查不等于生产链路验收。
