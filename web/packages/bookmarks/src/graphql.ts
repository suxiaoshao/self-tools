import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  /**
   * A datetime with timezone offset.
   *
   * The input is a string in RFC3339 format, e.g. "2022-01-12T04:00:19.12345Z"
   * or "2022-01-12T04:00:19+03:00". The output is also a string in RFC3339
   * format, but it is always normalized to the UTC (Z) offset, e.g.
   * "2022-01-12T04:00:19.12345Z".
   */
  DateTime: { input: any; output: any };
};

export type Author = {
  __typename?: 'Author';
  avatar: Scalars['String']['output'];
  createTime: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  novels: Array<Novel>;
  site: NovelSite;
  siteId: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
};

export type Chapter = {
  __typename?: 'Chapter';
  content?: Maybe<Scalars['String']['output']>;
  createTime: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  novel: Novel;
  novelId: Scalars['Int']['output'];
  site: NovelSite;
  siteId: Scalars['String']['output'];
  siteNovelId: Scalars['String']['output'];
  title: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
};

export type Collection = {
  __typename?: 'Collection';
  /** 获取祖先列表 */
  ancestors: Array<Collection>;
  /** 获取子列表 */
  children: Array<Collection>;
  createTime: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['Int']['output']>;
  path: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
};

export type CreateNovelInput = {
  authorId: Scalars['Int']['input'];
  avatar: Scalars['String']['input'];
  collectionId?: InputMaybe<Scalars['Int']['input']>;
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novelStatus: NovelStatus;
  site: NovelSite;
  siteId: Scalars['String']['input'];
  tags: Array<Scalars['Int']['input']>;
};

export type DraftAuthorInfo = JjAuthor | QdAuthor;

export type DraftNovelInfo = JjNovel | QdNovel;

export type JjAuthor = {
  __typename?: 'JjAuthor';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  novels: Array<JjNovel>;
  url: Scalars['String']['output'];
};

export type JjChapter = {
  __typename?: 'JjChapter';
  id: Scalars['String']['output'];
  novelId: Scalars['String']['output'];
  time: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
  wordCount: Scalars['Int']['output'];
};

export type JjNovel = {
  __typename?: 'JjNovel';
  author: JjAuthor;
  chapters: Array<JjChapter>;
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  status: NovelStatus;
  url: Scalars['String']['output'];
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  /** 创建作者 */
  createAuthor: Author;
  /** 创建目录 */
  createCollection: Collection;
  /** 创建小说 */
  createNovel: Novel;
  /** 创建标签 */
  createTag: Tag;
  /** 删除作者 */
  deleteAuthor: Author;
  /** 删除目录 */
  deleteCollection: Collection;
  /** 删除小说 */
  deleteNovel: Novel;
  /** 删除标签 */
  deleteTag: Tag;
  /** 保存 draft author */
  saveDraftAuthor: Author;
};

export type MutationRootCreateAuthorArgs = {
  avatar: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  site: NovelSite;
  siteId: Scalars['String']['input'];
};

export type MutationRootCreateCollectionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationRootCreateNovelArgs = {
  data: CreateNovelInput;
};

export type MutationRootCreateTagArgs = {
  collectionId?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
};

export type MutationRootDeleteAuthorArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootDeleteCollectionArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootDeleteNovelArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootDeleteTagArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootSaveDraftAuthorArgs = {
  author: SaveDraftAuthor;
};

export type Novel = {
  __typename?: 'Novel';
  author: Author;
  avatar: Scalars['String']['output'];
  /** 获取小说章节 */
  chapters: Array<Chapter>;
  collection?: Maybe<Collection>;
  createTime: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  novelStatus: NovelStatus;
  site: NovelSite;
  siteId: Scalars['String']['output'];
  tags: Array<Tag>;
  updateTime: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
};

export enum NovelSite {
  Jjwxc = 'JJWXC',
  Qidian = 'QIDIAN',
}

export enum NovelStatus {
  Completed = 'COMPLETED',
  Ongoing = 'ONGOING',
}

export type QdAuthor = {
  __typename?: 'QdAuthor';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  novels: Array<QdNovel>;
  url: Scalars['String']['output'];
};

export type QdChapter = {
  __typename?: 'QdChapter';
  id: Scalars['String']['output'];
  novelId: Scalars['String']['output'];
  time: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
  wordCount: Scalars['Int']['output'];
};

export type QdNovel = {
  __typename?: 'QdNovel';
  author: QdAuthor;
  chapters: Array<QdChapter>;
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  status: NovelStatus;
  url: Scalars['String']['output'];
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** 后端 fetch 作者详情 */
  fetchAuthor: DraftAuthorInfo;
  /** 后端 fetch 小说详情 */
  fetchNovel: DraftNovelInfo;
  /** 获取作者详情 */
  getAuthor: Author;
  /** 获取目录详情 */
  getCollection: Collection;
  /** 获取目录列表 */
  getCollections: Array<Collection>;
  /** 获取小说详情 */
  getNovel: Novel;
  /** 获取作者列表 */
  queryAuthors: Array<Author>;
  /** 获取小说列表 */
  queryNovels: Array<Novel>;
  /** 获取标签列表 */
  queryTags: Array<Tag>;
};

export type QueryRootFetchAuthorArgs = {
  id: Scalars['String']['input'];
  novelSite: NovelSite;
};

export type QueryRootFetchNovelArgs = {
  id: Scalars['String']['input'];
  novelSite: NovelSite;
};

export type QueryRootGetAuthorArgs = {
  id: Scalars['Int']['input'];
};

export type QueryRootGetCollectionArgs = {
  id: Scalars['Int']['input'];
};

