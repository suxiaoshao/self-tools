/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-23 00:25:08
 * @FilePath: /self-tools/web/packages/bookmarks/src/components/CollectionSelect/index.tsx
 */
import {
  type AllCollectionItem,
  CollectionLoadingState,
  useAllCollection,
} from '@collections/features/Collection/collectionSlice';
import { useI18n } from 'i18n';
import React, {
  type ComponentProps,
  type FocusEventHandler,
  type ForwardedRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { match } from 'ts-pattern';
import CollectionSelect from '../CollectionSelect';
import { Controller, useForm } from 'react-hook-form';
import { number, object, type InferInput } from 'valibot';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { cn } from '@portal/lib/utils';
import { Badge } from '@portal/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { Button } from '@portal/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@portal/components/ui/popover';
import { Spinner } from '@portal/components/ui/spinner';
import useDialog from '@collections/hooks/useDialog';

const selectCollectionSchema = object({
  collectionId: number(),
});

type SelectCollectionType = InferInput<typeof selectCollectionSchema>;

export interface CollectionMultiSelectProps extends Omit<
  ComponentProps<'div'>,
  'name' | 'onChange' | 'onBlur' | 'value'
> {
  onChange: (newValue: number[] | null | undefined) => void;
  onBlur: FocusEventHandler<HTMLInputElement> | undefined;
  value: number[] | null | undefined;
  ref: ForwardedRef<HTMLDivElement | null>;
}

function CollectionMultiSelect({ onChange, value, className, ref, ...props }: CollectionMultiSelectProps) {
  const { value: allCollection, fetchData } = useAllCollection();
  const t = useI18n();
  const content = useMemo(
    () =>
      match(allCollection)
        .with({ tag: CollectionLoadingState.init }, () => null)
        .with({ tag: CollectionLoadingState.error }, ({ value }) => (
          <div>
            {value.toString()} <Button onClick={fetchData}>{t('refresh')}</Button>
          </div>
        ))
        .with({ tag: CollectionLoadingState.loading }, () => <Spinner />)
        .with({ tag: CollectionLoadingState.state }, ({ value: allCollections }) => (
          <InnerCollectionSelect onChange={onChange} value={value} allCollections={allCollections} />
        ))
        .otherwise(() => null),
    [allCollection, value, fetchData, onChange, t],
  );
  const [sourceRef, setSourceRef] = React.useState<HTMLDivElement | null>(null);
  useImperativeHandle<HTMLDivElement | null, HTMLDivElement | null>(ref, () => sourceRef, [sourceRef]);
  return (
    <div {...props} ref={setSourceRef} className={cn('flex items-center', className)}>
      {content}
    </div>
  );
}

export default CollectionMultiSelect;

interface InnerCollectionSelectProps {
  allCollections: Map<number, AllCollectionItem>;
  onChange: (newValue: number[] | null | undefined) => void;
  value: number[] | null | undefined;
}

function InnerCollectionSelect({ allCollections, onChange, value }: InnerCollectionSelectProps) {
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
    resolver: valibotResolver(selectCollectionSchema),
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
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger render={<Button variant="ghost" size="icon-sm" className="rounded-full" />}>
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
