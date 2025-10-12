/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  DateTime: { input: any; output: any };
};

export type Collection = {
  __typename?: 'Collection';
  ancestors: Array<Collection>;
  createTime: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  parentId?: Maybe<Scalars['Int']['output']>;
  path: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
};

export type CollectionItemQuery = {
  createTime?: InputMaybe<TimeRange>;
  id?: InputMaybe<Scalars['Int']['input']>;
  pagination: Pagination;
  updateTime?: InputMaybe<TimeRange>;
};

export type Item = {
  __typename?: 'Item';
  collections: Array<Collection>;
  content: Scalars['String']['output'];
  createTime: Scalars['DateTime']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  updateTime: Scalars['DateTime']['output'];
};

export type ItemAndCollection = Collection | Item;

export type ItemAndCollectionList = {
  __typename?: 'ItemAndCollectionList';
  data: Array<ItemAndCollection>;
  total: Scalars['Int']['output'];
};

export type ItemList = {
  __typename?: 'ItemList';
  data: Array<Item>;
  total: Scalars['Int']['output'];
};

export type MutationRoot = {
  __typename?: 'MutationRoot';
  addCollectionForItem: Item;
  createCollection: Collection;
  createItem: Item;
  deleteCollection: Collection;
  deleteCollectionForItem: Item;
  deleteItem: Item;
  updateCollection: Collection;
  updateItem: Item;
};

export type MutationRootAddCollectionForItemArgs = {
  collectionId: Scalars['Int']['input'];
  itemId: Scalars['Int']['input'];
};

