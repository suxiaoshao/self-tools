import { useWriteAction, WriteNotice, rejectionFieldErrors, type WriteOutcome } from 'custom-graphql';
import { Edit as EditIcon, View } from 'lucide-react';
import { useI18n } from 'i18n';
import { useRef, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import CustomEdit from '../../../components/CustomEdit';
import Markdown from '../../../components/Markdown';
import CollectionMultiSelect from '@collections/components/CollectionMultiSelect';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@portal/components/ui/dialog';
import { Button } from '@portal/components/ui/button';
import { FieldGroup, FieldLabel, Field } from '@portal/components/ui/field';
import { Input } from '@portal/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@portal/components/ui/toggle-group';

export type ItemEditData = { name: string; content: string };
export type ItemCreateData = ItemEditData & { collectionIds: number[] };

type ItemFormProps = { handleClose: () => void } & (
  | {
      mode: 'create';
      initialValues: ItemCreateData;
      afterSubmit: (data: ItemCreateData) => Promise<WriteOutcome>;
      checkResult?: never;
    }
  | {
      mode: 'edit';
      initialValues: ItemEditData;
      afterSubmit: (data: ItemEditData) => Promise<WriteOutcome>;
      checkResult: (data: ItemEditData) => Promise<boolean>;
    }
);

/** Mount once per dialog session, after the required content has loaded. */
export default function ItemForm(props: ItemFormProps) {
  const { mode, initialValues, handleClose, checkResult } = props;
  const {
    handleSubmit,
    register,
    control,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ItemEditData>({ defaultValues: { name: initialValues.name, content: initialValues.content } });
  const [collectionIds, setCollectionIds] = useState(() =>
    props.mode === 'create' ? [...props.initialValues.collectionIds] : [],
  );
  const [collectionError, setCollectionError] = useState<string>();
  const submitted = useRef<ItemEditData | undefined>(undefined);
  const action = useWriteAction();
  const onSubmit: SubmitHandler<ItemEditData> = async (data) => {
    const result = await action.run(() => {
      clearErrors();
      setCollectionError(undefined);
      const snapshot = { name: data.name, content: data.content };
      submitted.current = snapshot;
      return props.mode === 'create'
        ? props.afterSubmit({ ...snapshot, collectionIds: [...collectionIds] })
        : props.afterSubmit(snapshot);
    });
    for (const issue of rejectionFieldErrors(result)) {
      const field = issue.path[0];
      if (field === 'name' || field === 'content') setError(field, { type: 'server', message: t('request_invalid') });
      if (field === 'collectionIds') setCollectionError(t('request_invalid'));
    }
    if (result?.status === 'saved') handleClose();
  };
  const [alignment, setAlignment] = useState<'edit' | 'preview'>('edit');
  const handleAlignment = (newAlignment: string) => {
    match(newAlignment)
      .with('edit', () => setAlignment('edit'))
      .with('preview', () => setAlignment('preview'))
      .otherwise(() => setAlignment('edit'));
  };
  const t = useI18n();
  return (
    <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col sm:max-w-5xl">
      <DialogHeader className="shrink-0">
        <DialogTitle>
          {match(mode)
            .with('create', () => t('create_item'))
            .otherwise(() => t('modify_item'))}
        </DialogTitle>
      </DialogHeader>
      <div className="min-h-0 overflow-y-auto">
        <fieldset disabled={action.blocked}>
          <FieldGroup className="w-full">
            <Field>
              <FieldLabel>{t('item_name')}</FieldLabel>
              <Input aria-invalid={!!errors.name} required {...register('name', { required: true })} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </Field>
            {mode === 'create' && (
              <Field>
                <FieldLabel>{t('match_collections')}</FieldLabel>
                <CollectionMultiSelect
                  disabled={action.blocked}
                  value={collectionIds}
                  onChange={(ids) => setCollectionIds(ids ?? [])}
                  onBlur={undefined}
                  ref={null}
                />
                {collectionError && <p className="text-sm text-destructive">{collectionError}</p>}
              </Field>
            )}

            <Controller
              control={control}
              name="content"
              rules={{ required: true }}
              render={({ field }) => (
                <Field>
                  <FieldLabel className="w-full flex items-center justify-between">
                    <span>{t('content')}</span>
                    <ToggleGroup
                      variant="outline"
                      value={[alignment]}
                      onValueChange={(newAlignment) => handleAlignment(newAlignment[0] ?? 'edit')}
                    >
                      <ToggleGroupItem value="edit">
                        <EditIcon />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="preview">
                        <View />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </FieldLabel>
                  {match(alignment)
                    .with('edit', () => (
                      <CustomEdit
                        wordWrap="on"
                        className="w-full h-[500px] rounded-lg"
                        language="markdown"
                        readOnly={action.blocked}
                        {...field}
                      />
                    ))
                    .otherwise(() => (
                      <Markdown className="w-full overflow-y-auto h-[500px]" value={field.value ?? ''} />
                    ))}
                </Field>
              )}
            />
          </FieldGroup>
        </fieldset>
      </div>
      <WriteNotice
        outcome={action.outcome}
        pending={action.pending}
        viewHref="/collections/collections"
        check={
          checkResult
            ? async () => {
                const snapshot = submitted.current;
                if (snapshot && (await action.check(() => checkResult(snapshot)))) handleClose();
              }
            : undefined
        }
      />
      <DialogFooter className="shrink-0">
        <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
        <Button
          disabled={action.blocked}
          onClick={() => {
            handleSubmit(onSubmit)();
          }}
        >
          {t('submit')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
