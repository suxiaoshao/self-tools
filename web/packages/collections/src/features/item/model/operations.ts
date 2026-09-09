import { graphql } from '@collections/gql';

export const DeleteItem = graphql(`
  mutation deleteItem($id: Int!) {
    deleteItem(id: $id) {
      __typename
      ... on ResourceDeleted {
        resource {
          kind
          id
        }
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
    }
  }
`);
