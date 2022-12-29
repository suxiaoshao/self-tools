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
  /**
   * A datetime with timezone offset.
   *
   * The input is a string in RFC3339 format, e.g. "2022-01-12T04:00:19.12345Z"
   * or "2022-01-12T04:00:19+03:00". The output is also a string in RFC3339
   * format, but it is always normalized to the UTC (Z) offset, e.g.
   * "2022-01-12T04:00:19.12345Z".
   */
  DateTime: string;
};

export type Collection = {
  __typename?: 'Collection';
  /** 获取祖先列表 */
  ancestors: Array<Collection>;
  /** 获取子列表 */
  children: Array<Collection>;
  createTime: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  id: Scalars['Int'];
  name: Scalars['String'];
  parentId?: Maybe<Scalars['Int']>;
  path: Scalars['String'];
  updateTime: Scalars['DateTime'];
};

export type Item = {
  __typename?: 'Item';
  collection?: Maybe<Collection>;
  content: Scalars['String'];
  createTime: Scalars['DateTime'];
  id: Scalars['Int'];
  name: Scalars['String'];
  updateTime: Scalars['DateTime'];
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  /** 创建目录 */
  createCollection: Collection;
  /** 创建小说 */
  createItem: Item;
  /** 删除目录 */
  deleteCollection: Collection;
  /** 删除小说 */
  deleteItem: Item;
};

export type MutationRootCreateCollectionArgs = {
  description?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  parentId?: InputMaybe<Scalars['Int']>;
};

export type MutationRootCreateItemArgs = {
  collectionId: Scalars['Int'];
  content: Scalars['String'];
  name: Scalars['String'];
};

export type MutationRootDeleteCollectionArgs = {
  id: Scalars['Int'];
};

export type MutationRootDeleteItemArgs = {
  id: Scalars['Int'];
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** 获取目录详情 */
  getCollection: Collection;
  /** 获取目录列表 */
  getCollections: Array<Collection>;
  /** 获取记录详情 */
  getItem: Item;
  /** 获记录列表 */
  queryItems: Array<Item>;
};

export type QueryRootGetCollectionArgs = {
  id: Scalars['Int'];
};

export type QueryRootGetCollectionsArgs = {
  parentId?: InputMaybe<Scalars['Int']>;
};

export type QueryRootGetItemArgs = {
  id: Scalars['Int'];
};

export type QueryRootQueryItemsArgs = {
  collectionId: Scalars['Int'];
};

export type GetCollectionSelectQueryVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']>;
}>;

export type GetCollectionSelectQuery = {
  __typename?: 'QueryRoot';
  getCollections: Array<{ __typename?: 'Collection'; name: string; id: number }>;
};

export type GetCollectionsQueryVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']>;
}>;

