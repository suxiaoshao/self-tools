import { useMemo } from 'react';
import { useI18n } from 'i18n';
import { useDialog } from 'hooks';
import { Controller, useForm } from 'react-hook-form';
import { number, object, type InferInput } from 'valibot';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Badge } from 'ui/components/badge';
import { Button } from 'ui/components/button';
import { Popover, PopoverContent, PopoverTrigger } from 'ui/components/popover';
import { Plus, X } from 'lucide-react';
import { CollectionSelect } from './CollectionSelect';
import type { CollectionOption } from './tree';

const selectCollectionSchema = object({ collectionId: number() });
type SelectCollectionType = InferInput<typeof selectCollectionSchema>;

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
  const selectList = useMemo(
    () => value?.map((id) => allCollections.get(id)).filter((item) => item !== undefined) ?? [],
    [allCollections, value],
  );

  const t = useI18n();
  const onDelete = (id: number) => {
    if (!value) {
      return;
    }
    onChange(value.filter((item) => item !== id));
  };

  const { reset, control, handleSubmit } = useForm<SelectCollectionType>({
    resolver: valibotResolver(object({ collectionId: number(t('request_required')) })),
  });

  const { open, handleOpenChange, handleClose } = useDialog();

  const onClose = () => {
    reset();
    handleClose();
  };
  const onSubmit = handleSubmit(({ collectionId }) => {
    if (!value) {
      onChange([collectionId]);
      onClose();
      return;
    }
    if (!value.includes(collectionId)) {
      onChange([...value, collectionId]);
    }
    onClose();
  });

  return (
    <div className="flex gap-1 items-center">
      {selectList.map(({ path, id }) => (
        <Badge key={id} variant="secondary">
          {path}
          <Button
            aria-label={t('remove_association', { name: path })}
            disabled={disabled}
            variant="ghost"
            size="icon-sm"
            className="data-[state=open]:bg-muted size-6 rounded-full"
            onClick={() => {
              onDelete(id);
            }}
          >
            <X />
          </Button>
        </Badge>
      ))}
      <Popover open={open && !disabled} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button
              aria-label={t('add_collection')}
              disabled={disabled}
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
            />
          }
        >
          <Plus />
        </PopoverTrigger>
        <PopoverContent>
          <Controller
            control={control}
            name="collectionId"
            render={({ field, fieldState }) => (
              <CollectionSelect {...field} allCollections={allCollections} errorMessage={fieldState.error?.message} />
            )}
          />
          <div className="flex flex-row-reverse w-full">
            <Button onClick={onSubmit}>{t('submit')}</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
