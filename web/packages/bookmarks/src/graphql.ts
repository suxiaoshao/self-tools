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
  createDirectory: Collection;
  /** 创建标签 */
  createTag: Tag;
  /** 删除作者 */
  deleteAuthor: Author;
  /** 删除目录 */
  deleteDirectory: Collection;
  /** 删除标签 */
  deleteTag: Tag;
};

export type MutationRootCreateAuthorArgs = {
  avatar: Scalars['String'];
  description: Scalars['String'];
  name: Scalars['String'];
  url: Scalars['String'];
};

export type MutationRootCreateDirectoryArgs = {
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

export type MutationRootDeleteDirectoryArgs = {
  id: Scalars['Int'];
};

export type MutationRootDeleteTagArgs = {
  id: Scalars['Int'];
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** 获取作者列表 */
  getAuthorList: Array<Author>;
  /** 获取目录列表 */
  getDirectoryList: Array<Collection>;
  /** 获取标签列表 */
  getTagList: Array<Tag>;
};

export type QueryRootGetDirectoryListArgs = {
  parentId?: InputMaybe<Scalars['Int']>;
};

export type QueryRootGetTagListArgs = {
  directoryId?: InputMaybe<Scalars['Int']>;
};

export type Tag = {
  __typename?: 'Tag';
  collectionId?: Maybe<Scalars['Int']>;
  createTime: Scalars['Int'];
  id: Scalars['Int'];
  name: Scalars['String'];
  updateTime: Scalars['Int'];
};

export type GetDirectoryListQueryVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']>;
}>;

export type GetDirectoryListQuery = {
  __typename?: 'QueryRoot';
  getDirectoryList: Array<{
    __typename?: 'Collection';
    name: string;
    id: number;
    path: string;
    createTime: number;
    updateTime: number;
  }>;
};

export type DeleteDirectoryMutationVariables = Exact<{
  id: Scalars['Int'];
}>;

export type DeleteDirectoryMutation = {
  __typename?: 'MutationRoot';
  deleteDirectory: { __typename?: 'Collection'; path: string };
};

export type CreateDirectoryMutationVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']>;
  name: Scalars['String'];
  description?: InputMaybe<Scalars['String']>;
}>;

export type CreateDirectoryMutation = {
  __typename?: 'MutationRoot';
  createDirectory: { __typename?: 'Collection'; path: string };
};

export const GetDirectoryListDocument = gql`
  query getDirectoryList($parentId: Int) {
    getDirectoryList(parentId: $parentId) {
      name
      id
      path
      createTime
      updateTime
    }
  }
`;

/**
 * __useGetDirectoryListQuery__
 *
 * To run a query within a React component, call `useGetDirectoryListQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetDirectoryListQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetDirectoryListQuery({
 *   variables: {
 *      parentId: // value for 'parentId'
 *   },
 * });
 */
export function useGetDirectoryListQuery(
  baseOptions?: Apollo.QueryHookOptions<GetDirectoryListQuery, GetDirectoryListQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useQuery<GetDirectoryListQuery, GetDirectoryListQueryVariables>(GetDirectoryListDocument, options);
}
export function useGetDirectoryListLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetDirectoryListQuery, GetDirectoryListQueryVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useLazyQuery<GetDirectoryListQuery, GetDirectoryListQueryVariables>(GetDirectoryListDocument, options);
}
export type GetDirectoryListQueryHookResult = ReturnType<typeof useGetDirectoryListQuery>;
export type GetDirectoryListLazyQueryHookResult = ReturnType<typeof useGetDirectoryListLazyQuery>;
export type GetDirectoryListQueryResult = Apollo.QueryResult<GetDirectoryListQuery, GetDirectoryListQueryVariables>;
export const DeleteDirectoryDocument = gql`
  mutation deleteDirectory($id: Int!) {
    deleteDirectory(id: $id) {
      path
    }
  }
`;
export type DeleteDirectoryMutationFn = Apollo.MutationFunction<
  DeleteDirectoryMutation,
  DeleteDirectoryMutationVariables
>;

/**
 * __useDeleteDirectoryMutation__
 *
 * To run a mutation, you first call `useDeleteDirectoryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteDirectoryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteDirectoryMutation, { data, loading, error }] = useDeleteDirectoryMutation({
 *   variables: {
 *      id: // value for 'id'
 *   },
 * });
 */
export function useDeleteDirectoryMutation(
  baseOptions?: Apollo.MutationHookOptions<DeleteDirectoryMutation, DeleteDirectoryMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<DeleteDirectoryMutation, DeleteDirectoryMutationVariables>(
    DeleteDirectoryDocument,
    options,
  );
}
export type DeleteDirectoryMutationHookResult = ReturnType<typeof useDeleteDirectoryMutation>;
export type DeleteDirectoryMutationResult = Apollo.MutationResult<DeleteDirectoryMutation>;
export type DeleteDirectoryMutationOptions = Apollo.BaseMutationOptions<
  DeleteDirectoryMutation,
  DeleteDirectoryMutationVariables
>;
export const CreateDirectoryDocument = gql`
  mutation createDirectory($parentId: Int, $name: String!, $description: String) {
    createDirectory(parentId: $parentId, name: $name, description: $description) {
      path
    }
  }
`;
export type CreateDirectoryMutationFn = Apollo.MutationFunction<
  CreateDirectoryMutation,
  CreateDirectoryMutationVariables
>;

/**
 * __useCreateDirectoryMutation__
 *
 * To run a mutation, you first call `useCreateDirectoryMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useCreateDirectoryMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [createDirectoryMutation, { data, loading, error }] = useCreateDirectoryMutation({
 *   variables: {
 *      parentId: // value for 'parentId'
 *      name: // value for 'name'
 *      description: // value for 'description'
 *   },
 * });
 */
export function useCreateDirectoryMutation(
  baseOptions?: Apollo.MutationHookOptions<CreateDirectoryMutation, CreateDirectoryMutationVariables>,
) {
  const options = { ...defaultOptions, ...baseOptions };
  return Apollo.useMutation<CreateDirectoryMutation, CreateDirectoryMutationVariables>(
    CreateDirectoryDocument,
    options,
  );
}
export type CreateDirectoryMutationHookResult = ReturnType<typeof useCreateDirectoryMutation>;
export type CreateDirectoryMutationResult = Apollo.MutationResult<CreateDirectoryMutation>;
export type CreateDirectoryMutationOptions = Apollo.BaseMutationOptions<
  CreateDirectoryMutation,
  CreateDirectoryMutationVariables
>;
