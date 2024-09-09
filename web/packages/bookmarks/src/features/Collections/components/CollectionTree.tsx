import { List, ListItem, ListItemText } from '@mui/material';
import { CollectionTreeItem } from '../collectionSlice';

export interface CollectionTreeProps {
  value: CollectionTreeItem[];
}

export default function CollectionTree({ value }: CollectionTreeProps) {
  return (
    <List>
      {value.map(({ name, path, id }) => (
        <ListItem key={id}>
          <ListItemText primary={name} secondary={path} />
        </ListItem>
      ))}
    </List>
  );
}
