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
};

export type Author = {
  __typename?: 'Author';
  avatar: Scalars['String']['output'];
  createTime: Scalars['Int']['output'];
  description: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  updateTime: Scalars['Int']['output'];
  url: Scalars['String']['output'];
};

export type Collection = {
  __typename?: 'Collection';
  /** 获取祖先列表 */
  ancestors: Array<Collection>;
  /** 获取子列表 */
  children: Array<Collection>;
  createTime: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['Int']['output']>;
  path: Scalars['String']['output'];
  updateTime: Scalars['Int']['output'];
};

export type CreateNovelInput = {
  authorId: Scalars['Int']['input'];
  collectionId?: InputMaybe<Scalars['Int']['input']>;
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  tags: Array<Scalars['Int']['input']>;
  url: Scalars['String']['input'];
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
};

export type MutationRootCreateAuthorArgs = {
  avatar: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  url: Scalars['String']['input'];
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

export type Novel = {
  __typename?: 'Novel';
  author: Author;
  collection?: Maybe<Collection>;
  createTime: Scalars['Int']['output'];
  description: Scalars['String']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  status: ReadStatus;
  tags: Array<Tag>;
  updateTime: Scalars['Int']['output'];
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
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
  readStatus?: InputMaybe<ReadStatus>;
  tagMatch?: InputMaybe<TagMatch>;
};

export type QueryRootQueryTagsArgs = {
  collectionId?: InputMaybe<Scalars['Int']['input']>;
  deepSearch?: InputMaybe<Scalars['Boolean']['input']>;
};

export enum ReadStatus {
  Read = 'READ',
  Reading = 'READING',
  Unread = 'UNREAD',
}

export type Tag = {
  __typename?: 'Tag';
  collectionId?: Maybe<Scalars['Int']['output']>;
  createTime: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  updateTime: Scalars['Int']['output'];
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
    url: string;
    name: string;
    createTime: number;
    updateTime: number;
    avatar: string;
    description: string;
  }>;
};

export type DeleteAuthorMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteAuthorMutation = { __typename?: 'MutationRoot'; deleteAuthor: { __typename?: 'Author'; id: number } };

export type CreateAuthorMutationVariables = Exact<{
  avatar: Scalars['String']['input'];
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
  url: Scalars['String']['input'];
}>;

export type CreateAuthorMutation = {
  __typename?: 'MutationRoot';
  createAuthor: {
    __typename?: 'Author';
    id: number;
    url: string;
    name: string;
    createTime: number;
    updateTime: number;
    avatar: string;
    description: string;
  };
};

export type AuthorAllFragment = {
  __typename?: 'Author';
  id: number;
  url: string;
  name: string;
  createTime: number;
  updateTime: number;
  avatar: string;
  description: string;
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
    createTime: number;
    updateTime: number;
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

export type GetNovelsQueryVariables = Exact<{
  collectionId?: InputMaybe<Scalars['Int']['input']>;
  readStatus?: InputMaybe<ReadStatus>;
  tagMatch?: InputMaybe<TagMatch>;
}>;

export type GetNovelsQuery = {
  __typename?: 'QueryRoot';
  queryNovels: Array<{
    __typename?: 'Novel';
    id: number;
    name: string;
    description: string;
    createTime: number;
    updateTime: number;
    status: ReadStatus;
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
    createTime: number;
    updateTime: number;
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
    url
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
  mutation createAuthor($avatar: String!, $description: String!, $name: String!, $url: String!) {
    createAuthor(avatar: $avatar, description: $description, name: $name, url: $url) {
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
 *      url: // value for 'url'
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
  baseOptions: Apollo.QueryHookOptions<GetCollectionAncestorsQuery, GetCollectionAncestorsQueryVariables>,
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
export const GetNovelsDocument = gql`
  query getNovels($collectionId: Int, $readStatus: ReadStatus, $tagMatch: TagMatch) {
    queryNovels(collectionId: $collectionId, readStatus: $readStatus, tagMatch: $tagMatch) {
      id
      name
      description
      createTime
      updateTime
      description
      status
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
 *      readStatus: // value for 'readStatus'
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