export type QueryRootGetCollectionsArgs = {
  parentId?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryRootGetNovelArgs = {
  id: Scalars['Int']['input'];
};

export type QueryRootQueryAuthorsArgs = {
  searchName?: InputMaybe<Scalars['String']['input']>;
};

export type QueryRootQueryNovelsArgs = {
  collectionId?: InputMaybe<Scalars['Int']['input']>;
  novelStatus?: InputMaybe<NovelStatus>;
  tagMatch?: InputMaybe<TagMatch>;
};

export type QueryRootQueryTagsArgs = {
  collectionId?: InputMaybe<Scalars['Int']['input']>;
  deepSearch?: InputMaybe<Scalars['Boolean']['input']>;
};

export type SaveChapterInfo = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novelId: Scalars['String']['input'];
  time: Scalars['DateTime']['input'];
  url: Scalars['String']['input'];
  wordCount: Scalars['Int']['input'];
};

export type SaveDraftAuthor = {
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
  image: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novels: Array<SaveNovelInfo>;
  site: NovelSite;
  url: Scalars['String']['input'];
};

export type SaveNovelInfo = {
  chapters: Array<SaveChapterInfo>;
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
  image: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novelStatus: NovelStatus;
  site: NovelSite;
  url: Scalars['String']['input'];
};

export type Tag = {
  __typename?: 'Tag';
  collectionId?: Maybe<Scalars['Int']['output']>;
  createTime: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
};

export type TagMatch = {
  fullMatch: Scalars['Boolean']['input'];
  matchSet: Array<Scalars['Int']['input']>;
};

export type SearchAuthorQueryVariables = Exact<{
  searchName?: InputMaybe<Scalars['String']['input']>;
}>;

export type SearchAuthorQuery = {
  __typename?: 'QueryRoot';
  queryAuthors: Array<{ __typename?: 'Author'; id: number; name: string; description: string; avatar: string }>;
};

export type GetCollectionSelectQueryVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']['input']>;
}>;

export type GetCollectionSelectQuery = {
  __typename?: 'QueryRoot';
  getCollections: Array<{ __typename?: 'Collection'; name: string; id: number }>;
};

export type AllowTagsQueryVariables = Exact<{
  collectionId?: InputMaybe<Scalars['Int']['input']>;
}>;

export type AllowTagsQuery = {
  __typename?: 'QueryRoot';
  queryTags: Array<{ __typename?: 'Tag'; id: number; name: string }>;
};

export type GetAuthorsQueryVariables = Exact<{ [key: string]: never }>;

export type GetAuthorsQuery = {
  __typename?: 'QueryRoot';
  queryAuthors: Array<{
    __typename?: 'Author';
    id: number;
    site: NovelSite;
    name: string;
    createTime: any;
    updateTime: any;
    avatar: string;
    description: string;
  }>;
};

export type GetAuthorQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetAuthorQuery = {
  __typename?: 'QueryRoot';
  getAuthor: {
    __typename?: 'Author';
    id: number;
    site: NovelSite;
    name: string;
    createTime: any;
    updateTime: any;
    avatar: string;
    description: string;
    novels: Array<{
      __typename?: 'Novel';
      id: number;
      name: string;
      avatar: string;
      createTime: any;
      updateTime: any;
      description: string;
      novelStatus: NovelStatus;
    }>;
  };
};

export type FetchAuthorQueryVariables = Exact<{
  id: Scalars['String']['input'];
  novelSite: NovelSite;
}>;

export type FetchAuthorQuery = {
  __typename?: 'QueryRoot';
  fetchAuthor:
    | {
        __typename: 'JjAuthor';
        name: string;
        description: string;
        image: string;
        url: string;
        id: string;
        novels: Array<{
          __typename?: 'JjNovel';
          id: string;
          name: string;
          description: string;
          image: string;
          url: string;
          status: NovelStatus;
          chapters: Array<{
            __typename?: 'JjChapter';
            id: string;
            novelId: string;
            title: string;
            url: string;
            time: any;
            wordCount: number;
          }>;
        }>;
      }
    | {
        __typename: 'QdAuthor';
        name: string;
        description: string;
        image: string;
        url: string;
        id: string;
        novels: Array<{
          __typename?: 'QdNovel';
          id: string;
          name: string;
          description: string;
          image: string;
          url: string;
          status: NovelStatus;
          chapters: Array<{
            __typename?: 'QdChapter';
            id: string;
            novelId: string;
            title: string;
            url: string;
            time: any;
            wordCount: number;
          }>;
        }>;
      };
};

export type DeleteAuthorMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteAuthorMutation = { __typename?: 'MutationRoot'; deleteAuthor: { __typename?: 'Author'; id: number } };

export type CreateAuthorMutationVariables = Exact<{
  avatar: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  site: NovelSite;
  siteId: Scalars['String']['input'];
}>;

export type CreateAuthorMutation = {
  __typename?: 'MutationRoot';
  createAuthor: {
    __typename?: 'Author';
    id: number;
    site: NovelSite;
    name: string;
    createTime: any;
    updateTime: any;
    avatar: string;
    description: string;
  };
};

export type AuthorAllFragment = {
  __typename?: 'Author';
  id: number;
  site: NovelSite;
  name: string;
  createTime: any;
  updateTime: any;
  avatar: string;
  description: string;
};

export type SaveDraftAuthorMutationVariables = Exact<{
  author: SaveDraftAuthor;
}>;

export type SaveDraftAuthorMutation = {
  __typename?: 'MutationRoot';
  saveDraftAuthor: {
    __typename?: 'Author';
    id: number;
    site: NovelSite;
    name: string;
    createTime: any;
    updateTime: any;
    avatar: string;
    description: string;
  };
};

export type GetCollectionsQueryVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']['input']>;
}>;

export type GetCollectionsQuery = {
  __typename?: 'QueryRoot';
  getCollections: Array<{
    __typename?: 'Collection';
    name: string;
    id: number;
    path: string;
    createTime: any;
    updateTime: any;
    description?: string | null;
  }>;
};

