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

export type ItemAndCollection = Collection | Item;

export type List = {
  __typename?: 'List';
  data: Array<ItemAndCollection>;
  total: Scalars['Int'];
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  /** 创建目录 */
  createCollection: Collection;
  /** 创建记录 */
  createItem: Item;
  /** 删除目录 */
  deleteCollection: Collection;
  /** 删除记录 */
  deleteItem: Item;
  /** 修改目录 */
  updateCollection: Collection;
  /** 修改记录 */
  updateItem: Item;
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

export type MutationRootUpdateCollectionArgs = {
  description?: InputMaybe<Scalars['String']>;
  id: Scalars['Int'];
  name: Scalars['String'];
};

export type MutationRootUpdateItemArgs = {
  content: Scalars['String'];
  id: Scalars['Int'];
  name: Scalars['String'];
};

export type Pagination = {
  page: Scalars['Int'];
  pageSize: Scalars['Int'];
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** 获取集合下的集合和记录 */
  collectionAndItem: List;
  /** 获取目录详情 */
  getCollection: Collection;
  /** 获取记录详情 */
  getItem: Item;
};

export type QueryRootCollectionAndItemArgs = {
  id?: InputMaybe<Scalars['Int']>;
  pagination: Pagination;
};

export type QueryRootGetCollectionArgs = {
  id: Scalars['Int'];
};

export type QueryRootGetItemArgs = {
  id: Scalars['Int'];
};

export type CollectionAndItemsQueryVariables = Exact<{
  id?: InputMaybe<Scalars['Int']>;
  pagination: Pagination;
}>;

export type CollectionAndItemsQuery = {
  __typename?: 'QueryRoot';
  collectionAndItem: {
    __typename?: 'List';
    total: number;
    data: Array<
      | {
          __typename: 'Collection';
          name: string;
          id: number;
          path: string;
          createTime: string;
          updateTime: string;
          description?: string | null;
        }
      | { __typename: 'Item'; name: string; id: number; updateTime: string; createTime: string }
    >;
  };
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

export type UpdateCollectionMutationVariables = Exact<{
  id: Scalars['Int'];
  name: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
}>;

export type UpdateCollectionMutation = {
  __typename?: 'MutationRoot';
  updateCollection: { __typename?: 'Collection'; path: string };
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

export type UpdateItemMutationVariables = Exact<{
  id: Scalars['Int'];
  name: Scalars['String'];
  content: Scalars['String'];
}>;

export type UpdateItemMutation = { __typename?: 'MutationRoot'; updateItem: { __typename?: 'Item'; name: string } };

export type GetEditItemQueryVariables = Exact<{
  id: Scalars['Int'];
}>;

export type GetEditItemQuery = {
  __typename?: 'QueryRoot';
  getItem: { __typename?: 'Item'; name: string; content: string };
};

export const CollectionAndItemsDocument = gql`
  query collectionAndItems($id: Int, $pagination: Pagination!) {
    collectionAndItem(id: $id, pagination: $pagination) {
      data {
        ... on Collection {
          name
          id
          path
          createTime
          updateTime
          description
          __typename
        }
        ... on Item {
          name
          id
          updateTime
          createTime
          __typename
        }
      }
      total
    }
  }
`;

/**
 * __useCollectionAndItemsQuery__
 *
 * To run a query within a React component, call `useCollectionAndItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useCollectionAndItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useCollectionAndItemsQuery({
 *   variables: {
 *      id: // value for 'id'
 *      pagination: // value for 'pagination'
 *   },
 * });
 */
export function useCollectionAndItemsQuery(
  baseOptions: Apollo.QueryHookOptions<CollectionAndItemsQuery, CollectionAndItemsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<CollectionAndItemsQuery, CollectionAndItemsQueryVariables>(
    CollectionAndItemsDocument,
    options,
  );
}
export function useCollectionAndItemsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<CollectionAndItemsQuery, CollectionAndItemsQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<CollectionAndItemsQuery, CollectionAndItemsQueryVariables>(
    CollectionAndItemsDocument,
    options,
  );
}
export type CollectionAndItemsQueryHookResult = ReturnType<typeof useCollectionAndItemsQuery>;
export type CollectionAndItemsLazyQueryHookResult = ReturnType<typeof useCollectionAndItemsLazyQuery>;
export type CollectionAndItemsQueryResult = Apollo.QueryResult<
  CollectionAndItemsQuery,
  CollectionAndItemsQueryVariables
>;
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
export const UpdateCollectionDocument = gql`
  mutation updateCollection($id: Int!, $name: String!, $description: String) {
    updateCollection(id: $id, name: $name, description: $description) {
      path
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
export const UpdateItemDocument = gql`
  mutation updateItem($id: Int!, $name: String!, $content: String!) {
    updateItem(id: $id, name: $name, content: $content) {
      name
    }
  }
`;
export type UpdateItemMutationFn = Apollo.MutationFunction<UpdateItemMutation, UpdateItemMutationVariables>;

/**
 * __useUpdateItemMutation__
 *
 * To run a mutation, you first call `useUpdateItemMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useUpdateItemMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [updateItemMutation, { data, loading, error }] = useUpdateItemMutation({
 *   variables: {
 *      id: // value for 'id'
 *      name: // value for 'name'
 *      content: // value for 'content'
 *   },
 * });
 */
export function useUpdateItemMutation(
  baseOptions?: Apollo.MutationHookOptions<UpdateItemMutation, UpdateItemMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<UpdateItemMutation, UpdateItemMutationVariables>(UpdateItemDocument, options);
}
export type UpdateItemMutationHookResult = ReturnType<typeof useUpdateItemMutation>;
export type UpdateItemMutationResult = Apollo.MutationResult<UpdateItemMutation>;
export type UpdateItemMutationOptions = Apollo.BaseMutationOptions<UpdateItemMutation, UpdateItemMutationVariables>;
export const GetEditItemDocument = gql`
  query getEditItem($id: Int!) {
    getItem(id: $id) {
      name
      content
    }
  }
`;

/**
 * __useGetEditItemQuery__
 *
 * To run a query within a React component, call `useGetEditItemQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetEditItemQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetEditItemQuery({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useGetEditItemQuery(baseOptions: Apollo.QueryHookOptions<GetEditItemQuery, GetEditItemQueryVariables>) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetEditItemQuery, GetEditItemQueryVariables>(GetEditItemDocument, options);
}
export function useGetEditItemLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetEditItemQuery, GetEditItemQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetEditItemQuery, GetEditItemQueryVariables>(GetEditItemDocument, options);
}
export type GetEditItemQueryHookResult = ReturnType<typeof useGetEditItemQuery>;
export type GetEditItemLazyQueryHookResult = ReturnType<typeof useGetEditItemLazyQuery>;
export type GetEditItemQueryResult = Apollo.QueryResult<GetEditItemQuery, GetEditItemQueryVariables>;