export type MutationRootCreateCollectionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  parentId?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationRootCreateItemArgs = {
  collectionIds: Array<Scalars['Int']['input']>;
  content: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type MutationRootDeleteCollectionArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootDeleteCollectionForItemArgs = {
  collectionId: Scalars['Int']['input'];
  itemId: Scalars['Int']['input'];
};

export type MutationRootDeleteItemArgs = {
  id: Scalars['Int']['input'];
};

export type MutationRootUpdateCollectionArgs = {
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};

export type MutationRootUpdateItemArgs = {
  content: Scalars['String']['input'];
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
};

export type Pagination = {
  page?: Scalars['Int']['input'];
  pageSize?: Scalars['Int']['input'];
};

export type QueryRoot = {
  __typename?: 'QueryRoot';
  allCollections: Array<Collection>;
  collectionAndItem: ItemAndCollectionList;
  getCollection: Collection;
  getItem: Item;
  queryItems: ItemList;
};

export type QueryRootCollectionAndItemArgs = {
  query: CollectionItemQuery;
};

export type QueryRootGetCollectionArgs = {
  id: Scalars['Int']['input'];
};

export type QueryRootGetItemArgs = {
  id: Scalars['Int']['input'];
};

export type QueryRootQueryItemsArgs = {
  collectionMatch?: InputMaybe<TagMatch>;
  pagination: Pagination;
};

export type TagMatch = {
  fullMatch: Scalars['Boolean']['input'];
  matchSet: Array<Scalars['Int']['input']>;
};

export type TimeRange = {
  end: Scalars['DateTime']['input'];
  start: Scalars['DateTime']['input'];
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

export type DeleteCollectionMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteCollectionMutation = {
  __typename?: 'MutationRoot';
  deleteCollection: { __typename?: 'Collection'; path: string };
};

export type DeleteItemMutationVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type DeleteItemMutation = { __typename?: 'MutationRoot'; deleteItem: { __typename?: 'Item'; name: string } };

export type GetEditItemQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetEditItemQuery = {
  __typename?: 'QueryRoot';
  getItem: {
    __typename?: 'Item';
    name: string;
    content: string;
    collections: Array<{ __typename?: 'Collection'; id: number }>;
  };
};

export type UpdateCollectionMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
}>;

export type UpdateCollectionMutation = {
  __typename?: 'MutationRoot';
  updateCollection: { __typename?: 'Collection'; path: string };
};

export type UpdateItemMutationVariables = Exact<{
  id: Scalars['Int']['input'];
  name: Scalars['String']['input'];
  content: Scalars['String']['input'];
}>;

export type UpdateItemMutation = {
  __typename?: 'MutationRoot';
  updateItem: { __typename?: 'Item'; id: number; name: string; content: string };
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

export type CreateCollectionMutationVariables = Exact<{
  parentId?: InputMaybe<Scalars['Int']['input']>;
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
}>;

export type CreateCollectionMutation = {
  __typename?: 'MutationRoot';
  createCollection: { __typename?: 'Collection'; path: string };
};

export type CreateItemMutationVariables = Exact<{
  collectionIds: Array<Scalars['Int']['input']> | Scalars['Int']['input'];
  name: Scalars['String']['input'];
  content: Scalars['String']['input'];
}>;

export type CreateItemMutation = { __typename?: 'MutationRoot'; createItem: { __typename?: 'Item'; name: string } };

export type CollectionAndItemsQueryVariables = Exact<{
  query: CollectionItemQuery;
}>;

export type CollectionAndItemsQuery = {
  __typename?: 'QueryRoot';
  collectionAndItem: {
    __typename?: 'ItemAndCollectionList';
    total: number;
    data: Array<
      | {
          __typename: 'Collection';
          name: string;
          id: number;
          path: string;
          createTime: any;
          updateTime: any;
          description?: string | null;
        }
      | { __typename: 'Item'; name: string; id: number; updateTime: any; createTime: any }
    >;
  };
};

export type AddCollectionForItemMutationVariables = Exact<{
  itemId: Scalars['Int']['input'];
  collectionId: Scalars['Int']['input'];
}>;

export type AddCollectionForItemMutation = {
  __typename?: 'MutationRoot';
  addCollectionForItem: { __typename?: 'Item'; id: number };
};

export type GetItemQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;

export type GetItemQuery = {
  __typename?: 'QueryRoot';
  getItem: {
    __typename?: 'Item';
    id: number;
    name: string;
    content: string;
    createTime: any;
    updateTime: any;
    collections: Array<{
      __typename?: 'Collection';
      id: number;
      name: string;
      path: string;
      description?: string | null;
    }>;
  };
};

export type DeleteCollectionForItemMutationVariables = Exact<{
  collectionId: Scalars['Int']['input'];
  itemId: Scalars['Int']['input'];
}>;

export type DeleteCollectionForItemMutation = {
  __typename?: 'MutationRoot';
  deleteCollectionForItem: { __typename?: 'Item'; id: number };
};

export type GetItemsQueryVariables = Exact<{
  collectionMatch?: InputMaybe<TagMatch>;
  pagination: Pagination;
}>;

export type GetItemsQuery = {
  __typename?: 'QueryRoot';
  queryItems: {
    __typename?: 'ItemList';
    total: number;
    data: Array<{ __typename?: 'Item'; id: number; name: string; content: string; createTime: any; updateTime: any }>;
  };
};

export const AllCollectionsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'allCollections' },
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'allCollections' },
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'path' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                { kind: 'Field', name: { kind: 'Name', value: 'parentId' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AllCollectionsQuery, AllCollectionsQueryVariables>;
export const DeleteCollectionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'deleteCollection' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteCollection' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'path' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteCollectionMutation, DeleteCollectionMutationVariables>;
export const DeleteItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'deleteItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteItemMutation, DeleteItemMutationVariables>;
export const GetEditItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getEditItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'collections' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetEditItemQuery, GetEditItemQueryVariables>;
export const UpdateCollectionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'updateCollection' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'description' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateCollection' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'description' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'description' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'path' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateCollectionMutation, UpdateCollectionMutationVariables>;
export const UpdateItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'updateItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'updateItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'content' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<UpdateItemMutation, UpdateItemMutationVariables>;
export const GetCollectionAncestorsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getCollectionAncestors' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getCollection' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'ancestors' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetCollectionAncestorsQuery, GetCollectionAncestorsQueryVariables>;
export const CreateCollectionDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'createCollection' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'parentId' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'description' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createCollection' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'parentId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'parentId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'description' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'description' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'path' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateCollectionMutation, CreateCollectionMutationVariables>;
export const CreateItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'createItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'collectionIds' } },
          type: {
            kind: 'NonNullType',
            type: {
              kind: 'ListType',
              type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
            },
          },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'String' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'createItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'collectionIds' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'collectionIds' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'name' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'name' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'content' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'content' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'name' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CreateItemMutation, CreateItemMutationVariables>;
export const CollectionAndItemsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'collectionAndItems' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'query' } },
          type: {
            kind: 'NonNullType',
            type: { kind: 'NamedType', name: { kind: 'Name', value: 'CollectionItemQuery' } },
          },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'collectionAndItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'query' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'query' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      {
                        kind: 'InlineFragment',
                        typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Collection' } },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'path' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                            { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                          ],
                        },
                      },
                      {
                        kind: 'InlineFragment',
                        typeCondition: { kind: 'NamedType', name: { kind: 'Name', value: 'Item' } },
                        selectionSet: {
                          kind: 'SelectionSet',
                          selections: [
                            { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                            { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                            { kind: 'Field', name: { kind: 'Name', value: '__typename' } },
                          ],
                        },
                      },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<CollectionAndItemsQuery, CollectionAndItemsQueryVariables>;
export const AddCollectionForItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'addCollectionForItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'itemId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'collectionId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'addCollectionForItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'itemId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'itemId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'collectionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'collectionId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<AddCollectionForItemMutation, AddCollectionForItemMutationVariables>;
export const GetItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'getItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'id' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'id' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'collections' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'path' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'description' } },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetItemQuery, GetItemQueryVariables>;
export const DeleteCollectionForItemDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'mutation',
      name: { kind: 'Name', value: 'deleteCollectionForItem' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'collectionId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'itemId' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Int' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'deleteCollectionForItem' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'collectionId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'collectionId' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'itemId' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'itemId' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [{ kind: 'Field', name: { kind: 'Name', value: 'id' } }],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<DeleteCollectionForItemMutation, DeleteCollectionForItemMutationVariables>;
export const GetItemsDocument = {
  kind: 'Document',
  definitions: [
    {
      kind: 'OperationDefinition',
      operation: 'query',
      name: { kind: 'Name', value: 'getItems' },
      variableDefinitions: [
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'collectionMatch' } },
          type: { kind: 'NamedType', name: { kind: 'Name', value: 'TagMatch' } },
        },
        {
          kind: 'VariableDefinition',
          variable: { kind: 'Variable', name: { kind: 'Name', value: 'pagination' } },
          type: { kind: 'NonNullType', type: { kind: 'NamedType', name: { kind: 'Name', value: 'Pagination' } } },
        },
      ],
      selectionSet: {
        kind: 'SelectionSet',
        selections: [
          {
            kind: 'Field',
            name: { kind: 'Name', value: 'queryItems' },
            arguments: [
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'collectionMatch' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'collectionMatch' } },
              },
              {
                kind: 'Argument',
                name: { kind: 'Name', value: 'pagination' },
                value: { kind: 'Variable', name: { kind: 'Name', value: 'pagination' } },
              },
            ],
            selectionSet: {
              kind: 'SelectionSet',
              selections: [
                {
                  kind: 'Field',
                  name: { kind: 'Name', value: 'data' },
                  selectionSet: {
                    kind: 'SelectionSet',
                    selections: [
                      { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'name' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'content' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'createTime' } },
                      { kind: 'Field', name: { kind: 'Name', value: 'updateTime' } },
                    ],
                  },
                },
                { kind: 'Field', name: { kind: 'Name', value: 'total' } },
              ],
            },
          },
        ],
      },
    },
  ],
} as unknown as DocumentNode<GetItemsQuery, GetItemsQueryVariables>;
