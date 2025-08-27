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
  '\n  mutation deleteCollection($id: Int!) {\n    deleteCollection(id: $id) {\n      path\n    }\n  }\n': typeof types.DeleteCollectionDocument;
  '\n  mutation deleteItem($id: Int!) {\n    deleteItem(id: $id) {\n      name\n    }\n  }\n': typeof types.DeleteItemDocument;
  '\n  query getEditItem($id: Int!) {\n    getItem(id: $id) {\n      name\n      content\n    }\n  }\n': typeof types.GetEditItemDocument;
  '\n  mutation updateCollection($id: Int!, $name: String!, $description: String) {\n    updateCollection(id: $id, name: $name, description: $description) {\n      path\n    }\n  }\n': typeof types.UpdateCollectionDocument;
  '\n  mutation updateItem($id: Int!, $name: String!, $content: String!) {\n    updateItem(id: $id, name: $name, content: $content) {\n      id\n      name\n      content\n    }\n  }\n': typeof types.UpdateItemDocument;
  '\n  query getCollectionAncestors($id: Int!) {\n    getCollection(id: $id) {\n      ancestors {\n        id\n        name\n      }\n      id\n      name\n    }\n  }\n': typeof types.GetCollectionAncestorsDocument;
  '\n  mutation createCollection($parentId: Int, $name: String!, $description: String) {\n    createCollection(parentId: $parentId, name: $name, description: $description) {\n      path\n    }\n  }\n': typeof types.CreateCollectionDocument;
  '\n  mutation createItem($collectionId: Int!, $name: String!, $content: String!) {\n    createItem(collectionId: $collectionId, name: $name, content: $content) {\n      name\n    }\n  }\n': typeof types.CreateItemDocument;
  '\n  query collectionAndItems($query: CollectionItemQuery!) {\n    collectionAndItem(query: $query) {\n      data {\n        ... on Collection {\n          name\n          id\n          path\n          createTime\n          updateTime\n          description\n          __typename\n        }\n        ... on Item {\n          name\n          id\n          updateTime\n          createTime\n          __typename\n        }\n      }\n      total\n    }\n  }\n': typeof types.CollectionAndItemsDocument;
};
const documents: Documents = {
  '\n  mutation deleteCollection($id: Int!) {\n    deleteCollection(id: $id) {\n      path\n    }\n  }\n':
    types.DeleteCollectionDocument,
  '\n  mutation deleteItem($id: Int!) {\n    deleteItem(id: $id) {\n      name\n    }\n  }\n': types.DeleteItemDocument,
  '\n  query getEditItem($id: Int!) {\n    getItem(id: $id) {\n      name\n      content\n    }\n  }\n':
    types.GetEditItemDocument,
  '\n  mutation updateCollection($id: Int!, $name: String!, $description: String) {\n    updateCollection(id: $id, name: $name, description: $description) {\n      path\n    }\n  }\n':
    types.UpdateCollectionDocument,
  '\n  mutation updateItem($id: Int!, $name: String!, $content: String!) {\n    updateItem(id: $id, name: $name, content: $content) {\n      id\n      name\n      content\n    }\n  }\n':
    types.UpdateItemDocument,
  '\n  query getCollectionAncestors($id: Int!) {\n    getCollection(id: $id) {\n      ancestors {\n        id\n        name\n      }\n      id\n      name\n    }\n  }\n':
    types.GetCollectionAncestorsDocument,
  '\n  mutation createCollection($parentId: Int, $name: String!, $description: String) {\n    createCollection(parentId: $parentId, name: $name, description: $description) {\n      path\n    }\n  }\n':
    types.CreateCollectionDocument,
  '\n  mutation createItem($collectionId: Int!, $name: String!, $content: String!) {\n    createItem(collectionId: $collectionId, name: $name, content: $content) {\n      name\n    }\n  }\n':
    types.CreateItemDocument,
  '\n  query collectionAndItems($query: CollectionItemQuery!) {\n    collectionAndItem(query: $query) {\n      data {\n        ... on Collection {\n          name\n          id\n          path\n          createTime\n          updateTime\n          description\n          __typename\n        }\n        ... on Item {\n          name\n          id\n          updateTime\n          createTime\n          __typename\n        }\n      }\n      total\n    }\n  }\n':
    types.CollectionAndItemsDocument,
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
  source: '\n  mutation deleteCollection($id: Int!) {\n    deleteCollection(id: $id) {\n      path\n    }\n  }\n',
): (typeof documents)['\n  mutation deleteCollection($id: Int!) {\n    deleteCollection(id: $id) {\n      path\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation deleteItem($id: Int!) {\n    deleteItem(id: $id) {\n      name\n    }\n  }\n',
): (typeof documents)['\n  mutation deleteItem($id: Int!) {\n    deleteItem(id: $id) {\n      name\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query getEditItem($id: Int!) {\n    getItem(id: $id) {\n      name\n      content\n    }\n  }\n',
): (typeof documents)['\n  query getEditItem($id: Int!) {\n    getItem(id: $id) {\n      name\n      content\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation updateCollection($id: Int!, $name: String!, $description: String) {\n    updateCollection(id: $id, name: $name, description: $description) {\n      path\n    }\n  }\n',
): (typeof documents)['\n  mutation updateCollection($id: Int!, $name: String!, $description: String) {\n    updateCollection(id: $id, name: $name, description: $description) {\n      path\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation updateItem($id: Int!, $name: String!, $content: String!) {\n    updateItem(id: $id, name: $name, content: $content) {\n      id\n      name\n      content\n    }\n  }\n',
): (typeof documents)['\n  mutation updateItem($id: Int!, $name: String!, $content: String!) {\n    updateItem(id: $id, name: $name, content: $content) {\n      id\n      name\n      content\n    }\n  }\n'];
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
  source: '\n  mutation createCollection($parentId: Int, $name: String!, $description: String) {\n    createCollection(parentId: $parentId, name: $name, description: $description) {\n      path\n    }\n  }\n',
): (typeof documents)['\n  mutation createCollection($parentId: Int, $name: String!, $description: String) {\n    createCollection(parentId: $parentId, name: $name, description: $description) {\n      path\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  mutation createItem($collectionId: Int!, $name: String!, $content: String!) {\n    createItem(collectionId: $collectionId, name: $name, content: $content) {\n      name\n    }\n  }\n',
): (typeof documents)['\n  mutation createItem($collectionId: Int!, $name: String!, $content: String!) {\n    createItem(collectionId: $collectionId, name: $name, content: $content) {\n      name\n    }\n  }\n'];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(
  source: '\n  query collectionAndItems($query: CollectionItemQuery!) {\n    collectionAndItem(query: $query) {\n      data {\n        ... on Collection {\n          name\n          id\n          path\n          createTime\n          updateTime\n          description\n          __typename\n        }\n        ... on Item {\n          name\n          id\n          updateTime\n          createTime\n          __typename\n        }\n      }\n      total\n    }\n  }\n',
): (typeof documents)['\n  query collectionAndItems($query: CollectionItemQuery!) {\n    collectionAndItem(query: $query) {\n      data {\n        ... on Collection {\n          name\n          id\n          path\n          createTime\n          updateTime\n          description\n          __typename\n        }\n        ... on Item {\n          name\n          id\n          updateTime\n          createTime\n          __typename\n        }\n      }\n      total\n    }\n  }\n'];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> =
  TDocumentNode extends DocumentNode<infer TType, any> ? TType : never;
