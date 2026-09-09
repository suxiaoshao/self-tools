import { useWriteAction, WriteNotice, rejectionFieldErrors, type WriteOutcome } from 'custom-graphql';
import { Edit as EditIcon, View } from 'lucide-react';
import { useI18n } from 'i18n';
import { useId, useRef, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import CustomEdit from 'edit/form';
import Markdown from 'markdown';
import { CollectionMultiSelect } from '@collections/entities/collection';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from 'ui/components/dialog';
import { Button } from 'ui/components/button';
import { FieldError, FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { Input } from 'ui/components/input';
import { ToggleGroup, ToggleGroupItem } from 'ui/components/toggle-group';

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
  const formId = useId();
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
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor={`${formId}-name`}>{t('item_name')}</FieldLabel>
              <Input
                id={`${formId}-name`}
                aria-describedby={errors.name ? `${formId}-name-error` : undefined}
                aria-invalid={!!errors.name}
                required
                {...register('name', { required: t('request_required') })}
              />
              <FieldError
                id={`${formId}-name-error`}
                errors={[
                  errors.name && {
                    ...errors.name,
                    message: errors.name?.type === 'required' ? t('request_required') : errors.name.message,
                  },
                ]}
              />
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
              rules={{ required: t('request_required') }}
              render={({ field }) => (
                <Field data-invalid={!!errors.content}>
                  <div className="w-full flex items-center justify-between">
                    <FieldLabel id={`${formId}-content-label`}>{t('content')}</FieldLabel>
                    <ToggleGroup
                      variant="outline"
                      value={[alignment]}
                      onValueChange={(newAlignment) => handleAlignment(newAlignment[0] ?? 'edit')}
                    >
                      <ToggleGroupItem value="edit" aria-label={t('edit')}>
                        <EditIcon />
                      </ToggleGroupItem>
                      <ToggleGroupItem value="preview" aria-label={t('preview')}>
                        <View />
                      </ToggleGroupItem>
                    </ToggleGroup>
                  </div>
                  {match(alignment)
                    .with('edit', () => (
                      <CustomEdit
                        aria-label={t('content')}
                        aria-labelledby={`${formId}-content-label`}
                        aria-invalid={!!errors.content}
                        aria-describedby={errors.content ? `${formId}-content-error` : undefined}
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
                  <FieldError
                    id={`${formId}-content-error`}
                    errors={[
                      errors.content && {
                        ...errors.content,
                        message: errors.content?.type === 'required' ? t('request_required') : errors.content.message,
                      },
                    ]}
                  />
                </Field>
              )}
            />
          </FieldGroup>
        </fieldset>
      </div>
      <WriteNotice
        fieldLabels={{ name: t('item_name'), content: t('content'), collectionIds: t('match_collections') }}
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
