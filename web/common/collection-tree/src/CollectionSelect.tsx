import { buildCollectionTree, type CollectionOption, type CollectionTreeNode } from './tree';
import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import {
  SidebarContent,
  SidebarGroup,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
} from 'ui/components/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui/components/collapsible';
import { FieldError } from 'ui/components/field';

export interface CollectionSelectProps {
  allCollections: ReadonlyMap<number, CollectionOption>;
  value: number | null;
  onChange: (value: number | null) => void;
  errorMessage?: string;
}

export function CollectionSelect({ allCollections, value, onChange, errorMessage }: CollectionSelectProps) {
  const treeData = useMemo(() => buildCollectionTree(allCollections.values()), [allCollections]);

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
  value: CollectionTreeNode;
  selected: number | null;
  setSelected: (value: number | null) => void;
}

function CollectionItem({ value: { path, id, children }, selected, setSelected }: CollectionItemProps) {
  const handleSelect = () => {
    setSelected(id);
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
  children: CollectionTreeNode[];
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
