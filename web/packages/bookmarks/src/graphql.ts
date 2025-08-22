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
  BigDecimal: { input: any; output: any };
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
  url: Scalars['String']['output'];
};

export type AuthorList = {
  __typename?: 'AuthorList';
  data: Array<Author>;
  total: Scalars['Int']['output'];
};

export type Chapter = {
  __typename?: 'Chapter';
  author: Author;
  content?: Maybe<Scalars['String']['output']>;
  createTime: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  novel: Novel;
  novelId: Scalars['Int']['output'];
  site: NovelSite;
  siteId: Scalars['String']['output'];
  siteNovelId: Scalars['String']['output'];
  time: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
  wordCount: Scalars['Int']['output'];
};

export type Collection = {
  __typename?: 'Collection';
  ancestors: Array<Collection>;
  children: Array<Collection>;
  createTime: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['Int']['output']>;
  path: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
};

export type CollectionList = {
  __typename?: 'CollectionList';
  data: Array<Collection>;
  total: Scalars['Int']['output'];
};

export type CreateNovelInput = {
  authorId: Scalars['Int']['input'];
  avatar: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novelStatus: NovelStatus;
  site: NovelSite;
  siteId: Scalars['String']['input'];
  tags: Array<Scalars['Int']['input']>;
};

export type DraftAuthorInfo = {
  __typename?: 'DraftAuthorInfo';
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  novels: Array<DraftNovelInfo>;
  site: NovelSite;
  url: Scalars['String']['output'];
};

export type DraftChapterInfo = {
  __typename?: 'DraftChapterInfo';
  id: Scalars['String']['output'];
  novelId: Scalars['String']['output'];
  site: NovelSite;
  time: Scalars['DateTime']['output'];
  title: Scalars['String']['output'];
  url: Scalars['String']['output'];
  wordCount: Scalars['Int']['output'];
};

export type DraftNovelInfo = {
  __typename?: 'DraftNovelInfo';
  author: DraftAuthorInfo;
  chapters: Array<DraftChapterInfo>;
  description: Scalars['String']['output'];
  id: Scalars['String']['output'];
  image: Scalars['String']['output'];
  name: Scalars['String']['output'];
  site: NovelSite;
  status: NovelStatus;
  tags: Array<DraftTagInfo>;
  url: Scalars['String']['output'];
};

export type DraftTagInfo = {
  __typename?: 'DraftTagInfo';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  url: Scalars['String']['output'];
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  addCollectionForNovel: Novel;
  createAuthor: Author;
  createCollection: Collection;
  createNovel: Novel;
  createTag: Tag;
  deleteAuthor: Author;
  deleteCollection: Scalars['Int']['output'];
  deleteCollectionForNovel: Novel;
  deleteNovel: Novel;
  deleteTag: Tag;
  saveDraftAuthor: Author;
  updateAuthorByCrawler: Author;
  updateCollection: Collection;
  updateNovelByCrawler: Novel;
};

export type MutationRootAddCollectionForNovelArgs = {
  collectionId: Scalars['Int']['input'];
  novelId: Scalars['Int']['input'];
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
  name: Scalars['String']['input'];
  site: NovelSite;
  siteId: Scalars['String']['input'];
};

export type MutationRootDeleteAuthorArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootDeleteCollectionArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootDeleteCollectionForNovelArgs = {
  collectionId: Scalars['Int']['input'];
  novelId: Scalars['Int']['input'];
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

export type MutationRootUpdateAuthorByCrawlerArgs = {
  authorId: Scalars['Int']['input'];
};

export type MutationRootUpdateCollectionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationRootUpdateNovelByCrawlerArgs = {
  novelId: Scalars['Int']['input'];
};

export type Novel = {
  __typename?: 'Novel';
  author: Author;
  avatar: Scalars['String']['output'];
  chapters: Array<Chapter>;
  collections: Array<Collection>;
  createTime: Scalars['DateTime']['output'];
  description: Scalars['String']['output'];
  firstChapter?: Maybe<Chapter>;
  id: Scalars['Int']['output'];
  lastChapter?: Maybe<Chapter>;
  name: Scalars['String']['output'];
  novelStatus: NovelStatus;
  site: NovelSite;
  siteId: Scalars['String']['output'];
  tags: Array<Tag>;
  updateTime: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
  wordCount: Scalars['BigDecimal']['output'];
};

export type NovelList = {
  __typename?: 'NovelList';
  data: Array<Novel>;
  total: Scalars['Int']['output'];
};

export enum NovelSite {
  Jjwxc = 'JJWXC',
  Qidian = 'QIDIAN',
}

export enum NovelStatus {
  Completed = 'COMPLETED',
  Ongoing = 'ONGOING',
  Paused = 'PAUSED',
}

export type Pagination = {
  page?: Scalars['Int']['input'];
  pageSize?: Scalars['Int']['input'];
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  allCollections: Array<Collection>;
  fetchAuthor: DraftAuthorInfo;
  fetchNovel: DraftNovelInfo;
  getAuthor: Author;
  getCollection: Collection;
  getCollections: CollectionList;
  getNovel: Novel;
  queryAuthors: AuthorList;
  queryNovels: NovelList;
  queryTags: TagList;
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
  pagination: Pagination;
  parentId?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryRootGetNovelArgs = {
  id: Scalars['Int']['input'];
};

export type QueryRootQueryAuthorsArgs = {
  pagination: Pagination;
  searchName?: InputMaybe<Scalars['String']['input']>;
};

export type QueryRootQueryNovelsArgs = {
  collectionMatch?: InputMaybe<TagMatch>;
  novelStatus?: InputMaybe<NovelStatus>;
  pagination: Pagination;
  tagMatch?: InputMaybe<TagMatch>;
};

export type QueryRootQueryTagsArgs = {
  pagination: Pagination;
};

export type SaveChapterInfo = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
  time: Scalars['DateTime']['input'];
  wordCount: Scalars['Int']['input'];
};

export type SaveDraftAuthor = {
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
  image: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novels: Array<SaveNovelInfo>;
  site: NovelSite;
};

export type SaveNovelInfo = {
  chapters: Array<SaveChapterInfo>;
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
  image: Scalars['String']['input'];
  name: Scalars['String']['input'];
  novelStatus: NovelStatus;
  site: NovelSite;
  tags: Array<SaveTagInfo>;
};

export type SaveTagInfo = {
  id: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type Tag = {
  __typename?: 'Tag';
  createTime: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  site: NovelSite;
  siteId: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
  url: Scalars['String']['output'];
};

export type TagList = {
  __typename?: 'TagList';
  data: Array<Tag>;
  total: Scalars['Int']['output'];
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
  queryAuthors: {
    __typename?: 'AuthorList';
    data: Array<{ __typename?: 'Author'; id: number; name: string; description: string; avatar: string }>;
  };
};

export type AllowTagsQueryVariables = Exact<{ [key: string]: never }>;

export type AllowTagsQuery = {
  __typename?: 'QueryRoot';
  queryTags: { __typename?: 'TagList'; data: Array<{ __typename?: 'Tag'; id: number; name: string }> };
};

export type GetAuthorsQueryVariables = Exact<{
  pagination: Pagination;
}>;

export type GetAuthorsQuery = {
  __typename?: 'QueryRoot';
  queryAuthors: {
    __typename?: 'AuthorList';
    total: number;
    data: Array<{
      __typename?: 'Author';
      id: number;
      site: NovelSite;
      name: string;
      createTime: any;
      updateTime: any;
      avatar: string;
      description: string;
      url: string;
    }>;
  };
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
    url: string;
    novels: Array<{
      __typename?: 'Novel';
      id: number;
      name: string;
      avatar: string;
      createTime: any;
      updateTime: any;
      description: string;
      novelStatus: NovelStatus;
      url: string;
      wordCount: any;
      lastChapter?: { __typename?: 'Chapter'; time: any } | null;
      firstChapter?: { __typename?: 'Chapter'; time: any } | null;
    }>;
  };
};

export type FetchAuthorQueryVariables = Exact<{
  id: Scalars['String']['input'];
  novelSite: NovelSite;
}>;

export type FetchAuthorQuery = {
  __typename?: 'QueryRoot';
  fetchAuthor: {
    __typename: 'DraftAuthorInfo';
    name: string;
    description: string;
    image: string;
    url: string;
    id: string;
    site: NovelSite;
    novels: Array<{
      __typename?: 'DraftNovelInfo';
      id: string;
      name: string;
      description: string;
      image: string;
      url: string;
      status: NovelStatus;
      site: NovelSite;
      chapters: Array<{
        __typename?: 'DraftChapterInfo';
        id: string;
        novelId: string;
        title: string;
        url: string;
        time: any;
        wordCount: number;
        site: NovelSite;
      }>;
      tags: Array<{ __typename?: 'DraftTagInfo'; id: string; name: string; url: string }>;
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
    url: string;
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
  url: string;
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
    url: string;
  };
};

export type UpdateAuthorByCrawlerMutationVariables = Exact<{
  authorId: Scalars['Int']['input'];
}>;

export type UpdateAuthorByCrawlerMutation = {
  __typename?: 'MutationRoot';
  updateAuthorByCrawler: { __typename?: 'Author'; id: number };
};

export type GetCollectionsQueryVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']['input']>;
  pagination: Pagination;
}>;

export type GetCollectionsQuery = {
  __typename?: 'QueryRoot';
  getCollections: {
    __typename?: 'CollectionList';
    total: number;
    data: Array<{
      __typename?: 'Collection';
      name: string;
      id: number;
      path: string;
      createTime: any;
      updateTime: any;
      description?: string | null;
    }>;
  };
};

export type DeleteCollectionMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteCollectionMutation = { __typename?: 'MutationRoot'; deleteCollection: number };

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

export type AllCollectionsQueryVariables = Exact<{ [key: string]: never }>;

export type AllCollectionsQuery = {
  __typename?: 'QueryRoot';
  allCollections: Array<{
    __typename?: 'Collection';
    name: string;
    id: number;
    path: string;
    createTime: any;
    updateTime: any;
    description?: string | null;
    parentId?: number | null;
  }>;
};

export type UpdateCollectionMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
}>;