export type DeleteCollectionMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteCollectionMutation = {
  __typename?: 'MutationRoot';
  deleteCollection: { __typename?: 'Collection'; path: string };
};

export type CreateCollectionMutationVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
}>;

export type CreateCollectionMutation = {
  __typename?: 'MutationRoot';
  createCollection: { __typename?: 'Collection'; path: string };
};

export type GetCollectionAncestorsQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetCollectionAncestorsQuery = {
  __typename?: 'QueryRoot';
  getCollection: {
    __typename?: 'Collection';
    id: number;
    name: string;
    ancestors: Array<{ __typename?: 'Collection'; id: number; name: string }>;
  };
};

export type GetNovelQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetNovelQuery = {
  __typename?: 'QueryRoot';
  getNovel: {
    __typename?: 'Novel';
    id: number;
    name: string;
    avatar: string;
    description: string;
    createTime: any;
    updateTime: any;
    novelStatus: NovelStatus;
    collection?: {
      __typename?: 'Collection';
      id: number;
      name: string;
      path: string;
      description?: string | null;
    } | null;
    chapters: Array<{
      __typename?: 'Chapter';
      id: number;
      title: string;
      createTime: any;
      updateTime: any;
      content?: string | null;
      url: string;
    }>;
    author: { __typename?: 'Author'; avatar: string; description: string; id: number; name: string; site: NovelSite };
  };
};

export type FetchNovelQueryVariables = Exact<{
  id: Scalars['String']['input'];
  NovelSite: NovelSite;
}>;

export type FetchNovelQuery = {
  __typename?: 'QueryRoot';
  fetchNovel:
    | {
        __typename?: 'JjNovel';
        description: string;
        image: string;
        name: string;
        url: string;
        author: { __typename?: 'JjAuthor'; description: string; image: string; name: string; url: string };
        chapters: Array<{ __typename?: 'JjChapter'; title: string; url: string }>;
      }
    | {
        __typename?: 'QdNovel';
        description: string;
        image: string;
        name: string;
        url: string;
        author: { __typename?: 'QdAuthor'; description: string; image: string; name: string; url: string };
        chapters: Array<{ __typename?: 'QdChapter'; title: string; url: string }>;
      };
};

export type GetNovelsQueryVariables = Exact<{
  collectionId?: InputMaybe<Scalars['Int']['input']>;
  novelStatus?: InputMaybe<NovelStatus>;
  tagMatch?: InputMaybe<TagMatch>;
}>;

export type GetNovelsQuery = {
  __typename?: 'QueryRoot';
  queryNovels: Array<{
    __typename?: 'Novel';
    id: number;
    name: string;
    description: string;
    createTime: any;
    updateTime: any;
    novelStatus: NovelStatus;
    avatar: string;
  }>;
};

export type CreateNovelMutationVariables = Exact<{
  data: CreateNovelInput;
}>;

export type CreateNovelMutation = { __typename?: 'MutationRoot'; createNovel: { __typename?: 'Novel'; id: number } };

export type DeleteNovelMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteNovelMutation = { __typename?: 'MutationRoot'; deleteNovel: { __typename?: 'Novel'; id: number } };

export type CreateTagMutationVariables = Exact<{
  name: Scalars['String']['input'];
  collectionId?: InputMaybe<Scalars['Int']['input']>;
}>;

export type CreateTagMutation = {
  __typename?: 'MutationRoot';
  createTag: { __typename?: 'Tag'; name: string; id: number };
};

export type GetTagsQueryVariables = Exact<{
  collectionId?: InputMaybe<Scalars['Int']['input']>;
}>;

export type GetTagsQuery = {
  __typename?: 'QueryRoot';
  queryTags: Array<{
    __typename?: 'Tag';
    name: string;
    id: number;
    createTime: any;
    updateTime: any;
    collectionId?: number | null;
  }>;
};

export type DeleteTagMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteTagMutation = { __typename?: 'MutationRoot'; deleteTag: { __typename?: 'Tag'; id: number } };

export const AuthorAllFragmentDoc = gql`
  fragment AuthorAll on Author {
    id
    site
    name
    createTime
    updateTime
    avatar
    description
  }
`;
export const SearchAuthorDocument = gql`
  query searchAuthor($searchName: String) {
    queryAuthors(searchName: $searchName) {
      id
      name
      description
      avatar
    }
  }
`;

/**
 * __useSearchAuthorQuery__
 *
 * To run a query within a React component, call `useSearchAuthorQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchAuthorQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchAuthorQuery({
 *   variables: {
 *      searchName: // value for 'searchName'
 *   },
 * });
 */
export function useSearchAuthorQuery(
  baseOptions?: Apollo.QueryHookOptions<SearchAuthorQuery, SearchAuthorQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<SearchAuthorQuery, SearchAuthorQueryVariables>(SearchAuthorDocument, options);
}
export function useSearchAuthorLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<SearchAuthorQuery, SearchAuthorQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<SearchAuthorQuery, SearchAuthorQueryVariables>(SearchAuthorDocument, options);
}
export function useSearchAuthorSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<SearchAuthorQuery, SearchAuthorQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<SearchAuthorQuery, SearchAuthorQueryVariables>(SearchAuthorDocument, options);
}
export type SearchAuthorQueryHookResult = ReturnType<typeof useSearchAuthorQuery>;
export type SearchAuthorLazyQueryHookResult = ReturnType<typeof useSearchAuthorLazyQuery>;
export type SearchAuthorSuspenseQueryHookResult = ReturnType<typeof useSearchAuthorSuspenseQuery>;
export type SearchAuthorQueryResult = Apollo.QueryResult<SearchAuthorQuery, SearchAuthorQueryVariables>;
export const GetCollectionSelectDocument = gql`
  query getCollectionSelect($parentId: Int) {
    getCollections(parentId: $parentId) {
      name
      id
    }
  }
`;

