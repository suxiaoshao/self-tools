/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
  '\n  query searchAuthor($searchName: String) {\n    # todo 取消分页或者选择器支持分页\n    allAuthors(searchName: $searchName) {\n      id\n      name\n      description\n      avatar\n    }\n  }\n': typeof types.SearchAuthorDocument;
  '\n  query allTags {\n    allTags {\n      id\n      name\n    }\n  }\n': typeof types.AllTagsDocument;
  '\n  query getAuthor($id: Int!) {\n    getAuthor(id: $id) {\n      novels {\n        id\n        name\n        avatar\n        createTime\n        updateTime\n        description\n        novelStatus\n        url\n        lastChapter {\n          time\n        }\n        firstChapter {\n          time\n        }\n        wordCount\n      }\n      id\n      site\n      name\n      createTime\n      updateTime\n      avatar\n      description\n      url\n    }\n  }\n': typeof types.GetAuthorDocument;
  '\n  mutation updateAuthorByCrawler($authorId: Int!) {\n    updateAuthorByCrawler(authorId: $authorId) {\n      id\n    }\n  }\n': typeof types.UpdateAuthorByCrawlerDocument;
  '\n  query fetchAuthor($id: String!, $novelSite: NovelSite!) {\n    fetchAuthor(id: $id, novelSite: $novelSite) {\n      __typename\n      name\n      description\n      image\n      url\n      id\n      site\n      novels {\n        id\n        name\n        description\n        image\n        url\n        status\n        site\n        chapters {\n          id\n          novelId\n          title\n          url\n          time\n          wordCount\n          site\n        }\n        tags {\n          id\n          name\n          url\n        }\n      }\n    }\n  }\n': typeof types.FetchAuthorDocument;
  '\n  mutation saveDraftAuthor($author: SaveDraftAuthor!) {\n    saveDraftAuthor(author: $author) {\n      id\n    }\n  }\n': typeof types.SaveDraftAuthorDocument;
  '\n  mutation createAuthor($avatar: String!, $description: String!, $name: String!, $site: NovelSite!, $siteId: String!) {\n    createAuthor(avatar: $avatar, description: $description, name: $name, site: $site, siteId: $siteId) {\n      id\n    }\n  }\n': typeof types.CreateAuthorDocument;
  '\n  query getAuthors($pagination: Pagination!) {\n    queryAuthors(pagination: $pagination) {\n      data {\n        id\n        site\n        name\n        createTime\n        updateTime\n        avatar\n        description\n        url\n      }\n      total\n    }\n  }\n': typeof types.GetAuthorsDocument;
  '\n  mutation deleteAuthor($id: Int!) {\n    deleteAuthor(id: $id) {\n      id\n    }\n  }\n': typeof types.DeleteAuthorDocument;
  '\n  query allCollections {\n    allCollections {\n      name\n      id\n      path\n      createTime\n      updateTime\n      description\n      parentId\n    }\n  }\n': typeof types.AllCollectionsDocument;
  '\n  query getCollectionAncestors($id: Int!) {\n    getCollection(id: $id) {\n      ancestors {\n        id\n        name\n      }\n      id\n      name\n    }\n  }\n': typeof types.GetCollectionAncestorsDocument;
  '\n  mutation deleteCollection($id: Int!) {\n    deleteCollection(id: $id)\n  }\n': typeof types.DeleteCollectionDocument;
  '\n  mutation updateCollection($id: Int!, $name: String!, $parentId: Int, $description: String) {\n    updateCollection(id: $id, name: $name, parentId: $parentId, description: $description) {\n      __typename\n    }\n  }\n': typeof types.UpdateCollectionDocument;
  '\n  mutation createCollection($parentId: Int, $name: String!, $description: String) {\n    createCollection(parentId: $parentId, name: $name, description: $description) {\n      path\n    }\n  }\n': typeof types.CreateCollectionDocument;
  '\n  query getCollections($parentId: Int, $pagination: Pagination!) {\n    getCollections(parentId: $parentId, pagination: $pagination) {\n      data {\n        name\n        id\n        path\n        createTime\n        updateTime\n        description\n      }\n      total\n    }\n  }\n': typeof types.GetCollectionsDocument;
  '\n  mutation addCollectionForNovel($novelId: Int!, $collectionId: Int!) {\n    addCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {\n      id\n    }\n  }\n': typeof types.AddCollectionForNovelDocument;
  '\n  mutation addReadRecord($novelId: Int!, $chapterIds: [Int!]!) {\n    addReadRecordsForChapter(novelId: $novelId, chapterIds: $chapterIds)\n  }\n': typeof types.AddReadRecordDocument;
  '\n  mutation deleteReadRecord($chapterIds: [Int!]!) {\n    deleteReadRecordsForChapter(chapterIds: $chapterIds)\n  }\n': typeof types.DeleteReadRecordDocument;
  '\n  mutation CreateComment($novelId: Int!, $content: String!) {\n    addCommentForNovel(novelId: $novelId, content: $content) {\n      __typename\n    }\n  }\n': typeof types.CreateCommentDocument;
  '\n  mutation UpdateComment($novelId: Int!, $content: String!) {\n    updateCommentForNovel(novelId: $novelId, content: $content) {\n      __typename\n    }\n  }\n': typeof types.UpdateCommentDocument;
  '\n  query getNovel($id: Int!) {\n    getNovel(id: $id) {\n      id\n      name\n      avatar\n      description\n      createTime\n      updateTime\n      description\n      novelStatus\n      url\n      chapters {\n        id\n        title\n        createTime\n        updateTime\n        url\n        wordCount\n        time\n        isRead\n      }\n      author {\n        avatar\n        description\n        id\n        name\n        site\n      }\n      lastChapter {\n        time\n      }\n      firstChapter {\n        time\n      }\n      wordCount\n      tags {\n        url\n        name\n        id\n      }\n      site\n      collections {\n        name\n        id\n        description\n        path\n      }\n      comments {\n        content\n      }\n    }\n  }\n': typeof types.GetNovelDocument;
  '\n  mutation updateNovelByCrawler($novelId: Int!) {\n    updateNovelByCrawler(novelId: $novelId) {\n      id\n    }\n  }\n': typeof types.UpdateNovelByCrawlerDocument;
  '\n  mutation deleteCommentForNovel($novelId: Int!) {\n    deleteCommentForNovel(novelId: $novelId) {\n      __typename\n    }\n  }\n': typeof types.DeleteCommentForNovelDocument;
  '\n  mutation deleteCollectionForNovel($novelId: Int!, $collectionId: Int!) {\n    deleteCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {\n      id\n    }\n  }\n': typeof types.DeleteCollectionForNovelDocument;
  '\n  query fetchNovel($id: String!, $novelSite: NovelSite!) {\n    fetchNovel(id: $id, novelSite: $novelSite) {\n      author {\n        description\n        image\n        name\n        url\n        id\n      }\n      chapters {\n        title\n        url\n        site\n        time\n        wordCount\n        id\n      }\n      tags {\n        id\n        name\n        url\n      }\n      description\n      image\n      name\n      url\n      site\n      status\n      id\n    }\n  }\n': typeof types.FetchNovelDocument;
  '\n  mutation saveDraftNovel($novel: SaveDraftNovel!) {\n    saveDraftNovel(novel: $novel) {\n      id\n    }\n  }\n': typeof types.SaveDraftNovelDocument;
  '\n  mutation createNovel($data: CreateNovelInput!) {\n    createNovel(data: $data) {\n      id\n    }\n  }\n': typeof types.CreateNovelDocument;
  '\n  query getNovels(\n    $collectionMatch: TagMatch\n    $novelStatus: NovelStatus\n    $tagMatch: TagMatch\n    $pagination: Pagination!\n  ) {\n    queryNovels(\n      collectionMatch: $collectionMatch\n      novelStatus: $novelStatus\n      tagMatch: $tagMatch\n      pagination: $pagination\n    ) {\n      data {\n        id\n        name\n        description\n        createTime\n        updateTime\n        description\n        novelStatus\n        avatar\n        site\n      }\n      total\n    }\n  }\n': typeof types.GetNovelsDocument;
  '\n  mutation deleteNovel($id: Int!) {\n    deleteNovel(id: $id) {\n      id\n    }\n  }\n': typeof types.DeleteNovelDocument;
  '\n  mutation createTag($name: String!, $site: NovelSite!, $siteId: String!) {\n    createTag(name: $name, site: $site, siteId: $siteId) {\n      name\n      id\n    }\n  }\n': typeof types.CreateTagDocument;
  '\n  query getTags($pagination: Pagination!) {\n    queryTags(pagination: $pagination) {\n      data {\n        name\n        id\n        site\n        url\n        createTime\n        updateTime\n      }\n      total\n    }\n  }\n': typeof types.GetTagsDocument;
  '\n  mutation deleteTag($id: Int!) {\n    deleteTag(id: $id) {\n      id\n    }\n  }\n': typeof types.DeleteTagDocument;
};
const documents: Documents = {
  '\n  query searchAuthor($searchName: String) {\n    # todo 取消分页或者选择器支持分页\n    allAuthors(searchName: $searchName) {\n      id\n      name\n      description\n      avatar\n    }\n  }\n':
    types.SearchAuthorDocument,
  '\n  query allTags {\n    allTags {\n      id\n      name\n    }\n  }\n': types.AllTagsDocument,
  '\n  query getAuthor($id: Int!) {\n    getAuthor(id: $id) {\n      novels {\n        id\n        name\n        avatar\n        createTime\n        updateTime\n        description\n        novelStatus\n        url\n        lastChapter {\n          time\n        }\n        firstChapter {\n          time\n        }\n        wordCount\n      }\n      id\n      site\n      name\n      createTime\n      updateTime\n      avatar\n      description\n      url\n    }\n  }\n':
    types.GetAuthorDocument,
  '\n  mutation updateAuthorByCrawler($authorId: Int!) {\n    updateAuthorByCrawler(authorId: $authorId) {\n      id\n    }\n  }\n':
    types.UpdateAuthorByCrawlerDocument,
  '\n  query fetchAuthor($id: String!, $novelSite: NovelSite!) {\n    fetchAuthor(id: $id, novelSite: $novelSite) {\n      __typename\n      name\n      description\n      image\n      url\n      id\n      site\n      novels {\n        id\n        name\n        description\n        image\n        url\n        status\n        site\n        chapters {\n          id\n          novelId\n          title\n          url\n          time\n          wordCount\n          site\n        }\n        tags {\n          id\n          name\n          url\n        }\n      }\n    }\n  }\n':
    types.FetchAuthorDocument,
  '\n  mutation saveDraftAuthor($author: SaveDraftAuthor!) {\n    saveDraftAuthor(author: $author) {\n      id\n    }\n  }\n':
    types.SaveDraftAuthorDocument,
  '\n  mutation createAuthor($avatar: String!, $description: String!, $name: String!, $site: NovelSite!, $siteId: String!) {\n    createAuthor(avatar: $avatar, description: $description, name: $name, site: $site, siteId: $siteId) {\n      id\n    }\n  }\n':
    types.CreateAuthorDocument,
  '\n  query getAuthors($pagination: Pagination!) {\n    queryAuthors(pagination: $pagination) {\n      data {\n        id\n        site\n        name\n        createTime\n        updateTime\n        avatar\n        description\n        url\n      }\n      total\n    }\n  }\n':
    types.GetAuthorsDocument,
  '\n  mutation deleteAuthor($id: Int!) {\n    deleteAuthor(id: $id) {\n      id\n    }\n  }\n':
    types.DeleteAuthorDocument,
  '\n  query allCollections {\n    allCollections {\n      name\n      id\n      path\n      createTime\n      updateTime\n      description\n      parentId\n    }\n  }\n':
    types.AllCollectionsDocument,
  '\n  query getCollectionAncestors($id: Int!) {\n    getCollection(id: $id) {\n      ancestors {\n        id\n        name\n      }\n      id\n      name\n    }\n  }\n':
    types.GetCollectionAncestorsDocument,
  '\n  mutation deleteCollection($id: Int!) {\n    deleteCollection(id: $id)\n  }\n': types.DeleteCollectionDocument,
  '\n  mutation updateCollection($id: Int!, $name: String!, $parentId: Int, $description: String) {\n    updateCollection(id: $id, name: $name, parentId: $parentId, description: $description) {\n      __typename\n    }\n  }\n':
    types.UpdateCollectionDocument,
  '\n  mutation createCollection($parentId: Int, $name: String!, $description: String) {\n    createCollection(parentId: $parentId, name: $name, description: $description) {\n      path\n    }\n  }\n':
    types.CreateCollectionDocument,
  '\n  query getCollections($parentId: Int, $pagination: Pagination!) {\n    getCollections(parentId: $parentId, pagination: $pagination) {\n      data {\n        name\n        id\n        path\n        createTime\n        updateTime\n        description\n      }\n      total\n    }\n  }\n':
    types.GetCollectionsDocument,
  '\n  mutation addCollectionForNovel($novelId: Int!, $collectionId: Int!) {\n    addCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {\n      id\n    }\n  }\n':
    types.AddCollectionForNovelDocument,
  '\n  mutation addReadRecord($novelId: Int!, $chapterIds: [Int!]!) {\n    addReadRecordsForChapter(novelId: $novelId, chapterIds: $chapterIds)\n  }\n':
    types.AddReadRecordDocument,
  '\n  mutation deleteReadRecord($chapterIds: [Int!]!) {\n    deleteReadRecordsForChapter(chapterIds: $chapterIds)\n  }\n':
    types.DeleteReadRecordDocument,
  '\n  mutation CreateComment($novelId: Int!, $content: String!) {\n    addCommentForNovel(novelId: $novelId, content: $content) {\n      __typename\n    }\n  }\n':
    types.CreateCommentDocument,
  '\n  mutation UpdateComment($novelId: Int!, $content: String!) {\n    updateCommentForNovel(novelId: $novelId, content: $content) {\n      __typename\n    }\n  }\n':
    types.UpdateCommentDocument,
  '\n  query getNovel($id: Int!) {\n    getNovel(id: $id) {\n      id\n      name\n      avatar\n      description\n      createTime\n      updateTime\n      description\n      novelStatus\n      url\n      chapters {\n        id\n        title\n        createTime\n        updateTime\n        url\n        wordCount\n        time\n        isRead\n      }\n      author {\n        avatar\n        description\n        id\n        name\n        site\n      }\n      lastChapter {\n        time\n      }\n      firstChapter {\n        time\n      }\n      wordCount\n      tags {\n        url\n        name\n        id\n      }\n      site\n      collections {\n        name\n        id\n        description\n        path\n      }\n      comments {\n        content\n      }\n    }\n  }\n':
    types.GetNovelDocument,
  '\n  mutation updateNovelByCrawler($novelId: Int!) {\n    updateNovelByCrawler(novelId: $novelId) {\n      id\n    }\n  }\n':
    types.UpdateNovelByCrawlerDocument,
  '\n  mutation deleteCommentForNovel($novelId: Int!) {\n    deleteCommentForNovel(novelId: $novelId) {\n      __typename\n    }\n  }\n':
    types.DeleteCommentForNovelDocument,
  '\n  mutation deleteCollectionForNovel($novelId: Int!, $collectionId: Int!) {\n    deleteCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {\n      id\n    }\n  }\n':
    types.DeleteCollectionForNovelDocument,
  '\n  query fetchNovel($id: String!, $novelSite: NovelSite!) {\n    fetchNovel(id: $id, novelSite: $novelSite) {\n      author {\n        description\n        image\n        name\n        url\n        id\n      }\n      chapters {\n        title\n        url\n        site\n        time\n        wordCount\n        id\n      }\n      tags {\n        id\n        name\n        url\n      }\n      description\n      image\n      name\n      url\n      site\n      status\n      id\n    }\n  }\n':
    types.FetchNovelDocument,
  '\n  mutation saveDraftNovel($novel: SaveDraftNovel!) {\n    saveDraftNovel(novel: $novel) {\n      id\n    }\n  }\n':
    types.SaveDraftNovelDocument,
  '\n  mutation createNovel($data: CreateNovelInput!) {\n    createNovel(data: $data) {\n      id\n    }\n  }\n':
    types.CreateNovelDocument,
  '\n  query getNovels(\n    $collectionMatch: TagMatch\n    $novelStatus: NovelStatus\n    $tagMatch: TagMatch\n    $pagination: Pagination!\n  ) {\n    queryNovels(\n      collectionMatch: $collectionMatch\n      novelStatus: $novelStatus\n      tagMatch: $tagMatch\n      pagination: $pagination\n    ) {\n      data {\n        id\n        name\n        description\n        createTime\n        updateTime\n        description\n        novelStatus\n        avatar\n        site\n      }\n      total\n    }\n  }\n':
    types.GetNovelsDocument,
  '\n  mutation deleteNovel($id: Int!) {\n    deleteNovel(id: $id) {\n      id\n    }\n  }\n':
    types.DeleteNovelDocument,
  '\n  mutation createTag($name: String!, $site: NovelSite!, $siteId: String!) {\n    createTag(name: $name, site: $site, siteId: $siteId) {\n      name\n      id\n    }\n  }\n':
    types.CreateTagDocument,
  '\n  query getTags($pagination: Pagination!) {\n    queryTags(pagination: $pagination) {\n      data {\n        name\n        id\n        site\n        url\n        createTime\n        updateTime\n      }\n      total\n    }\n  }\n':
    types.GetTagsDocument,
  '\n  mutation deleteTag($id: Int!) {\n    deleteTag(id: $id) {\n      id\n    }\n  }\n': types.DeleteTagDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query searchAuthor($searchName: String) {\n    # todo 取消分页或者选择器支持分页\n    allAuthors(searchName: $searchName) {\n      id\n      name\n      description\n      avatar\n    }\n  }\n',
): (typeof documents)['\n  query searchAuthor($searchName: String) {\n    # todo 取消分页或者选择器支持分页\n    allAuthors(searchName: $searchName) {\n      id\n      name\n      description\n      avatar\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query allTags {\n    allTags {\n      id\n      name\n    }\n  }\n',
): (typeof documents)['\n  query allTags {\n    allTags {\n      id\n      name\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query getAuthor($id: Int!) {\n    getAuthor(id: $id) {\n      novels {\n        id\n        name\n        avatar\n        createTime\n        updateTime\n        description\n        novelStatus\n        url\n        lastChapter {\n          time\n        }\n        firstChapter {\n          time\n        }\n        wordCount\n      }\n      id\n      site\n      name\n      createTime\n      updateTime\n      avatar\n      description\n      url\n    }\n  }\n',
): (typeof documents)['\n  query getAuthor($id: Int!) {\n    getAuthor(id: $id) {\n      novels {\n        id\n        name\n        avatar\n        createTime\n        updateTime\n        description\n        novelStatus\n        url\n        lastChapter {\n          time\n        }\n        firstChapter {\n          time\n        }\n        wordCount\n      }\n      id\n      site\n      name\n      createTime\n      updateTime\n      avatar\n      description\n      url\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation updateAuthorByCrawler($authorId: Int!) {\n    updateAuthorByCrawler(authorId: $authorId) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation updateAuthorByCrawler($authorId: Int!) {\n    updateAuthorByCrawler(authorId: $authorId) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query fetchAuthor($id: String!, $novelSite: NovelSite!) {\n    fetchAuthor(id: $id, novelSite: $novelSite) {\n      __typename\n      name\n      description\n      image\n      url\n      id\n      site\n      novels {\n        id\n        name\n        description\n        image\n        url\n        status\n        site\n        chapters {\n          id\n          novelId\n          title\n          url\n          time\n          wordCount\n          site\n        }\n        tags {\n          id\n          name\n          url\n        }\n      }\n    }\n  }\n',
): (typeof documents)['\n  query fetchAuthor($id: String!, $novelSite: NovelSite!) {\n    fetchAuthor(id: $id, novelSite: $novelSite) {\n      __typename\n      name\n      description\n      image\n      url\n      id\n      site\n      novels {\n        id\n        name\n        description\n        image\n        url\n        status\n        site\n        chapters {\n          id\n          novelId\n          title\n          url\n          time\n          wordCount\n          site\n        }\n        tags {\n          id\n          name\n          url\n        }\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation saveDraftAuthor($author: SaveDraftAuthor!) {\n    saveDraftAuthor(author: $author) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation saveDraftAuthor($author: SaveDraftAuthor!) {\n    saveDraftAuthor(author: $author) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation createAuthor($avatar: String!, $description: String!, $name: String!, $site: NovelSite!, $siteId: String!) {\n    createAuthor(avatar: $avatar, description: $description, name: $name, site: $site, siteId: $siteId) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation createAuthor($avatar: String!, $description: String!, $name: String!, $site: NovelSite!, $siteId: String!) {\n    createAuthor(avatar: $avatar, description: $description, name: $name, site: $site, siteId: $siteId) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query getAuthors($pagination: Pagination!) {\n    queryAuthors(pagination: $pagination) {\n      data {\n        id\n        site\n        name\n        createTime\n        updateTime\n        avatar\n        description\n        url\n      }\n      total\n    }\n  }\n',
): (typeof documents)['\n  query getAuthors($pagination: Pagination!) {\n    queryAuthors(pagination: $pagination) {\n      data {\n        id\n        site\n        name\n        createTime\n        updateTime\n        avatar\n        description\n        url\n      }\n      total\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation deleteAuthor($id: Int!) {\n    deleteAuthor(id: $id) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation deleteAuthor($id: Int!) {\n    deleteAuthor(id: $id) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query allCollections {\n    allCollections {\n      name\n      id\n      path\n      createTime\n      updateTime\n      description\n      parentId\n    }\n  }\n',
): (typeof documents)['\n  query allCollections {\n    allCollections {\n      name\n      id\n      path\n      createTime\n      updateTime\n      description\n      parentId\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query getCollectionAncestors($id: Int!) {\n    getCollection(id: $id) {\n      ancestors {\n        id\n        name\n      }\n      id\n      name\n    }\n  }\n',
): (typeof documents)['\n  query getCollectionAncestors($id: Int!) {\n    getCollection(id: $id) {\n      ancestors {\n        id\n        name\n      }\n      id\n      name\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation deleteCollection($id: Int!) {\n    deleteCollection(id: $id)\n  }\n',
): (typeof documents)['\n  mutation deleteCollection($id: Int!) {\n    deleteCollection(id: $id)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation updateCollection($id: Int!, $name: String!, $parentId: Int, $description: String) {\n    updateCollection(id: $id, name: $name, parentId: $parentId, description: $description) {\n      __typename\n    }\n  }\n',
): (typeof documents)['\n  mutation updateCollection($id: Int!, $name: String!, $parentId: Int, $description: String) {\n    updateCollection(id: $id, name: $name, parentId: $parentId, description: $description) {\n      __typename\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation createCollection($parentId: Int, $name: String!, $description: String) {\n    createCollection(parentId: $parentId, name: $name, description: $description) {\n      path\n    }\n  }\n',
): (typeof documents)['\n  mutation createCollection($parentId: Int, $name: String!, $description: String) {\n    createCollection(parentId: $parentId, name: $name, description: $description) {\n      path\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query getCollections($parentId: Int, $pagination: Pagination!) {\n    getCollections(parentId: $parentId, pagination: $pagination) {\n      data {\n        name\n        id\n        path\n        createTime\n        updateTime\n        description\n      }\n      total\n    }\n  }\n',
): (typeof documents)['\n  query getCollections($parentId: Int, $pagination: Pagination!) {\n    getCollections(parentId: $parentId, pagination: $pagination) {\n      data {\n        name\n        id\n        path\n        createTime\n        updateTime\n        description\n      }\n      total\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation addCollectionForNovel($novelId: Int!, $collectionId: Int!) {\n    addCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation addCollectionForNovel($novelId: Int!, $collectionId: Int!) {\n    addCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation addReadRecord($novelId: Int!, $chapterIds: [Int!]!) {\n    addReadRecordsForChapter(novelId: $novelId, chapterIds: $chapterIds)\n  }\n',
): (typeof documents)['\n  mutation addReadRecord($novelId: Int!, $chapterIds: [Int!]!) {\n    addReadRecordsForChapter(novelId: $novelId, chapterIds: $chapterIds)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation deleteReadRecord($chapterIds: [Int!]!) {\n    deleteReadRecordsForChapter(chapterIds: $chapterIds)\n  }\n',
): (typeof documents)['\n  mutation deleteReadRecord($chapterIds: [Int!]!) {\n    deleteReadRecordsForChapter(chapterIds: $chapterIds)\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation CreateComment($novelId: Int!, $content: String!) {\n    addCommentForNovel(novelId: $novelId, content: $content) {\n      __typename\n    }\n  }\n',
): (typeof documents)['\n  mutation CreateComment($novelId: Int!, $content: String!) {\n    addCommentForNovel(novelId: $novelId, content: $content) {\n      __typename\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation UpdateComment($novelId: Int!, $content: String!) {\n    updateCommentForNovel(novelId: $novelId, content: $content) {\n      __typename\n    }\n  }\n',
): (typeof documents)['\n  mutation UpdateComment($novelId: Int!, $content: String!) {\n    updateCommentForNovel(novelId: $novelId, content: $content) {\n      __typename\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query getNovel($id: Int!) {\n    getNovel(id: $id) {\n      id\n      name\n      avatar\n      description\n      createTime\n      updateTime\n      description\n      novelStatus\n      url\n      chapters {\n        id\n        title\n        createTime\n        updateTime\n        url\n        wordCount\n        time\n        isRead\n      }\n      author {\n        avatar\n        description\n        id\n        name\n        site\n      }\n      lastChapter {\n        time\n      }\n      firstChapter {\n        time\n      }\n      wordCount\n      tags {\n        url\n        name\n        id\n      }\n      site\n      collections {\n        name\n        id\n        description\n        path\n      }\n      comments {\n        content\n      }\n    }\n  }\n',
): (typeof documents)['\n  query getNovel($id: Int!) {\n    getNovel(id: $id) {\n      id\n      name\n      avatar\n      description\n      createTime\n      updateTime\n      description\n      novelStatus\n      url\n      chapters {\n        id\n        title\n        createTime\n        updateTime\n        url\n        wordCount\n        time\n        isRead\n      }\n      author {\n        avatar\n        description\n        id\n        name\n        site\n      }\n      lastChapter {\n        time\n      }\n      firstChapter {\n        time\n      }\n      wordCount\n      tags {\n        url\n        name\n        id\n      }\n      site\n      collections {\n        name\n        id\n        description\n        path\n      }\n      comments {\n        content\n      }\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation updateNovelByCrawler($novelId: Int!) {\n    updateNovelByCrawler(novelId: $novelId) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation updateNovelByCrawler($novelId: Int!) {\n    updateNovelByCrawler(novelId: $novelId) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation deleteCommentForNovel($novelId: Int!) {\n    deleteCommentForNovel(novelId: $novelId) {\n      __typename\n    }\n  }\n',
): (typeof documents)['\n  mutation deleteCommentForNovel($novelId: Int!) {\n    deleteCommentForNovel(novelId: $novelId) {\n      __typename\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation deleteCollectionForNovel($novelId: Int!, $collectionId: Int!) {\n    deleteCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation deleteCollectionForNovel($novelId: Int!, $collectionId: Int!) {\n    deleteCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query fetchNovel($id: String!, $novelSite: NovelSite!) {\n    fetchNovel(id: $id, novelSite: $novelSite) {\n      author {\n        description\n        image\n        name\n        url\n        id\n      }\n      chapters {\n        title\n        url\n        site\n        time\n        wordCount\n        id\n      }\n      tags {\n        id\n        name\n        url\n      }\n      description\n      image\n      name\n      url\n      site\n      status\n      id\n    }\n  }\n',
): (typeof documents)['\n  query fetchNovel($id: String!, $novelSite: NovelSite!) {\n    fetchNovel(id: $id, novelSite: $novelSite) {\n      author {\n        description\n        image\n        name\n        url\n        id\n      }\n      chapters {\n        title\n        url\n        site\n        time\n        wordCount\n        id\n      }\n      tags {\n        id\n        name\n        url\n      }\n      description\n      image\n      name\n      url\n      site\n      status\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation saveDraftNovel($novel: SaveDraftNovel!) {\n    saveDraftNovel(novel: $novel) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation saveDraftNovel($novel: SaveDraftNovel!) {\n    saveDraftNovel(novel: $novel) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation createNovel($data: CreateNovelInput!) {\n    createNovel(data: $data) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation createNovel($data: CreateNovelInput!) {\n    createNovel(data: $data) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query getNovels(\n    $collectionMatch: TagMatch\n    $novelStatus: NovelStatus\n    $tagMatch: TagMatch\n    $pagination: Pagination!\n  ) {\n    queryNovels(\n      collectionMatch: $collectionMatch\n      novelStatus: $novelStatus\n      tagMatch: $tagMatch\n      pagination: $pagination\n    ) {\n      data {\n        id\n        name\n        description\n        createTime\n        updateTime\n        description\n        novelStatus\n        avatar\n        site\n      }\n      total\n    }\n  }\n',
): (typeof documents)['\n  query getNovels(\n    $collectionMatch: TagMatch\n    $novelStatus: NovelStatus\n    $tagMatch: TagMatch\n    $pagination: Pagination!\n  ) {\n    queryNovels(\n      collectionMatch: $collectionMatch\n      novelStatus: $novelStatus\n      tagMatch: $tagMatch\n      pagination: $pagination\n    ) {\n      data {\n        id\n        name\n        description\n        createTime\n        updateTime\n        description\n        novelStatus\n        avatar\n        site\n      }\n      total\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation deleteNovel($id: Int!) {\n    deleteNovel(id: $id) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation deleteNovel($id: Int!) {\n    deleteNovel(id: $id) {\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation createTag($name: String!, $site: NovelSite!, $siteId: String!) {\n    createTag(name: $name, site: $site, siteId: $siteId) {\n      name\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation createTag($name: String!, $site: NovelSite!, $siteId: String!) {\n    createTag(name: $name, site: $site, siteId: $siteId) {\n      name\n      id\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query getTags($pagination: Pagination!) {\n    queryTags(pagination: $pagination) {\n      data {\n        name\n        id\n        site\n        url\n        createTime\n        updateTime\n      }\n      total\n    }\n  }\n',
): (typeof documents)['\n  query getTags($pagination: Pagination!) {\n    queryTags(pagination: $pagination) {\n      data {\n        name\n        id\n        site\n        url\n        createTime\n        updateTime\n      }\n      total\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation deleteTag($id: Int!) {\n    deleteTag(id: $id) {\n      id\n    }\n  }\n',
): (typeof documents)['\n  mutation deleteTag($id: Int!) {\n    deleteTag(id: $id) {\n      id\n    }\n  }\n'];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
