import { protocolFailure, saved, type WriteOutcome } from 'custom-graphql';
import type {
  CreateCollectionMutation,
  UpdateCollectionMutation,
  CreateItemMutation,
  UpdateItemMutation,
  DeleteCollectionMutation,
  DeleteItemMutation,
  AddCollectionForItemMutation,
  DeleteCollectionForItemMutation,
} from './gql/graphql';

type Validation = Extract<CreateCollectionMutation['createCollection'], { __typename: 'ValidationFailure' }>;
function validation(value: Validation): WriteOutcome {
  if (!value.issues.length) return protocolFailure();
  return {
    status: 'rejected',
    rejection: {
      kind: 'validation',
      issues: value.issues.map((issue) => ({ ...issue, min: issue.min ?? undefined, max: issue.max ?? undefined })),
    },
  };
}
type Missing = Extract<CreateCollectionMutation['createCollection'], { __typename: 'MissingResources' }>;
function missing(value: Missing): WriteOutcome {
  return value.resources.length
    ? { status: 'rejected', rejection: { kind: 'missing', resources: value.resources } }
    : protocolFailure();
}
type Conflict = Extract<CreateCollectionMutation['createCollection'], { __typename: 'Conflict' }>;
function conflict(value: Conflict): WriteOutcome {
  switch (value.reason) {
    case 'COLLECTION_PATH_EXISTS':
    case 'MEMBERSHIP_EXISTS':
      return { status: 'rejected', rejection: { kind: 'conflict', reason: value.reason } };
    default: {
      const exhaustive: never = value.reason;
      void exhaustive;
      return protocolFailure();
    }
  }
}
export function collectionResult(
  result:
    | CreateCollectionMutation['createCollection']
    | UpdateCollectionMutation['updateCollection']
    | undefined
    | null,
): WriteOutcome {
  if (!result) return protocolFailure();
  switch (result.__typename) {
    case 'CollectionSaved':
      return saved(result.collectionId);
    case 'ValidationFailure':
      return validation(result);
    case 'MissingResources':
      return missing(result);
    case 'Conflict':
      return conflict(result);
    default: {
      const exhaustive: never = result;
      void exhaustive;
      return protocolFailure();
    }
  }
}
export function itemResult(
  result: CreateItemMutation['createItem'] | UpdateItemMutation['updateItem'] | undefined | null,
): WriteOutcome {
  if (!result) return protocolFailure();
  switch (result.__typename) {
    case 'ItemSaved':
      return saved(result.itemId);
    case 'ValidationFailure':
      return validation(result);
    case 'MissingResources':
      return missing(result);
    default: {
      const exhaustive: never = result;
      void exhaustive;
      return protocolFailure();
    }
  }
}
export function deleteResult(
  result: DeleteCollectionMutation['deleteCollection'] | DeleteItemMutation['deleteItem'] | undefined | null,
): WriteOutcome {
  if (!result) return protocolFailure();
  switch (result.__typename) {
    case 'ResourceDeleted':
      return saved(result.resource.id);
    case 'ValidationFailure':
      return validation(result);
    default: {
      const exhaustive: never = result;
      void exhaustive;
      return protocolFailure();
    }
  }
}
export function membershipResult(
  result:
    | AddCollectionForItemMutation['addCollectionForItem']
    | DeleteCollectionForItemMutation['deleteCollectionForItem']
    | undefined
    | null,
  present: boolean,
): WriteOutcome {
  if (!result) return protocolFailure();
  switch (result.__typename) {
    case 'CollectionMembershipChanged':
      return result.present === present && result.collectionId > 0 ? saved(result.resource.id) : protocolFailure();
    case 'ValidationFailure':
      return validation(result);
    case 'MissingResources':
      return missing(result);
    case 'Conflict':
      return conflict(result);
    default: {
      const exhaustive: never = result;
      void exhaustive;
      return protocolFailure();
    }
  }
}