/**
 * __useGetCollectionSelectQuery__
 *
 * To run a query within a React component, call `useGetCollectionSelectQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCollectionSelectQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCollectionSelectQuery({
 *   variables: {
 *      parentId: // value for 'parentId'
 *   },
 * });
 */
export function useGetCollectionSelectQuery(
  baseOptions?: Apollo.QueryHookOptions<GetCollectionSelectQuery, GetCollectionSelectQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetCollectionSelectQuery, GetCollectionSelectQueryVariables>(
    GetCollectionSelectDocument,
    options,
  );
}
export function useGetCollectionSelectLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetCollectionSelectQuery, GetCollectionSelectQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetCollectionSelectQuery, GetCollectionSelectQueryVariables>(
    GetCollectionSelectDocument,
    options,
  );
}
export function useGetCollectionSelectSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<GetCollectionSelectQuery, GetCollectionSelectQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetCollectionSelectQuery, GetCollectionSelectQueryVariables>(
    GetCollectionSelectDocument,
    options,
  );
}
export type GetCollectionSelectQueryHookResult = ReturnType<typeof useGetCollectionSelectQuery>;
export type GetCollectionSelectLazyQueryHookResult = ReturnType<typeof useGetCollectionSelectLazyQuery>;
export type GetCollectionSelectSuspenseQueryHookResult = ReturnType<typeof useGetCollectionSelectSuspenseQuery>;
export type GetCollectionSelectQueryResult = Apollo.QueryResult<
  GetCollectionSelectQuery,
  GetCollectionSelectQueryVariables
>;
export const AllowTagsDocument = gql`
  query allowTags($collectionId: Int) {
    queryTags(collectionId: $collectionId, deepSearch: true) {
      id
      name
    }
  }
`;

/**
 * __useAllowTagsQuery__
 *
 * To run a query within a React component, call `useAllowTagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllowTagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllowTagsQuery({
 *   variables: {
 *      collectionId: // value for 'collectionId'
 *   },
 * });
 */
export function useAllowTagsQuery(baseOptions?: Apollo.QueryHookOptions<AllowTagsQuery, AllowTagsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<AllowTagsQuery, AllowTagsQueryVariables>(AllowTagsDocument, options);
}
export function useAllowTagsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<AllowTagsQuery, AllowTagsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<AllowTagsQuery, AllowTagsQueryVariables>(AllowTagsDocument, options);
}
export function useAllowTagsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<AllowTagsQuery, AllowTagsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<AllowTagsQuery, AllowTagsQueryVariables>(AllowTagsDocument, options);
}
export type AllowTagsQueryHookResult = ReturnType<typeof useAllowTagsQuery>;
export type AllowTagsLazyQueryHookResult = ReturnType<typeof useAllowTagsLazyQuery>;
export type AllowTagsSuspenseQueryHookResult = ReturnType<typeof useAllowTagsSuspenseQuery>;
export type AllowTagsQueryResult = Apollo.QueryResult<AllowTagsQuery, AllowTagsQueryVariables>;
export const GetAuthorsDocument = gql`
  query getAuthors {
    queryAuthors {
      ...AuthorAll
    }
  }
  ${AuthorAllFragmentDoc}
`;

/**
 * __useGetAuthorsQuery__
 *
 * To run a query within a React component, call `useGetAuthorsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAuthorsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAuthorsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetAuthorsQuery(baseOptions?: Apollo.QueryHookOptions<GetAuthorsQuery, GetAuthorsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetAuthorsQuery, GetAuthorsQueryVariables>(GetAuthorsDocument, options);
}
export function useGetAuthorsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetAuthorsQuery, GetAuthorsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetAuthorsQuery, GetAuthorsQueryVariables>(GetAuthorsDocument, options);
}
export function useGetAuthorsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<GetAuthorsQuery, GetAuthorsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetAuthorsQuery, GetAuthorsQueryVariables>(GetAuthorsDocument, options);
}
export type GetAuthorsQueryHookResult = ReturnType<typeof useGetAuthorsQuery>;
export type GetAuthorsLazyQueryHookResult = ReturnType<typeof useGetAuthorsLazyQuery>;
export type GetAuthorsSuspenseQueryHookResult = ReturnType<typeof useGetAuthorsSuspenseQuery>;
export type GetAuthorsQueryResult = Apollo.QueryResult<GetAuthorsQuery, GetAuthorsQueryVariables>;
export const GetAuthorDocument = gql`
  query getAuthor($id: Int!) {
    getAuthor(id: $id) {
      novels {
        id
        name
        avatar
        createTime
        updateTime
        description
        novelStatus
      }
      ...AuthorAll
    }
  }
  ${AuthorAllFragmentDoc}
`;

/**
 * __useGetAuthorQuery__
 *
 * To run a query within a React component, call `useGetAuthorQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetAuthorQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetAuthorQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetAuthorQuery(
  baseOptions: Apollo.QueryHookOptions<GetAuthorQuery, GetAuthorQueryVariables> &
    ({ variables: GetAuthorQueryVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetAuthorQuery, GetAuthorQueryVariables>(GetAuthorDocument, options);
}
export function useGetAuthorLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetAuthorQuery, GetAuthorQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetAuthorQuery, GetAuthorQueryVariables>(GetAuthorDocument, options);
}
export function useGetAuthorSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<GetAuthorQuery, GetAuthorQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetAuthorQuery, GetAuthorQueryVariables>(GetAuthorDocument, options);
}
export type GetAuthorQueryHookResult = ReturnType<typeof useGetAuthorQuery>;
export type GetAuthorLazyQueryHookResult = ReturnType<typeof useGetAuthorLazyQuery>;
export type GetAuthorSuspenseQueryHookResult = ReturnType<typeof useGetAuthorSuspenseQuery>;
export type GetAuthorQueryResult = Apollo.QueryResult<GetAuthorQuery, GetAuthorQueryVariables>;
export const FetchAuthorDocument = gql`
  query fetchAuthor($id: String!, $novelSite: NovelSite!) {
    fetchAuthor(id: $id, novelSite: $novelSite) {
      __typename
      ... on QdAuthor {
        name
        description
        image
        url
        id
        novels {
          id
          name
          description
          image
          url
          status
          chapters {
            id
            novelId
            title
            url
            time
            wordCount
          }
        }
      }
      ... on JjAuthor {
        name
        description
        image
        url
        id
        novels {
          id
          name
          description
          image
          url
          status
          chapters {
            id
            novelId
            title
            url
            time
            wordCount
          }
        }
      }
    }
  }
`;

/**
 * __useFetchAuthorQuery__
 *
 * To run a query within a React component, call `useFetchAuthorQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchAuthorQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchAuthorQuery({
 *   variables: {
 *      id: // value for 'id'
 *      novelSite: // value for 'novelSite'
 *   },
 * });
 */