export type UpdateCollectionMutation = { __typename?: 'MutationRoot'; updateCollection: { __typename: 'Collection' } };

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
    url: string;
    wordCount: any;
    site: NovelSite;
    chapters: Array<{
      __typename?: 'Chapter';
      id: number;
      title: string;
      createTime: any;
      updateTime: any;
      url: string;
      wordCount: number;
      time: any;
    }>;
    author: { __typename?: 'Author'; avatar: string; description: string; id: number; name: string; site: NovelSite };
    lastChapter?: { __typename?: 'Chapter'; time: any } | null;
    firstChapter?: { __typename?: 'Chapter'; time: any } | null;
    tags: Array<{ __typename?: 'Tag'; url: string; name: string; id: number }>;
    collections: Array<{
      __typename?: 'Collection';
      name: string;
      id: number;
      description?: string | null;
      path: string;
    }>;
  };
};

export type FetchNovelQueryVariables = Exact<{
  id: Scalars['String']['input'];
  NovelSite: NovelSite;
}>;

export type FetchNovelQuery = {
  __typename?: 'QueryRoot';
  fetchNovel: {
    __typename?: 'DraftNovelInfo';
    description: string;
    image: string;
    name: string;
    url: string;
    site: NovelSite;
    author: { __typename?: 'DraftAuthorInfo'; description: string; image: string; name: string; url: string };
    chapters: Array<{
      __typename?: 'DraftChapterInfo';
      title: string;
      url: string;
      site: NovelSite;
      time: any;
      wordCount: number;
      id: string;
    }>;
  };
};

