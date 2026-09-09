import { protocolFailure, saved, type WriteOutcome } from 'custom-graphql';
import type { CreateCollectionMutation, DeleteCollectionMutation, DeleteItemMutation } from './gql/graphql';

type Validation = Extract<CreateCollectionMutation['createCollection'], { __typename: 'ValidationFailure' }>;
export function validation(value: Validation): WriteOutcome {
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
export function missing(value: Missing): WriteOutcome {
  return value.resources.length
    ? { status: 'rejected', rejection: { kind: 'missing', resources: value.resources } }
    : protocolFailure();
}
type Conflict = Extract<CreateCollectionMutation['createCollection'], { __typename: 'Conflict' }>;
export function conflict(value: Conflict): WriteOutcome {
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