export function useFetchAuthorQuery(
  baseOptions: Apollo.QueryHookOptions<FetchAuthorQuery, FetchAuthorQueryVariables> &
    ({ variables: FetchAuthorQueryVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchAuthorQuery, FetchAuthorQueryVariables>(FetchAuthorDocument, options);
}
export function useFetchAuthorLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<FetchAuthorQuery, FetchAuthorQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchAuthorQuery, FetchAuthorQueryVariables>(FetchAuthorDocument, options);
}
export function useFetchAuthorSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<FetchAuthorQuery, FetchAuthorQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<FetchAuthorQuery, FetchAuthorQueryVariables>(FetchAuthorDocument, options);
}
export type FetchAuthorQueryHookResult = ReturnType<typeof useFetchAuthorQuery>;
export type FetchAuthorLazyQueryHookResult = ReturnType<typeof useFetchAuthorLazyQuery>;
export type FetchAuthorSuspenseQueryHookResult = ReturnType<typeof useFetchAuthorSuspenseQuery>;
export type FetchAuthorQueryResult = Apollo.QueryResult<FetchAuthorQuery, FetchAuthorQueryVariables>;
export const DeleteAuthorDocument = gql`
  mutation deleteAuthor($id: Int!) {
    deleteAuthor(id: $id) {
      id
    }
  }
`;
export type DeleteAuthorMutationFn = Apollo.MutationFunction<DeleteAuthorMutation, DeleteAuthorMutationVariables>;

/**
 * __useDeleteAuthorMutation__
 *
 * To run a mutation, you first call `useDeleteAuthorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteAuthorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteAuthorMutation, { data, loading, error }] = useDeleteAuthorMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteAuthorMutation(
  baseOptions?: Apollo.MutationHookOptions<DeleteAuthorMutation, DeleteAuthorMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteAuthorMutation, DeleteAuthorMutationVariables>(DeleteAuthorDocument, options);
}
export type DeleteAuthorMutationHookResult = ReturnType<typeof useDeleteAuthorMutation>;
export type DeleteAuthorMutationResult = Apollo.MutationResult<DeleteAuthorMutation>;
export type DeleteAuthorMutationOptions = Apollo.BaseMutationOptions<
  DeleteAuthorMutation,
  DeleteAuthorMutationVariables
>;
export const CreateAuthorDocument = gql`
  mutation createAuthor($avatar: String!, $description: String!, $name: String!, $site: NovelSite!, $siteId: String!) {
    createAuthor(avatar: $avatar, description: $description, name: $name, site: $site, siteId: $siteId) {
      ...AuthorAll
    }
  }
  ${AuthorAllFragmentDoc}
`;
export type CreateAuthorMutationFn = Apollo.MutationFunction<CreateAuthorMutation, CreateAuthorMutationVariables>;

/**
 * __useCreateAuthorMutation__
 *
 * To run a mutation, you first call `useCreateAuthorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateAuthorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createAuthorMutation, { data, loading, error }] = useCreateAuthorMutation({
 *   variables: {
 *      avatar: // value for 'avatar'
 *      description: // value for 'description'
 *      name: // value for 'name'
 *      site: // value for 'site'
 *      siteId: // value for 'siteId'
 *   },
 * });
 */
export function useCreateAuthorMutation(
  baseOptions?: Apollo.MutationHookOptions<CreateAuthorMutation, CreateAuthorMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateAuthorMutation, CreateAuthorMutationVariables>(CreateAuthorDocument, options);
}
export type CreateAuthorMutationHookResult = ReturnType<typeof useCreateAuthorMutation>;
export type CreateAuthorMutationResult = Apollo.MutationResult<CreateAuthorMutation>;
export type CreateAuthorMutationOptions = Apollo.BaseMutationOptions<
  CreateAuthorMutation,
  CreateAuthorMutationVariables
>;
export const SaveDraftAuthorDocument = gql`
  mutation saveDraftAuthor($author: SaveDraftAuthor!) {
    saveDraftAuthor(author: $author) {
      ...AuthorAll
    }
  }
  ${AuthorAllFragmentDoc}
`;
export type SaveDraftAuthorMutationFn = Apollo.MutationFunction<
  SaveDraftAuthorMutation,
  SaveDraftAuthorMutationVariables
>;

/**
 * __useSaveDraftAuthorMutation__
 *
 * To run a mutation, you first call `useSaveDraftAuthorMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveDraftAuthorMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveDraftAuthorMutation, { data, loading, error }] = useSaveDraftAuthorMutation({
 *   variables: {
 *      author: // value for 'author'
 *   },
 * });
 */