export type UpdateNovelByCrawlerMutationVariables = Exact<{
  novelId: Scalars['Int']['input'];
}>;

export type UpdateNovelByCrawlerMutation = {
  __typename?: 'MutationRoot';
  updateNovelByCrawler: { __typename?: 'Novel'; id: number };
};

export type AddCollectionForNovelMutationVariables = Exact<{
  novelId: Scalars['Int']['input'];
  collectionId: Scalars['Int']['input'];
}>;

export type AddCollectionForNovelMutation = {
  __typename?: 'MutationRoot';
  addCollectionForNovel: { __typename?: 'Novel'; id: number };
};

export type DeleteCollectionForNovelMutationVariables = Exact<{
  novelId: Scalars['Int']['input'];
  collectionId: Scalars['Int']['input'];
}>;

export type DeleteCollectionForNovelMutation = {
  __typename?: 'MutationRoot';
  deleteCollectionForNovel: { __typename?: 'Novel'; id: number };
};

export type GetNovelsQueryVariables = Exact<{
  collectionMatch?: InputMaybe<TagMatch>;
  novelStatus?: InputMaybe<NovelStatus>;
  tagMatch?: InputMaybe<TagMatch>;
  pagination: Pagination;
}>;

export type GetNovelsQuery = {
  __typename?: 'QueryRoot';
  queryNovels: {
    __typename?: 'NovelList';
    total: number;
    data: Array<{
      __typename?: 'Novel';
      id: number;
      name: string;
      description: string;
      createTime: any;
      updateTime: any;
      novelStatus: NovelStatus;
      avatar: string;
      site: NovelSite;
    }>;
  };
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
  site: NovelSite;
  siteId: Scalars['String']['input'];
}>;

export type CreateTagMutation = {
  __typename?: 'MutationRoot';
  createTag: { __typename?: 'Tag'; name: string; id: number };
};

export type GetTagsQueryVariables = Exact<{
  pagination: Pagination;
}>;

export type GetTagsQuery = {
  __typename?: 'QueryRoot';
  queryTags: {
    __typename?: 'TagList';
    total: number;
    data: Array<{
      __typename?: 'Tag';
      name: string;
      id: number;
      site: NovelSite;
      url: string;
      createTime: any;
      updateTime: any;
    }>;
  };
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
    url
  }
