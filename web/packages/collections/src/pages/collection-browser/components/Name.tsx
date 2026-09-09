import type { CollectionAndItem } from '../types';
import { buttonVariants } from 'ui/components/button';
import { Link, createSearchParams } from 'react-router';

export default function Name({ name, id, __typename }: CollectionAndItem) {
  if (__typename === 'Item') {
    return (
      <Link
        to={`/collections/item/${id}`}
        className={buttonVariants({ variant: 'link', className: 'text-foreground w-fit px-0 text-left' })}
      >
        {name}
      </Link>
    );
  }
  return (
    <Link
      to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}
      className={buttonVariants({ variant: 'link', className: 'text-foreground w-fit px-0 text-left' })}
    >
      {name}
    </Link>
  );
}
