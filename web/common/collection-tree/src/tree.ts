export interface CollectionOption {
  id: number;
  parentId?: number | null;
  name: string;
  path: string;
}
export type CollectionTreeNode = CollectionOption & { children: CollectionTreeNode[] };

export function buildCollectionTree(data: Iterable<CollectionOption>): CollectionTreeNode[] {
  const list = [...data];
  const result: CollectionTreeNode[] = [];
  const lookup = new Map<number, CollectionOption[]>();
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

function getTreeItem(value: CollectionOption, lookup: Map<number, CollectionOption[]>): CollectionTreeNode {
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
