import { gql } from '@apollo/client';
import * as Apollo from '@apollo/client';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
const defaultOptions = {} as const;
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
};

export type Author = {
  __typename?: 'Author';
  avatar: Scalars['String'];
  createTime: Scalars['Int'];
  description: Scalars['String'];
  id: Scalars['Int'];
  name: Scalars['String'];
  updateTime: Scalars['Int'];
  url: Scalars['String'];
};

export type Collection = {
  __typename?: 'Collection';
  /** 获取祖先列表 */
  ancestors: Array<Collection>;
  /** 获取子列表 */
  children: Array<Collection>;
  createTime: Scalars['Int'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['Int'];
  name: Scalars['String'];
  parentId?: Maybe<Scalars['Int']>;
  path: Scalars['String'];
  updateTime: Scalars['Int'];
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  /** 创建作者 */
  createAuthor: Author;
  /** 创建目录 */
  createCollection: Collection;
  /** 创建标签 */
  createTag: Tag;
  /** 删除作者 */
  deleteAuthor: Author;
  /** 删除目录 */
  deleteCollection: Collection;
  /** 删除标签 */
  deleteTag: Tag;
};

export type MutationRootCreateAuthorArgs = {
  avatar: Scalars['String'];
  description: Scalars['String'];
  name: Scalars['String'];
  url: Scalars['String'];
};

export type MutationRootCreateCollectionArgs = {
  description?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  parentId?: InputMaybe<Scalars['Int']>;
};

export type MutationRootCreateTagArgs = {
  collectionId?: InputMaybe<Scalars['Int']>;
  name: Scalars['String'];
};

export type MutationRootDeleteAuthorArgs = {
  id: Scalars['Int'];
};

export type MutationRootDeleteCollectionArgs = {
  id: Scalars['Int'];
};

export type MutationRootDeleteTagArgs = {
  id: Scalars['Int'];
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** 获取作者列表 */
  getAuthorList: Array<Author>;
  /** 获取目录详情 */
  getCollection: Collection;
  /** 获取目录列表 */
  getCollectionList: Array<Collection>;
  /** 获取标签列表 */
  getTagList: Array<Tag>;
};

export type QueryRootGetCollectionArgs = {
  id: Scalars['Int'];
};

export type QueryRootGetCollectionListArgs = {
  parentId?: InputMaybe<Scalars['Int']>;
};

export type QueryRootGetTagListArgs = {
  collectionId?: InputMaybe<Scalars['Int']>;
};

export type Tag = {
  __typename?: 'Tag';
  collectionId?: Maybe<Scalars['Int']>;
  createTime: Scalars['Int'];
  id: Scalars['Int'];
  name: Scalars['String'];
  updateTime: Scalars['Int'];
};

export type GetCollectionSelectQueryVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']>;
}>;

export type GetCollectionSelectQuery = {
  __typename?: 'QueryRoot';
  getCollectionList: Array<{ __typename?: 'Collection'; name: string; id: number }>;
};

export type GetCollectionListQueryVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']>;
}>;

export type GetCollectionListQuery = {
  __typename?: 'QueryRoot';
  getCollectionList: Array<{
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
  id: Scalars['Int'];
}>;

export type DeleteCollectionMutation = {
  __typename?: 'MutationRoot';
  deleteCollection: { __typename?: 'Collection'; path: string };
};

export type CreateCollectionMutationVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']>;
  name: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
}>;

export type CreateCollectionMutation = {
  __typename?: 'MutationRoot';
  createCollection: { __typename?: 'Collection'; path: string };
};

export type GetCollectionAncestorsQueryVariables = Exact<{
  id: Scalars['Int'];
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

export type CreateTagMutationVariables = Exact<{
  name: Scalars['String'];
  collectionId?: InputMaybe<Scalars['Int']>;
}>;

export type CreateTagMutation = {
  __typename?: 'MutationRoot';
  createTag: { __typename?: 'Tag'; name: string; id: number };
};

export type GetTagsQueryVariables = Exact<{
  collectionId?: InputMaybe<Scalars['Int']>;
}>;

export type GetTagsQuery = {
  __typename?: 'QueryRoot';
  getTagList: Array<{
    __typename?: 'Tag';
    name: string;
    id: number;
    createTime: number;
    updateTime: number;
    collectionId?: number | null;
  }>;
};

export const GetCollectionSelectDocument = gql`
  query getCollectionSelect($parentId: Int) {
    getCollectionList(parentId: $parentId) {
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
export type GetCollectionSelectQueryHookResult = ReturnType<typeof useGetCollectionSelectQuery>;
export type GetCollectionSelectLazyQueryHookResult = ReturnType<typeof useGetCollectionSelectLazyQuery>;
export type GetCollectionSelectQueryResult = Apollo.QueryResult<
  GetCollectionSelectQuery,
  GetCollectionSelectQueryVariables
>;
export const GetCollectionListDocument = gql`
  query getCollectionList($parentId: Int) {
    getCollectionList(parentId: $parentId) {
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
 * __useGetCollectionListQuery__
 *
 * To run a query within a React component, call `useGetCollectionListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetCollectionListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetCollectionListQuery({
 *   variables: {
 *      parentId: // value for 'parentId'
 *   },
 * });
 */
export function useGetCollectionListQuery(
  baseOptions?: Apollo.QueryHookOptions<GetCollectionListQuery, GetCollectionListQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetCollectionListQuery, GetCollectionListQueryVariables>(GetCollectionListDocument, options);
}
export function useGetCollectionListLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetCollectionListQuery, GetCollectionListQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetCollectionListQuery, GetCollectionListQueryVariables>(
    GetCollectionListDocument,
    options,
  );
}
export type GetCollectionListQueryHookResult = ReturnType<typeof useGetCollectionListQuery>;
export type GetCollectionListLazyQueryHookResult = ReturnType<typeof useGetCollectionListLazyQuery>;
export type GetCollectionListQueryResult = Apollo.QueryResult<GetCollectionListQuery, GetCollectionListQueryVariables>;
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
export type GetCollectionAncestorsQueryHookResult = ReturnType<typeof useGetCollectionAncestorsQuery>;
export type GetCollectionAncestorsLazyQueryHookResult = ReturnType<typeof useGetCollectionAncestorsLazyQuery>;
export type GetCollectionAncestorsQueryResult = Apollo.QueryResult<
  GetCollectionAncestorsQuery,
  GetCollectionAncestorsQueryVariables
>;
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
    getTagList(collectionId: $collectionId) {
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
export type GetTagsQueryHookResult = ReturnType<typeof useGetTagsQuery>;
export type GetTagsLazyQueryHookResult = ReturnType<typeof useGetTagsLazyQuery>;
export type GetTagsQueryResult = Apollo.QueryResult<GetTagsQuery, GetTagsQueryVariables>;
