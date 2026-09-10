import { Fragment, useId, useState, type ReactNode } from 'react';
import { useI18n } from 'i18n';
import { ArrowLeft, ChevronRight, Folder, Plus, X } from 'lucide-react';
import { Badge } from 'ui/components/badge';
import { Button } from 'ui/components/button';
import { Checkbox } from 'ui/components/checkbox';
import { Input } from 'ui/components/input';
import { RadioGroup, RadioGroupItem } from 'ui/components/radio-group';
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbSeparator } from 'ui/components/breadcrumb';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ui/components/dialog';
import { cn } from 'ui/lib/utils';
import type { CollectionOption } from './tree';

interface CollectionPickerProps {
  allCollections: ReadonlyMap<number, CollectionOption>;
  value: readonly number[];
  onChange: (value: number[]) => void;
  multiple?: boolean;
  disabled?: boolean;
  errorId?: string;
  triggerLabel?: ReactNode;
}

export function CollectionPicker({
  allCollections,
  value,
  onChange,
  multiple = false,
  disabled = false,
  errorId,
  triggerLabel,
}: CollectionPickerProps) {
  const t = useI18n();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<number[]>([]);
  const [location, setLocation] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  if (disabled && open) setOpen(false);
  const selected = new Set(draft);
  const collections = [...allCollections.values()];
  const children = new Map<number | null, CollectionOption[]>();
  for (const item of collections) {
    const parent = item.parentId ?? null;
    const siblings = children.get(parent) ?? [];
    siblings.push(item);
    children.set(parent, siblings);
  }
  const ancestry: CollectionOption[] = [];
  const seen = new Set<number>();
  let current = location === null ? undefined : allCollections.get(location);
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    ancestry.unshift(current);
    current = current.parentId == null ? undefined : allCollections.get(current.parentId);
  }
  const columns = [null, ...ancestry.map((item) => item.id)].slice(-3);
  const query = search.trim().toLocaleLowerCase();
  const matches = query
    ? collections.filter((item) => `${item.name} ${item.path}`.toLocaleLowerCase().includes(query))
    : [];
  const changeOpen = (next: boolean) => {
    if (next && disabled) return;
    if (next) {
      setDraft([...new Set(value)]);
      setLocation(allCollections.get(value[0] ?? -1)?.parentId ?? null);
      setSearch('');
    }
    setOpen(next);
  };
  const toggle = (itemId: number, checked: boolean) => {
    if (disabled) return;
    setDraft((ids) => (checked ? [...new Set([...ids, itemId])] : ids.filter((value) => value !== itemId)));
  };
  const browse = (itemId: number) => {
    setLocation(itemId);
    setSearch('');
  };
  const row = (item: CollectionOption, showPath = false) => (
    <li
      key={item.id}
      className={cn('flex items-center gap-2 rounded-md px-2 py-1.5', selected.has(item.id) && 'bg-accent')}
    >
      {multiple ? (
        <Checkbox
          aria-label={item.path}
          checked={selected.has(item.id)}
          disabled={disabled}
          onCheckedChange={(checked) => toggle(item.id, checked)}
        />
      ) : (
        <RadioGroupItem aria-label={item.path} value={String(item.id)} disabled={disabled} />
      )}
      <Button
        type="button"
        variant="ghost"
        disabled={disabled}
        className="h-auto min-w-0 flex-1 justify-start px-1 text-left font-normal"
        aria-label={t('browse_collection', { name: item.path })}
        onClick={() => browse(item.id)}
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate" title={item.path}>
            {item.name}
          </span>
          {showPath && (
            <span className="block truncate text-xs text-muted-foreground" title={item.path}>
              {item.path}
            </span>
          )}
        </span>
        {!!children.get(item.id)?.length && <ChevronRight className="shrink-0" />}
      </Button>
    </li>
  );
  const browser = query ? (
    <section className="h-64 overflow-y-auto" aria-label={t('collection_search_results')}>
      <ul className="flex flex-col gap-1">{matches.map((item) => row(item, true))}</ul>
      {!matches.length && <p className="p-4 text-sm text-muted-foreground">{t('no_collection_matches')}</p>}
    </section>
  ) : (
    <div className="grid min-h-0 sm:grid-cols-3" data-slot="collection-columns">
      {columns.map((parentId, index) => (
        <section
          key={parentId ?? 'root'}
          className={cn(
            'min-w-0 border-border sm:border-r sm:last:border-r-0',
            index !== columns.length - 1 && 'hidden sm:block',
          )}
          aria-label={parentId === null ? t('all_collections') : allCollections.get(parentId)?.path}
        >
          <div className="flex items-center gap-2 border-b px-3 py-2 text-sm font-medium">
            <Folder className="size-4 shrink-0" />
            <span className="truncate">
              {parentId === null ? t('all_collections') : allCollections.get(parentId)?.name}
            </span>
          </div>
          <div className="h-56 overflow-y-auto p-1">
            <ul className="flex flex-col gap-1">{(children.get(parentId) ?? []).map((item) => row(item))}</ul>
            {!children.get(parentId)?.length && (
              <p className="p-3 text-sm text-muted-foreground">{t('no_child_collections')}</p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
  return (
    <Dialog open={open && !disabled} onOpenChange={changeOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant={multiple ? 'ghost' : 'outline'}
            size={multiple ? 'icon-sm' : 'default'}
            disabled={disabled}
            aria-label={multiple ? t('add_collection') : t('select_collection')}
            aria-invalid={!!errorId}
            aria-describedby={errorId}
            className={multiple ? 'rounded-full' : 'min-w-0 max-w-full justify-start'}
          />
        }
      >
        {multiple ? <Plus /> : <span className="truncate">{triggerLabel ?? t('select_collection')}</span>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{t('select_collection')}</DialogTitle>
          <DialogDescription>{t('collection_picker_hint')}</DialogDescription>
        </DialogHeader>
        <Input
          id={`${id}-search`}
          aria-label={t('search_collections')}
          placeholder={t('search_collections')}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          disabled={disabled}
        />
        <div className="flex min-w-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disabled || !ancestry.length}
            aria-label={t('back')}
            onClick={() => {
              setLocation(ancestry.at(-1)?.parentId ?? null);
              setSearch('');
            }}
          >
            <ArrowLeft />
          </Button>
          <Breadcrumb className="min-w-0 flex-1 overflow-x-auto">
            <BreadcrumbList className="flex-nowrap w-max">
              <BreadcrumbItem>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => {
                    setLocation(null);
                    setSearch('');
                  }}
                >
                  {t('all_collections')}
                </Button>
              </BreadcrumbItem>
              {ancestry.map((item) => (
                <Fragment key={item.id}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto max-w-48 truncate p-0"
                      title={item.path}
                      onClick={() => browse(item.id)}
                    >
                      {item.name}
                    </Button>
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="overflow-hidden rounded-lg border">
          {multiple ? (
            browser
          ) : (
            <RadioGroup
              aria-label={t('select_collection')}
              value={draft[0] === undefined ? null : String(draft[0])}
              onValueChange={(next) => {
                if (!disabled) setDraft(next === null ? [] : [Number(next)]);
              }}
            >
              {browser}
            </RadioGroup>
          )}
        </div>
        <section className="flex min-w-0 flex-col gap-2" aria-label={t('selected_collections')}>
          <p className="text-sm text-muted-foreground">
            {t('selected_collections')} ({draft.length})
          </p>
          <div className="flex max-h-28 flex-wrap gap-1 overflow-y-auto">
            {draft.map((itemId) => {
              const path = allCollections.get(itemId)?.path ?? `#${itemId}`;
              return (
                <Badge key={itemId} variant="secondary" className="max-w-full">
                  <span className="truncate" title={path}>
                    {path}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="size-5 shrink-0"
                    aria-label={t('remove_association', { name: path })}
                    disabled={disabled}
                    onClick={() => toggle(itemId, false)}
                  >
                    <X />
                  </Button>
                </Badge>
              );
            })}
          </div>
        </section>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="secondary" />}>{t('cancel')}</DialogClose>
          <Button
            type="button"
            disabled={disabled}
            onClick={() => {
              if (disabled) return;
              const next = [...new Set(draft)];
              if (next.length !== value.length || next.some((item, index) => item !== value[index])) onChange(next);
              setOpen(false);
            }}
          >
            {t('confirm_selection')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
