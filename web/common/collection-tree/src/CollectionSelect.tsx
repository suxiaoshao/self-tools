import { buildCollectionTree, type CollectionOption, type CollectionTreeNode } from './tree';
import { useMemo, useId, type Ref } from 'react';
import { useI18n } from 'i18n';
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
  disabled?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function CollectionSelect({
  allCollections,
  value,
  onChange,
  errorMessage,
  disabled,
  ref,
}: CollectionSelectProps) {
  const t = useI18n();
  const errorId = useId();
  const treeData = useMemo(() => buildCollectionTree(allCollections.values()), [allCollections]);

  return (
    <SidebarContent
      ref={ref}
      tabIndex={-1}
      aria-label={t('select_collection')}
      data-invalid={!!errorMessage}
      aria-describedby={errorMessage ? errorId : undefined}
    >
      <SidebarGroup>
        <ul>
          {treeData.map((item) => (
            <CollectionItem value={item} key={item.id} selected={value} setSelected={onChange} disabled={disabled} />
          ))}
        </ul>
        <FieldError id={errorId} errors={[{ message: errorMessage }]} />
      </SidebarGroup>
    </SidebarContent>
  );
}

interface CollectionItemProps {
  value: CollectionTreeNode;
  selected: number | null;
  setSelected: (value: number | null) => void;
  disabled?: boolean;
}

function CollectionItem({ value: { path, id, children }, selected, setSelected, disabled }: CollectionItemProps) {
  const handleSelect = () => {
    setSelected(id);
  };
  const hasChildren = children.length > 0;
  if (!hasChildren) {
    return (
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled={disabled}
          aria-pressed={id === selected}
          onClick={handleSelect}
          isActive={id === selected}
        >
          {path}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuItem>
      <Collapsible defaultOpen className="group/collapsible">
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              disabled={disabled}
              aria-pressed={id === selected}
              onClick={handleSelect}
              isActive={id === selected}
            />
          }
        >
          {path}
          <ChevronRight className="transition-transform ml-auto group-data-[state=open]/collapsible:rotate-90" />
        </CollapsibleTrigger>
        <CollectionList disabled={disabled} selected={selected} setSelected={setSelected}>
          {children}
        </CollectionList>
      </Collapsible>
    </SidebarMenuItem>
  );
}

interface CollectionListProps {
  children: CollectionTreeNode[];
  selected: number | null;
  setSelected: (value: number | null) => void;
  disabled?: boolean;
}

function CollectionList({ children, selected, setSelected, disabled }: CollectionListProps) {
  return (
    <CollapsibleContent>
      <SidebarMenuSub>
        {children.map((item) => (
          <CollectionItem
            disabled={disabled}
            selected={selected}
            setSelected={setSelected}
            value={item}
            key={item.id}
          />
        ))}
      </SidebarMenuSub>
    </CollapsibleContent>
  );
}
