/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-23 00:25:08
 * @FilePath: /self-tools/web/packages/bookmarks/src/components/CollectionSelect/index.tsx
 */
import { Collapse, FormHelperText, IconButton, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { useMemo, useState } from 'react';
import { AllCollectionItem, CollectionTreeItem } from '@bookmarks/features/Collections/collectionSlice';
import { getCollectionTreeFromCollectionList } from '@bookmarks/features/Collections/utils';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import { match } from 'ts-pattern';

export interface CollectionSelectProps {
  allCollections: Map<number, AllCollectionItem>;
  value: number | null;
  onChange: (value: number | null) => void;
  errorMessage?: string;
}

export default function CollectionSelect({ allCollections, value, onChange, errorMessage }: CollectionSelectProps) {
  const treeData = useMemo(() => getCollectionTreeFromCollectionList(allCollections.values()), [allCollections]);

  return (
    <List>
      {treeData.map((item) => (
        <CollectionItem value={item} key={item.id} selected={value} setSelected={onChange} />
      ))}
      <FormHelperText sx={{ ml: 2, mr: 2 }} error>
        {errorMessage}
      </FormHelperText>
    </List>
  );
}

interface CollectionItemProps {
  value: CollectionTreeItem;
  selected: number | null;
  setSelected: (value: number | null) => void;
}

function CollectionItem({ value: { path, description, id, children }, selected, setSelected }: CollectionItemProps) {
  const [open, setOpen] = useState(true);

  const handleClick = () => {
    setOpen(!open);
  };
  const handleSelect = () => {
    if (selected === id) {
      setSelected(null);
    } else {
      setSelected(id);
    }
  };
  const hasChildren = children.length > 0;
  if (!hasChildren) {
    return (
      <ListItem disablePadding>
        <ListItemButton onClick={handleSelect} selected={id === selected}>
          <ListItemText primary={path} secondary={description} />
        </ListItemButton>
      </ListItem>
    );
  }
  return (
    <>
      <ListItem
        disablePadding
        secondaryAction={
          <IconButton onClick={handleClick} edge="start">
            {match(open)
              .with(true, () => <ExpandLess />)
              .with(false, () => <ExpandMore />)
              .exhaustive()}
          </IconButton>
        }
        dense
      >
        <ListItemButton dense onClick={handleSelect} selected={id === selected}>
          <ListItemText primary={path} secondary={description} />
        </ListItemButton>
      </ListItem>
      <CollectionList open={open} selected={selected} setSelected={setSelected}>
        {children}
      </CollectionList>
    </>
  );
}

interface CollectionListProps {
  children: CollectionTreeItem[];
  selected: number | null;
  setSelected: (value: number | null) => void;
  open: boolean;
}

function CollectionList({ open, children, selected, setSelected }: CollectionListProps) {
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <List disablePadding dense sx={{ pl: 2 }}>
        {children.map((item) => (
          <CollectionItem selected={selected} setSelected={setSelected} value={item} key={item.id} />
        ))}
      </List>
    </Collapse>
  );
}
