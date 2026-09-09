import { protocolFailure, saved, type WriteOutcome } from 'custom-graphql';
import { validation, missing, conflict } from '@collections/results';
import type { CreateCollectionMutation, UpdateCollectionMutation } from '@collections/gql/graphql';
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