export function useSaveDraftAuthorMutation(
  baseOptions?: Apollo.MutationHookOptions<SaveDraftAuthorMutation, SaveDraftAuthorMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<SaveDraftAuthorMutation, SaveDraftAuthorMutationVariables>(
    SaveDraftAuthorDocument,
    options,
  );
}
export type SaveDraftAuthorMutationHookResult = ReturnType<typeof useSaveDraftAuthorMutation>;
export type SaveDraftAuthorMutationResult = Apollo.MutationResult<SaveDraftAuthorMutation>;
export type SaveDraftAuthorMutationOptions = Apollo.BaseMutationOptions<
  SaveDraftAuthorMutation,
  SaveDraftAuthorMutationVariables
>;
export const GetCollectionsDocument = gql`
  query getCollections($parentId: Int) {
    getCollections(parentId: $parentId) {
      name
      id
      path
      createTime
      updateTime
      description
    }
  }
`;

/**
 * __useGetCollectionsQuery__
 *
 * To run a query within a React component, call `useGetCollectionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCollectionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCollectionsQuery({
 *   variables: {
 *      parentId: // value for 'parentId'
 *   },
 * });
 */
export function useGetCollectionsQuery(
  baseOptions?: Apollo.QueryHookOptions<GetCollectionsQuery, GetCollectionsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetCollectionsQuery, GetCollectionsQueryVariables>(GetCollectionsDocument, options);
}
export function useGetCollectionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetCollectionsQuery, GetCollectionsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetCollectionsQuery, GetCollectionsQueryVariables>(GetCollectionsDocument, options);
}
export function useGetCollectionsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<GetCollectionsQuery, GetCollectionsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetCollectionsQuery, GetCollectionsQueryVariables>(GetCollectionsDocument, options);
}
export type GetCollectionsQueryHookResult = ReturnType<typeof useGetCollectionsQuery>;
export type GetCollectionsLazyQueryHookResult = ReturnType<typeof useGetCollectionsLazyQuery>;
export type GetCollectionsSuspenseQueryHookResult = ReturnType<typeof useGetCollectionsSuspenseQuery>;
export type GetCollectionsQueryResult = Apollo.QueryResult<GetCollectionsQuery, GetCollectionsQueryVariables>;
export const DeleteCollectionDocument = gql`
  mutation deleteCollection($id: Int!) {
    deleteCollection(id: $id) {
      path
    }
  }
`;
export type DeleteCollectionMutationFn = Apollo.MutationFunction<
  DeleteCollectionMutation,
  DeleteCollectionMutationVariables
>;

/**
 * __useDeleteCollectionMutation__
 *
 * To run a mutation, you first call `useDeleteCollectionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCollectionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCollectionMutation, { data, loading, error }] = useDeleteCollectionMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteCollectionMutation(
  baseOptions?: Apollo.MutationHookOptions<DeleteCollectionMutation, DeleteCollectionMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteCollectionMutation, DeleteCollectionMutationVariables>(
    DeleteCollectionDocument,
    options,
  );
}
export type DeleteCollectionMutationHookResult = ReturnType<typeof useDeleteCollectionMutation>;
export type DeleteCollectionMutationResult = Apollo.MutationResult<DeleteCollectionMutation>;
export type DeleteCollectionMutationOptions = Apollo.BaseMutationOptions<
  DeleteCollectionMutation,
  DeleteCollectionMutationVariables
>;
export const CreateCollectionDocument = gql`
  mutation createCollection($parentId: Int, $name: String!, $description: String) {
    createCollection(parentId: $parentId, name: $name, description: $description) {
      path
    }
  }
`;
export type CreateCollectionMutationFn = Apollo.MutationFunction<
  CreateCollectionMutation,
  CreateCollectionMutationVariables
>;

/**
 * __useCreateCollectionMutation__
 *
 * To run a mutation, you first call `useCreateCollectionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateCollectionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createCollectionMutation, { data, loading, error }] = useCreateCollectionMutation({
 *   variables: {
 *      parentId: // value for 'parentId'
 *      name: // value for 'name'
 *      description: // value for 'description'
 *   },
 * });
 */
export function useCreateCollectionMutation(
  baseOptions?: Apollo.MutationHookOptions<CreateCollectionMutation, CreateCollectionMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateCollectionMutation, CreateCollectionMutationVariables>(
    CreateCollectionDocument,
    options,
  );
}
export type CreateCollectionMutationHookResult = ReturnType<typeof useCreateCollectionMutation>;
export type CreateCollectionMutationResult = Apollo.MutationResult<CreateCollectionMutation>;
export type CreateCollectionMutationOptions = Apollo.BaseMutationOptions<
  CreateCollectionMutation,
  CreateCollectionMutationVariables
>;
export const GetCollectionAncestorsDocument = gql`
  query getCollectionAncestors($id: Int!) {
    getCollection(id: $id) {
      ancestors {
        id
        name
      }
      id
      name
    }
  }
`;

