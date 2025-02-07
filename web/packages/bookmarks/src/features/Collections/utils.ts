import type { AllCollectionItem, CollectionTreeItem } from './collectionSlice';

export function getCollectionTreeFromCollectionList(data: Iterable<AllCollectionItem>): CollectionTreeItem[] {
  const list = [...data];
  const result: CollectionTreeItem[] = [];
  const lookup = new Map<number, AllCollectionItem[]>();
  for (const collection of list) {
    if (collection.parentId !== null && collection.parentId !== undefined) {
      const list = lookup.get(collection.parentId);
      if (list) {
        list.push(collection);
      } else {
        lookup.set(collection.parentId, [collection]);
      }
    }
    if (!lookup.has(collection.id)) {
      lookup.set(collection.id, []);
    }
  }
  for (const collection of list) {
    if (collection.parentId === null || collection.parentId === undefined) {
      result.push(getTreeItem(collection, lookup));
    }
  }
  return result;
}

function getTreeItem(value: AllCollectionItem, lookup: Map<number, AllCollectionItem[]>): CollectionTreeItem {
  const children = lookup.get(value.id);
  if (!children) {
    return {
      ...value,
      children: [],
    };
  }
  return {
    ...value,
    children: children.map((value) => getTreeItem(value, lookup)),
  };
}
