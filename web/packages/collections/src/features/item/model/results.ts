import { protocolFailure, saved, type WriteOutcome } from 'custom-graphql';
import { validation, missing, conflict } from '@collections/results';
import type {
  CreateItemMutation,
  UpdateItemMutation,
  AddCollectionForItemMutation,
  DeleteCollectionForItemMutation,
} from '@collections/gql/graphql';
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