/**
 * __useGetCollectionAncestorsQuery__
 *
 * To run a query within a React component, call `useGetCollectionAncestorsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCollectionAncestorsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCollectionAncestorsQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetCollectionAncestorsQuery(
  baseOptions: Apollo.QueryHookOptions<GetCollectionAncestorsQuery, GetCollectionAncestorsQueryVariables> &
    ({ variables: GetCollectionAncestorsQueryVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetCollectionAncestorsQuery, GetCollectionAncestorsQueryVariables>(
    GetCollectionAncestorsDocument,
    options,
  );
}
export function useGetCollectionAncestorsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetCollectionAncestorsQuery, GetCollectionAncestorsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetCollectionAncestorsQuery, GetCollectionAncestorsQueryVariables>(
    GetCollectionAncestorsDocument,
    options,
  );
}
export function useGetCollectionAncestorsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<GetCollectionAncestorsQuery, GetCollectionAncestorsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetCollectionAncestorsQuery, GetCollectionAncestorsQueryVariables>(
    GetCollectionAncestorsDocument,
    options,
  );
}
export type GetCollectionAncestorsQueryHookResult = ReturnType<typeof useGetCollectionAncestorsQuery>;
export type GetCollectionAncestorsLazyQueryHookResult = ReturnType<typeof useGetCollectionAncestorsLazyQuery>;
export type GetCollectionAncestorsSuspenseQueryHookResult = ReturnType<typeof useGetCollectionAncestorsSuspenseQuery>;
export type GetCollectionAncestorsQueryResult = Apollo.QueryResult<
  GetCollectionAncestorsQuery,
  GetCollectionAncestorsQueryVariables
>;
export const GetNovelDocument = gql`
  query getNovel($id: Int!) {
    getNovel(id: $id) {
      id
      name
      avatar
      description
      createTime
      updateTime
      description
      novelStatus
      collection {
        id
        name
        path
        description
      }
      chapters {
        id
        title
        createTime
        updateTime
        content
        url
      }
      author {
        avatar
        description
        id
        name
        site
      }
    }
  }
`;

/**
 * __useGetNovelQuery__
 *
 * To run a query within a React component, call `useGetNovelQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNovelQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNovelQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetNovelQuery(
  baseOptions: Apollo.QueryHookOptions<GetNovelQuery, GetNovelQueryVariables> &
    ({ variables: GetNovelQueryVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetNovelQuery, GetNovelQueryVariables>(GetNovelDocument, options);
}
export function useGetNovelLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetNovelQuery, GetNovelQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetNovelQuery, GetNovelQueryVariables>(GetNovelDocument, options);
}
export function useGetNovelSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<GetNovelQuery, GetNovelQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetNovelQuery, GetNovelQueryVariables>(GetNovelDocument, options);
}
export type GetNovelQueryHookResult = ReturnType<typeof useGetNovelQuery>;
export type GetNovelLazyQueryHookResult = ReturnType<typeof useGetNovelLazyQuery>;
export type GetNovelSuspenseQueryHookResult = ReturnType<typeof useGetNovelSuspenseQuery>;
export type GetNovelQueryResult = Apollo.QueryResult<GetNovelQuery, GetNovelQueryVariables>;
export const FetchNovelDocument = gql`
  query fetchNovel($id: String!, $NovelSite: NovelSite!) {
    fetchNovel(id: $id, novelSite: $NovelSite) {
      ... on QdNovel {
        author {
          description
          image
          name
          url
        }
        chapters {
          title
          url
        }
        description
        image
        name
        url
      }
      ... on JjNovel {
        author {
          description
          image
          name
          url
        }
        chapters {
          title
          url
        }
        description
        image
        name
        url
      }
    }
  }
`;

/**
 * __useFetchNovelQuery__
 *
 * To run a query within a React component, call `useFetchNovelQuery` and pass it any options that fit your needs.
 * When your component renders, `useFetchNovelQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useFetchNovelQuery({
 *   variables: {
 *      id: // value for 'id'
 *      NovelSite: // value for 'NovelSite'
 *   },
 * });
 */
export function useFetchNovelQuery(
  baseOptions: Apollo.QueryHookOptions<FetchNovelQuery, FetchNovelQueryVariables> &
    ({ variables: FetchNovelQueryVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<FetchNovelQuery, FetchNovelQueryVariables>(FetchNovelDocument, options);
}
export function useFetchNovelLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<FetchNovelQuery, FetchNovelQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<FetchNovelQuery, FetchNovelQueryVariables>(FetchNovelDocument, options);
}
export function useFetchNovelSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<FetchNovelQuery, FetchNovelQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<FetchNovelQuery, FetchNovelQueryVariables>(FetchNovelDocument, options);
}
export type FetchNovelQueryHookResult = ReturnType<typeof useFetchNovelQuery>;
export type FetchNovelLazyQueryHookResult = ReturnType<typeof useFetchNovelLazyQuery>;
export type FetchNovelSuspenseQueryHookResult = ReturnType<typeof useFetchNovelSuspenseQuery>;
export type FetchNovelQueryResult = Apollo.QueryResult<FetchNovelQuery, FetchNovelQueryVariables>;
export const GetNovelsDocument = gql`
  query getNovels($collectionId: Int, $novelStatus: NovelStatus, $tagMatch: TagMatch) {
    queryNovels(collectionId: $collectionId, novelStatus: $novelStatus, tagMatch: $tagMatch) {
      id
      name
      description
      createTime
      updateTime
      description
      novelStatus
      avatar
    }
  }
`;

/**
 * __useGetNovelsQuery__
 *
 * To run a query within a React component, call `useGetNovelsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetNovelsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetNovelsQuery({
 *   variables: {
 *      collectionId: // value for 'collectionId'
 *      novelStatus: // value for 'novelStatus'
 *      tagMatch: // value for 'tagMatch'
 *   },
 * });
 */
export function useGetNovelsQuery(baseOptions?: Apollo.QueryHookOptions<GetNovelsQuery, GetNovelsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetNovelsQuery, GetNovelsQueryVariables>(GetNovelsDocument, options);
}
export function useGetNovelsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetNovelsQuery, GetNovelsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetNovelsQuery, GetNovelsQueryVariables>(GetNovelsDocument, options);
}
export function useGetNovelsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<GetNovelsQuery, GetNovelsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetNovelsQuery, GetNovelsQueryVariables>(GetNovelsDocument, options);
}
export type GetNovelsQueryHookResult = ReturnType<typeof useGetNovelsQuery>;
export type GetNovelsLazyQueryHookResult = ReturnType<typeof useGetNovelsLazyQuery>;
export type GetNovelsSuspenseQueryHookResult = ReturnType<typeof useGetNovelsSuspenseQuery>;
export type GetNovelsQueryResult = Apollo.QueryResult<GetNovelsQuery, GetNovelsQueryVariables>;
export const CreateNovelDocument = gql`
  mutation createNovel($data: CreateNovelInput!) {
    createNovel(data: $data) {
      id
    }
  }
`;
export type CreateNovelMutationFn = Apollo.MutationFunction<CreateNovelMutation, CreateNovelMutationVariables>;

