import type { CollectionAndItem } from '../types';
import { Button } from '@portal/components/ui/button';
import { Link, createSearchParams } from 'react-router-dom';

export default function Name({ name, id, __typename }: CollectionAndItem) {
  if (__typename === 'Item') {
    return (
      <Button variant="link" className="text-foreground w-fit px-0 text-left">
        <Link to={`/collections/item/${id}`}>{name}</Link>
      </Button>
    );
  }
  return (
    <Button variant="link" className="text-foreground w-fit px-0 text-left">
      <Link to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}>{name}</Link>
    </Button>
  );
}