export type GetCollectionsQuery = {
  __typename?: 'QueryRoot';
  getCollections: Array<{
    __typename?: 'Collection';
    name: string;
    id: number;
    path: string;
    createTime: string;
    updateTime: string;
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

export type GetItemsQueryVariables = Exact<{
  collectionId: Scalars['Int'];
}>;

export type GetItemsQuery = {
  __typename?: 'QueryRoot';
  queryItems: Array<{
    __typename?: 'Item';
    name: string;
    id: number;
    updateTime: string;
    createTime: string;
    content: string;
  }>;
};

export type DeleteItemMutationVariables = Exact<{
  id: Scalars['Int'];
}>;

export type DeleteItemMutation = { __typename?: 'MutationRoot'; deleteItem: { __typename?: 'Item'; name: string } };

export type CreateItemMutationVariables = Exact<{
  collectionId: Scalars['Int'];
  name: Scalars['String'];
  content: Scalars['String'];
}>;

export type CreateItemMutation = { __typename?: 'MutationRoot'; createItem: { __typename?: 'Item'; name: string } };

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
export type GetCollectionSelectQueryHookResult = ReturnType<typeof useGetCollectionSelectQuery>;
export type GetCollectionSelectLazyQueryHookResult = ReturnType<typeof useGetCollectionSelectLazyQuery>;
export type GetCollectionSelectQueryResult = Apollo.QueryResult<
  GetCollectionSelectQuery,
  GetCollectionSelectQueryVariables
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
export type GetCollectionsQueryHookResult = ReturnType<typeof useGetCollectionsQuery>;
export type GetCollectionsLazyQueryHookResult = ReturnType<typeof useGetCollectionsLazyQuery>;
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
export type GetCollectionAncestorsQueryHookResult = ReturnType<typeof useGetCollectionAncestorsQuery>;
export type GetCollectionAncestorsLazyQueryHookResult = ReturnType<typeof useGetCollectionAncestorsLazyQuery>;
export type GetCollectionAncestorsQueryResult = Apollo.QueryResult<
  GetCollectionAncestorsQuery,
  GetCollectionAncestorsQueryVariables
>;
export const GetItemsDocument = gql`
  query getItems($collectionId: Int!) {
    queryItems(collectionId: $collectionId) {
      name
      id
      updateTime
      createTime
      content
    }
  }
`;

/**
 * __useGetItemsQuery__
 *
 * To run a query within a React component, call `useGetItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetItemsQuery({
 *   variables: {
 *      collectionId: // value for 'collectionId'
 *   },
 * });
 */
export function useGetItemsQuery(baseOptions: Apollo.QueryHookOptions<GetItemsQuery, GetItemsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetItemsQuery, GetItemsQueryVariables>(GetItemsDocument, options);
}
export function useGetItemsLazyQuery(baseOptions?: Apollo.LazyQueryHookOptions<GetItemsQuery, GetItemsQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetItemsQuery, GetItemsQueryVariables>(GetItemsDocument, options);
}
export type GetItemsQueryHookResult = ReturnType<typeof useGetItemsQuery>;
export type GetItemsLazyQueryHookResult = ReturnType<typeof useGetItemsLazyQuery>;
export type GetItemsQueryResult = Apollo.QueryResult<GetItemsQuery, GetItemsQueryVariables>;
export const DeleteItemDocument = gql`
  mutation deleteItem($id: Int!) {
    deleteItem(id: $id) {
      name
    }
  }
`;
export type DeleteItemMutationFn = Apollo.MutationFunction<DeleteItemMutation, DeleteItemMutationVariables>;

/**
 * __useDeleteItemMutation__
 *
 * To run a mutation, you first call `useDeleteItemMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteItemMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteItemMutation, { data, loading, error }] = useDeleteItemMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteItemMutation(
  baseOptions?: Apollo.MutationHookOptions<DeleteItemMutation, DeleteItemMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteItemMutation, DeleteItemMutationVariables>(DeleteItemDocument, options);
}
export type DeleteItemMutationHookResult = ReturnType<typeof useDeleteItemMutation>;
export type DeleteItemMutationResult = Apollo.MutationResult<DeleteItemMutation>;
export type DeleteItemMutationOptions = Apollo.BaseMutationOptions<DeleteItemMutation, DeleteItemMutationVariables>;
export const CreateItemDocument = gql`
  mutation createItem($collectionId: Int!, $name: String!, $content: String!) {
    createItem(collectionId: $collectionId, name: $name, content: $content) {
      name
    }
  }
`;
export type CreateItemMutationFn = Apollo.MutationFunction<CreateItemMutation, CreateItemMutationVariables>;

/**
 * __useCreateItemMutation__
 *
 * To run a mutation, you first call `useCreateItemMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateItemMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createItemMutation, { data, loading, error }] = useCreateItemMutation({
 *   variables: {
 *      collectionId: // value for 'collectionId'
 *      name: // value for 'name'
 *      content: // value for 'content'
 *   },
 * });
 */
export function useCreateItemMutation(
  baseOptions?: Apollo.MutationHookOptions<CreateItemMutation, CreateItemMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateItemMutation, CreateItemMutationVariables>(CreateItemDocument, options);
}
export type CreateItemMutationHookResult = ReturnType<typeof useCreateItemMutation>;
export type CreateItemMutationResult = Apollo.MutationResult<CreateItemMutation>;
export type CreateItemMutationOptions = Apollo.BaseMutationOptions<CreateItemMutation, CreateItemMutationVariables>;