/**
 * __useCreateNovelMutation__
 *
 * To run a mutation, you first call `useCreateNovelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateNovelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createNovelMutation, { data, loading, error }] = useCreateNovelMutation({
 *   variables: {
 *      data: // value for 'data'
 *   },
 * });
 */
export function useCreateNovelMutation(
  baseOptions?: Apollo.MutationHookOptions<CreateNovelMutation, CreateNovelMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateNovelMutation, CreateNovelMutationVariables>(CreateNovelDocument, options);
}
export type CreateNovelMutationHookResult = ReturnType<typeof useCreateNovelMutation>;
export type CreateNovelMutationResult = Apollo.MutationResult<CreateNovelMutation>;
export type CreateNovelMutationOptions = Apollo.BaseMutationOptions<CreateNovelMutation, CreateNovelMutationVariables>;
export const DeleteNovelDocument = gql`
  mutation deleteNovel($id: Int!) {
    deleteNovel(id: $id) {
      id
    }
  }
`;
export type DeleteNovelMutationFn = Apollo.MutationFunction<DeleteNovelMutation, DeleteNovelMutationVariables>;

/**
 * __useDeleteNovelMutation__
 *
 * To run a mutation, you first call `useDeleteNovelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteNovelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteNovelMutation, { data, loading, error }] = useDeleteNovelMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteNovelMutation(
  baseOptions?: Apollo.MutationHookOptions<DeleteNovelMutation, DeleteNovelMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteNovelMutation, DeleteNovelMutationVariables>(DeleteNovelDocument, options);
}
export type DeleteNovelMutationHookResult = ReturnType<typeof useDeleteNovelMutation>;
export type DeleteNovelMutationResult = Apollo.MutationResult<DeleteNovelMutation>;
export type DeleteNovelMutationOptions = Apollo.BaseMutationOptions<DeleteNovelMutation, DeleteNovelMutationVariables>;
export const CreateTagDocument = gql`
  mutation createTag($name: String!, $collectionId: Int) {
    createTag(name: $name, collectionId: $collectionId) {
      name
      id
    }
  }
`;
export type CreateTagMutationFn = Apollo.MutationFunction<CreateTagMutation, CreateTagMutationVariables>;

/**
 * __useCreateTagMutation__
 *
 * To run a mutation, you first call `useCreateTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createTagMutation, { data, loading, error }] = useCreateTagMutation({
 *   variables: {
 *      name: // value for 'name'
 *      collectionId: // value for 'collectionId'
 *   },
 * });
 */
export function useCreateTagMutation(
  baseOptions?: Apollo.MutationHookOptions<CreateTagMutation, CreateTagMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateTagMutation, CreateTagMutationVariables>(CreateTagDocument, options);
}
export type CreateTagMutationHookResult = ReturnType<typeof useCreateTagMutation>;
export type CreateTagMutationResult = Apollo.MutationResult<CreateTagMutation>;
export type CreateTagMutationOptions = Apollo.BaseMutationOptions<CreateTagMutation, CreateTagMutationVariables>;
export const GetTagsDocument = gql`
  query getTags($collectionId: Int) {
    queryTags(collectionId: $collectionId, deepSearch: false) {
      name
      id
      createTime
      updateTime
      collectionId
    }
  }
`;

/**
 * __useGetTagsQuery__
 *
 * To run a query within a React component, call `useGetTagsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetTagsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetTagsQuery({
 *   variables: {
 *      collectionId: // value for 'collectionId'
 *   },
 * });
 */
export function useGetTagsQuery(baseOptions?: Apollo.QueryHookOptions<GetTagsQuery, GetTagsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetTagsQuery, GetTagsQueryVariables>(GetTagsDocument, options);
}
export function useGetTagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTagsQuery, GetTagsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetTagsQuery, GetTagsQueryVariables>(GetTagsDocument, options);
}
export function useGetTagsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<GetTagsQuery, GetTagsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetTagsQuery, GetTagsQueryVariables>(GetTagsDocument, options);
}
export type GetTagsQueryHookResult = ReturnType<typeof useGetTagsQuery>;
export type GetTagsLazyQueryHookResult = ReturnType<typeof useGetTagsLazyQuery>;
export type GetTagsSuspenseQueryHookResult = ReturnType<typeof useGetTagsSuspenseQuery>;
export type GetTagsQueryResult = Apollo.QueryResult<GetTagsQuery, GetTagsQueryVariables>;
export const DeleteTagDocument = gql`
  mutation deleteTag($id: Int!) {
    deleteTag(id: $id) {
      id
    }
  }
`;
export type DeleteTagMutationFn = Apollo.MutationFunction<DeleteTagMutation, DeleteTagMutationVariables>;

/**
 * __useDeleteTagMutation__
 *
 * To run a mutation, you first call `useDeleteTagMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteTagMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteTagMutation, { data, loading, error }] = useDeleteTagMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteTagMutation(
  baseOptions?: Apollo.MutationHookOptions<DeleteTagMutation, DeleteTagMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteTagMutation, DeleteTagMutationVariables>(DeleteTagDocument, options);
}
export type DeleteTagMutationHookResult = ReturnType<typeof useDeleteTagMutation>;
export type DeleteTagMutationResult = Apollo.MutationResult<DeleteTagMutation>;
export type DeleteTagMutationOptions = Apollo.BaseMutationOptions<DeleteTagMutation, DeleteTagMutationVariables>;
