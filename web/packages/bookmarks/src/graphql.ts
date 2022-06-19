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

export type Directory = {
  __typename?: 'Directory';
  createTime: Scalars['Int'];
  path: Scalars['String'];
  updateTime: Scalars['Int'];
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  /** 创建目录 */
  createDirectory: Directory;
  /** 删除目录 */
  deleteDirectory: Directory;
};

export type MutationRootCreateDirectoryArgs = {
  dirName: Scalars['String'];
  fatherPath: Scalars['String'];
};

export type MutationRootDeleteDirectoryArgs = {
  dirPath: Scalars['String'];
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  /** 获取目录列表 */
  getDirectoryList: Array<Directory>;
};

export type QueryRootGetDirectoryListArgs = {
  fatherPath: Scalars['String'];
};

export type GetDirectoryListQueryVariables = Exact<{
  fatherPath: Scalars['String'];
}>;

export type GetDirectoryListQuery = {
  __typename?: 'QueryRoot';
  getDirectoryList: Array<{ __typename?: 'Directory'; path: string; createTime: number; updateTime: number }>;
};

export type DeleteDirectoryMutationVariables = Exact<{
  dirPath: Scalars['String'];
}>;

export type DeleteDirectoryMutation = {
  __typename?: 'MutationRoot';
  deleteDirectory: { __typename?: 'Directory'; path: string };
};

export type CreateDirectoryMutationVariables = Exact<{
  fatherPath: Scalars['String'];
  dirName: Scalars['String'];
}>;

export type CreateDirectoryMutation = {
  __typename?: 'MutationRoot';
  createDirectory: { __typename?: 'Directory'; path: string };
};

export const GetDirectoryListDocument = gql`
  query getDirectoryList($fatherPath: String!) {
    getDirectoryList(fatherPath: $fatherPath) {
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
 *      fatherPath: // value for 'fatherPath'
 *   },
 * });
 */
export function useGetDirectoryListQuery(
  baseOptions: Apollo.QueryHookOptions<GetDirectoryListQuery, GetDirectoryListQueryVariables>,
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
  mutation deleteDirectory($dirPath: String!) {
    deleteDirectory(dirPath: $dirPath) {
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
 *      dirPath: // value for 'dirPath'
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
  mutation createDirectory($fatherPath: String!, $dirName: String!) {
    createDirectory(fatherPath: $fatherPath, dirName: $dirName) {
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
 *      fatherPath: // value for 'fatherPath'
 *      dirName: // value for 'dirName'
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