`;
export const SearchAuthorDocument = gql`
  query searchAuthor($searchName: String) {
    queryAuthors(searchName: $searchName, pagination: { page: 1, pageSize: 20 }) {
      data {
        id
        name
        description
        avatar
      }
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
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<SearchAuthorQuery, SearchAuthorQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<SearchAuthorQuery, SearchAuthorQueryVariables>(SearchAuthorDocument, options);
}
export type SearchAuthorQueryHookResult = ReturnType<typeof useSearchAuthorQuery>;
export type SearchAuthorLazyQueryHookResult = ReturnType<typeof useSearchAuthorLazyQuery>;
export type SearchAuthorSuspenseQueryHookResult = ReturnType<typeof useSearchAuthorSuspenseQuery>;
export type SearchAuthorQueryResult = Apollo.QueryResult<SearchAuthorQuery, SearchAuthorQueryVariables>;
export const AllowTagsDocument = gql`
  query allowTags {
    queryTags(pagination: { page: 1, pageSize: 20 }) {
      data {
        id
        name
      }
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
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AllowTagsQuery, AllowTagsQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<AllowTagsQuery, AllowTagsQueryVariables>(AllowTagsDocument, options);
}
export type AllowTagsQueryHookResult = ReturnType<typeof useAllowTagsQuery>;
export type AllowTagsLazyQueryHookResult = ReturnType<typeof useAllowTagsLazyQuery>;
export type AllowTagsSuspenseQueryHookResult = ReturnType<typeof useAllowTagsSuspenseQuery>;
export type AllowTagsQueryResult = Apollo.QueryResult<AllowTagsQuery, AllowTagsQueryVariables>;
export const GetAuthorsDocument = gql`
  query getAuthors($pagination: Pagination!) {
    queryAuthors(pagination: $pagination) {
      data {
        ...AuthorAll
      }
      total
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
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useGetAuthorsQuery(
  baseOptions: Apollo.QueryHookOptions<GetAuthorsQuery, GetAuthorsQueryVariables> &
    ({ variables: GetAuthorsQueryVariables; skip?: boolean } | { skip: boolean }),
) {
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
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAuthorsQuery, GetAuthorsQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
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
        url
        lastChapter {
          time
        }
        firstChapter {
          time
        }
        wordCount
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
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetAuthorQuery, GetAuthorQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
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
      name
      description
      image
      url
      id
      site
      novels {
        id
        name
        description
        image
        url
        status
        site
        chapters {
          id
          novelId
          title
          url
          time
          wordCount
          site
        }
        tags {
          id
          name
          url
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
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchAuthorQuery, FetchAuthorQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
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
export const UpdateAuthorByCrawlerDocument = gql`
  mutation updateAuthorByCrawler($authorId: Int!) {
    updateAuthorByCrawler(authorId: $authorId) {
      id
    }
  }
`;
export type UpdateAuthorByCrawlerMutationFn = Apollo.MutationFunction<
  UpdateAuthorByCrawlerMutation,
  UpdateAuthorByCrawlerMutationVariables
>;

/**
 * __useUpdateAuthorByCrawlerMutation__
 *
 * To run a mutation, you first call `useUpdateAuthorByCrawlerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateAuthorByCrawlerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateAuthorByCrawlerMutation, { data, loading, error }] = useUpdateAuthorByCrawlerMutation({
 *   variables: {
 *      authorId: // value for 'authorId'
 *   },
 * });
 */
export function useUpdateAuthorByCrawlerMutation(
  baseOptions?: Apollo.MutationHookOptions<UpdateAuthorByCrawlerMutation, UpdateAuthorByCrawlerMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateAuthorByCrawlerMutation, UpdateAuthorByCrawlerMutationVariables>(
    UpdateAuthorByCrawlerDocument,
    options,
  );
}
export type UpdateAuthorByCrawlerMutationHookResult = ReturnType<typeof useUpdateAuthorByCrawlerMutation>;
export type UpdateAuthorByCrawlerMutationResult = Apollo.MutationResult<UpdateAuthorByCrawlerMutation>;
export type UpdateAuthorByCrawlerMutationOptions = Apollo.BaseMutationOptions<
  UpdateAuthorByCrawlerMutation,
  UpdateAuthorByCrawlerMutationVariables
>;
export const GetCollectionsDocument = gql`
  query getCollections($parentId: Int, $pagination: Pagination!) {
    getCollections(parentId: $parentId, pagination: $pagination) {
      data {
        name
        id
        path
        createTime
        updateTime
        description
      }
      total
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
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useGetCollectionsQuery(
  baseOptions: Apollo.QueryHookOptions<GetCollectionsQuery, GetCollectionsQueryVariables> &
    ({ variables: GetCollectionsQueryVariables; skip?: boolean } | { skip: boolean }),
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
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetCollectionsQuery, GetCollectionsQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetCollectionsQuery, GetCollectionsQueryVariables>(GetCollectionsDocument, options);
}
export type GetCollectionsQueryHookResult = ReturnType<typeof useGetCollectionsQuery>;
export type GetCollectionsLazyQueryHookResult = ReturnType<typeof useGetCollectionsLazyQuery>;
export type GetCollectionsSuspenseQueryHookResult = ReturnType<typeof useGetCollectionsSuspenseQuery>;
export type GetCollectionsQueryResult = Apollo.QueryResult<GetCollectionsQuery, GetCollectionsQueryVariables>;
export const DeleteCollectionDocument = gql`
  mutation deleteCollection($id: Int!) {
    deleteCollection(id: $id)
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
  baseOptions?:
    | Apollo.SkipToken
    | Apollo.SuspenseQueryHookOptions<GetCollectionAncestorsQuery, GetCollectionAncestorsQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
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
export const AllCollectionsDocument = gql`
  query allCollections {
    allCollections {
      name
      id
      path
      createTime
      updateTime
      description
      parentId
    }
  }
`;

/**
 * __useAllCollectionsQuery__
 *
 * To run a query within a React component, call `useAllCollectionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useAllCollectionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useAllCollectionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useAllCollectionsQuery(
  baseOptions?: Apollo.QueryHookOptions<AllCollectionsQuery, AllCollectionsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<AllCollectionsQuery, AllCollectionsQueryVariables>(AllCollectionsDocument, options);
}
export function useAllCollectionsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<AllCollectionsQuery, AllCollectionsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<AllCollectionsQuery, AllCollectionsQueryVariables>(AllCollectionsDocument, options);
}
export function useAllCollectionsSuspenseQuery(
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<AllCollectionsQuery, AllCollectionsQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<AllCollectionsQuery, AllCollectionsQueryVariables>(AllCollectionsDocument, options);
}
export type AllCollectionsQueryHookResult = ReturnType<typeof useAllCollectionsQuery>;
export type AllCollectionsLazyQueryHookResult = ReturnType<typeof useAllCollectionsLazyQuery>;
export type AllCollectionsSuspenseQueryHookResult = ReturnType<typeof useAllCollectionsSuspenseQuery>;
export type AllCollectionsQueryResult = Apollo.QueryResult<AllCollectionsQuery, AllCollectionsQueryVariables>;
export const UpdateCollectionDocument = gql`
  mutation updateCollection($id: Int!, $name: String!, $parentId: Int, $description: String) {
    updateCollection(id: $id, name: $name, parentId: $parentId, description: $description) {
      __typename
    }
  }
`;
export type UpdateCollectionMutationFn = Apollo.MutationFunction<
  UpdateCollectionMutation,
  UpdateCollectionMutationVariables
>;

/**
 * __useUpdateCollectionMutation__
 *
 * To run a mutation, you first call `useUpdateCollectionMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateCollectionMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateCollectionMutation, { data, loading, error }] = useUpdateCollectionMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *      parentId: // value for 'parentId'
 *      description: // value for 'description'
 *   },
 * });
 */
export function useUpdateCollectionMutation(
  baseOptions?: Apollo.MutationHookOptions<UpdateCollectionMutation, UpdateCollectionMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateCollectionMutation, UpdateCollectionMutationVariables>(
    UpdateCollectionDocument,
    options,
  );
}
export type UpdateCollectionMutationHookResult = ReturnType<typeof useUpdateCollectionMutation>;
export type UpdateCollectionMutationResult = Apollo.MutationResult<UpdateCollectionMutation>;
export type UpdateCollectionMutationOptions = Apollo.BaseMutationOptions<
  UpdateCollectionMutation,
  UpdateCollectionMutationVariables
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
      url
      chapters {
        id
        title
        createTime
        updateTime
        url
        wordCount
        time
      }
      author {
        avatar
        description
        id
        name
        site
      }
      lastChapter {
        time
      }
      firstChapter {
        time
      }
      wordCount
      tags {
        url
        name
        id
      }
      site
      collections {
        name
        id
        description
        path
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
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetNovelQuery, GetNovelQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<GetNovelQuery, GetNovelQueryVariables>(GetNovelDocument, options);
}
export type GetNovelQueryHookResult = ReturnType<typeof useGetNovelQuery>;
export type GetNovelLazyQueryHookResult = ReturnType<typeof useGetNovelLazyQuery>;
export type GetNovelSuspenseQueryHookResult = ReturnType<typeof useGetNovelSuspenseQuery>;
export type GetNovelQueryResult = Apollo.QueryResult<GetNovelQuery, GetNovelQueryVariables>;
export const FetchNovelDocument = gql`
  query fetchNovel($id: String!, $NovelSite: NovelSite!) {
    fetchNovel(id: $id, novelSite: $NovelSite) {
      author {
        description
        image
        name
        url
      }
      chapters {
        title
        url
        site
        time
        wordCount
        id
      }
      description
      image
      name
      url
      site
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
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<FetchNovelQuery, FetchNovelQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
  return Apollo.useSuspenseQuery<FetchNovelQuery, FetchNovelQueryVariables>(FetchNovelDocument, options);
}
export type FetchNovelQueryHookResult = ReturnType<typeof useFetchNovelQuery>;
export type FetchNovelLazyQueryHookResult = ReturnType<typeof useFetchNovelLazyQuery>;
export type FetchNovelSuspenseQueryHookResult = ReturnType<typeof useFetchNovelSuspenseQuery>;
export type FetchNovelQueryResult = Apollo.QueryResult<FetchNovelQuery, FetchNovelQueryVariables>;
export const UpdateNovelByCrawlerDocument = gql`
  mutation updateNovelByCrawler($novelId: Int!) {
    updateNovelByCrawler(novelId: $novelId) {
      id
    }
  }
`;
export type UpdateNovelByCrawlerMutationFn = Apollo.MutationFunction<
  UpdateNovelByCrawlerMutation,
  UpdateNovelByCrawlerMutationVariables
>;

/**
 * __useUpdateNovelByCrawlerMutation__
 *
 * To run a mutation, you first call `useUpdateNovelByCrawlerMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateNovelByCrawlerMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateNovelByCrawlerMutation, { data, loading, error }] = useUpdateNovelByCrawlerMutation({
 *   variables: {
 *      novelId: // value for 'novelId'
 *   },
 * });
 */
export function useUpdateNovelByCrawlerMutation(
  baseOptions?: Apollo.MutationHookOptions<UpdateNovelByCrawlerMutation, UpdateNovelByCrawlerMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateNovelByCrawlerMutation, UpdateNovelByCrawlerMutationVariables>(
    UpdateNovelByCrawlerDocument,
    options,
  );
}
export type UpdateNovelByCrawlerMutationHookResult = ReturnType<typeof useUpdateNovelByCrawlerMutation>;
export type UpdateNovelByCrawlerMutationResult = Apollo.MutationResult<UpdateNovelByCrawlerMutation>;
export type UpdateNovelByCrawlerMutationOptions = Apollo.BaseMutationOptions<
  UpdateNovelByCrawlerMutation,
  UpdateNovelByCrawlerMutationVariables
>;
export const AddCollectionForNovelDocument = gql`
  mutation addCollectionForNovel($novelId: Int!, $collectionId: Int!) {
    addCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {
      id
    }
  }
`;
export type AddCollectionForNovelMutationFn = Apollo.MutationFunction<
  AddCollectionForNovelMutation,
  AddCollectionForNovelMutationVariables
>;

/**
 * __useAddCollectionForNovelMutation__
 *
 * To run a mutation, you first call `useAddCollectionForNovelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useAddCollectionForNovelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [addCollectionForNovelMutation, { data, loading, error }] = useAddCollectionForNovelMutation({
 *   variables: {
 *      novelId: // value for 'novelId'
 *      collectionId: // value for 'collectionId'
 *   },
 * });
 */
export function useAddCollectionForNovelMutation(
  baseOptions?: Apollo.MutationHookOptions<AddCollectionForNovelMutation, AddCollectionForNovelMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<AddCollectionForNovelMutation, AddCollectionForNovelMutationVariables>(
    AddCollectionForNovelDocument,
    options,
  );
}
export type AddCollectionForNovelMutationHookResult = ReturnType<typeof useAddCollectionForNovelMutation>;
export type AddCollectionForNovelMutationResult = Apollo.MutationResult<AddCollectionForNovelMutation>;
export type AddCollectionForNovelMutationOptions = Apollo.BaseMutationOptions<
  AddCollectionForNovelMutation,
  AddCollectionForNovelMutationVariables
>;
export const DeleteCollectionForNovelDocument = gql`
  mutation deleteCollectionForNovel($novelId: Int!, $collectionId: Int!) {
    deleteCollectionForNovel(collectionId: $collectionId, novelId: $novelId) {
      id
    }
  }
`;
export type DeleteCollectionForNovelMutationFn = Apollo.MutationFunction<
  DeleteCollectionForNovelMutation,
  DeleteCollectionForNovelMutationVariables
>;

/**
 * __useDeleteCollectionForNovelMutation__
 *
 * To run a mutation, you first call `useDeleteCollectionForNovelMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteCollectionForNovelMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteCollectionForNovelMutation, { data, loading, error }] = useDeleteCollectionForNovelMutation({
 *   variables: {
 *      novelId: // value for 'novelId'
 *      collectionId: // value for 'collectionId'
 *   },
 * });
 */
export function useDeleteCollectionForNovelMutation(
  baseOptions?: Apollo.MutationHookOptions<DeleteCollectionForNovelMutation, DeleteCollectionForNovelMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteCollectionForNovelMutation, DeleteCollectionForNovelMutationVariables>(
    DeleteCollectionForNovelDocument,
    options,
  );
}
export type DeleteCollectionForNovelMutationHookResult = ReturnType<typeof useDeleteCollectionForNovelMutation>;
export type DeleteCollectionForNovelMutationResult = Apollo.MutationResult<DeleteCollectionForNovelMutation>;
export type DeleteCollectionForNovelMutationOptions = Apollo.BaseMutationOptions<
  DeleteCollectionForNovelMutation,
  DeleteCollectionForNovelMutationVariables
>;
export const GetNovelsDocument = gql`
  query getNovels(
    $collectionMatch: TagMatch
    $novelStatus: NovelStatus
    $tagMatch: TagMatch
    $pagination: Pagination!
  ) {
    queryNovels(
      collectionMatch: $collectionMatch
      novelStatus: $novelStatus
      tagMatch: $tagMatch
      pagination: $pagination
    ) {
      data {
        id
        name
        description
        createTime
        updateTime
        description
        novelStatus
        avatar
        site
      }
      total
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
 *      collectionMatch: // value for 'collectionMatch'
 *      novelStatus: // value for 'novelStatus'
 *      tagMatch: // value for 'tagMatch'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useGetNovelsQuery(
  baseOptions: Apollo.QueryHookOptions<GetNovelsQuery, GetNovelsQueryVariables> &
    ({ variables: GetNovelsQueryVariables; skip?: boolean } | { skip: boolean }),
) {
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
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetNovelsQuery, GetNovelsQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
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
  mutation createTag($name: String!, $site: NovelSite!, $siteId: String!) {
    createTag(name: $name, site: $site, siteId: $siteId) {
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
 *      site: // value for 'site'
 *      siteId: // value for 'siteId'
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
  query getTags($pagination: Pagination!) {
    queryTags(pagination: $pagination) {
      data {
        name
        id
        site
        url
        createTime
        updateTime
      }
      total
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
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useGetTagsQuery(
  baseOptions: Apollo.QueryHookOptions<GetTagsQuery, GetTagsQueryVariables> &
    ({ variables: GetTagsQueryVariables; skip?: boolean } | { skip: boolean }),
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetTagsQuery, GetTagsQueryVariables>(GetTagsDocument, options);
}
export function useGetTagsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetTagsQuery, GetTagsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetTagsQuery, GetTagsQueryVariables>(GetTagsDocument, options);
}
export function useGetTagsSuspenseQuery(
  baseOptions?: Apollo.SkipToken | Apollo.SuspenseQueryHookOptions<GetTagsQuery, GetTagsQueryVariables>,
) {
  const options = baseOptions === Apollo.skipToken ? baseOptions : { ...defaultOptions, ...baseOptions };
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
