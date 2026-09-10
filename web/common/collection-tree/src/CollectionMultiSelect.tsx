import { useI18n } from 'i18n';
import { Badge } from 'ui/components/badge';
import { Button } from 'ui/components/button';
import { X } from 'lucide-react';
import { CollectionPicker } from './CollectionPicker';
import type { CollectionOption } from './tree';

export interface CollectionMultiSelectProps {
  allCollections: ReadonlyMap<number, CollectionOption>;
  disabled?: boolean;
  onChange: (newValue: number[] | null | undefined) => void;
  value: number[] | null | undefined;
}

export function CollectionMultiSelect({
  allCollections,
  onChange,
  value,
  disabled = false,
}: CollectionMultiSelectProps) {
  const t = useI18n();
  const selected = [...new Set(value ?? [])];
  return (
    <div className="flex min-w-0 flex-wrap gap-1 items-center">
      {selected.map((id) => {
        const path = allCollections.get(id)?.path ?? `#${id}`;
        return (
          <Badge key={id} variant="secondary" className="max-w-full">
            <span className="truncate" title={path}>
              {path}
            </span>
            <Button
              type="button"
              aria-label={t('remove_association', { name: path })}
              disabled={disabled}
              variant="ghost"
              size="icon-sm"
              className="size-6 shrink-0 rounded-full"
              onClick={() => {
                if (!disabled) onChange(selected.filter((item) => item !== id));
              }}
            >
              <X />
            </Button>
          </Badge>
        );
      })}
      <CollectionPicker
        multiple
        allCollections={allCollections}
        value={selected}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}
