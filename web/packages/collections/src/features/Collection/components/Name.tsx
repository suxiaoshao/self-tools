import { CollectionAndItem } from '../hooks/useTableColumns';
import { Link } from '@mui/material';
import { Link as RouterLink, createSearchParams } from 'react-router-dom';

export default function Name({ name, id, __typename }: CollectionAndItem) {
  if (__typename === 'Item') {
    return <Link>{name}</Link>;
  }
  return (
    <Link component={RouterLink} to={{ search: createSearchParams({ parentId: id.toString() }).toString() }}>
      {name}
    </Link>
  );
}
