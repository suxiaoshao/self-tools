/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-23 00:25:08
 * @FilePath: /self-tools/web/packages/bookmarks/src/components/CollectionSelect/index.tsx
 */
import { useMemo } from 'react';
import type { AllCollectionItem, CollectionTreeItem } from '@bookmarks/features/Collections/collectionSlice';
import { getCollectionTreeFromCollectionList } from '@bookmarks/features/Collections/utils';
import { ChevronRight } from 'lucide-react';
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from '@portal/components/ui/sidebar';
import { FieldError } from '@portal/components/ui/field';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@portal/components/ui/collapsible';

interface CollectionSelectProps {
  allCollections: Map<number, AllCollectionItem>;
  value: number | null;
  onChange: (value: number | null) => void;
  errorMessage?: string;
}

export default function CollectionSelect({ allCollections, value, onChange, errorMessage }: CollectionSelectProps) {
  const treeData = useMemo(() => getCollectionTreeFromCollectionList(allCollections.values()), [allCollections]);

  return (
    <SidebarContent>
      <SidebarGroup>
        {treeData.map((item) => (
          <CollectionItem value={item} key={item.id} selected={value} setSelected={onChange} />
        ))}
        <FieldError errors={[{ message: errorMessage }]} />
      </SidebarGroup>
    </SidebarContent>
  );
}

interface CollectionItemProps {
  value: CollectionTreeItem;
  selected: number | null;
  setSelected: (value: number | null) => void;
}

function CollectionItem({ value: { path, id, children }, selected, setSelected }: CollectionItemProps) {
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
      <SidebarMenuItem>
        <SidebarMenuButton onClick={handleSelect} isActive={id === selected}>
          {path}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger render={<SidebarMenuButton onClick={handleSelect} isActive={id === selected} />}>
          {path}
          <ChevronRight className="transition-transform ml-auto group-data-[state=open]/collapsible:rotate-90" />
        </CollapsibleTrigger>
      </SidebarMenuItem>
      <CollectionList selected={selected} setSelected={setSelected}>
        {children}
      </CollectionList>
    </Collapsible>
  );
}

interface CollectionListProps {
  children: CollectionTreeItem[];
  selected: number | null;
  setSelected: (value: number | null) => void;
}

function CollectionList({ children, selected, setSelected }: CollectionListProps) {
  return (
    <CollapsibleContent>
      <SidebarMenuSub>
        {children.map((item) => (
          <CollectionItem selected={selected} setSelected={setSelected} value={item} key={item.id} />
        ))}
      </SidebarMenuSub>
    </CollapsibleContent>
  );
}
