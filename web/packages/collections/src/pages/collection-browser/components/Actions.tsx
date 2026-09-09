import { CollectionActions } from '@collections/features/collection';
import { ItemActions } from '@collections/features/item';
import type { CollectionAndItem } from '../types';

export default function Actions(props: CollectionAndItem & { refetch: () => void }) {
  return props.__typename === 'Collection' ? (
    <CollectionActions {...props} />
  ) : (
    <ItemActions id={props.id} refetch={props.refetch} editable />
  );
}
