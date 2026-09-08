import { RequestNotice, useWriteAction, WriteNotice, rejectionFieldErrors, type WriteOutcome } from 'custom-graphql';
import { Edit as EditIcon, View } from 'lucide-react';
import { useI18n } from 'i18n';
import { useEffect, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import CustomEdit from '../../../components/CustomEdit';
import Markdown from '../../../components/Markdown';
import CollectionMultiSelect from '@collections/components/CollectionMultiSelect';
import { array, type InferInput, integer, number, object, pipe, string } from 'valibot';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@portal/components/ui/dialog';
import { Button } from '@portal/components/ui/button';
import { FieldGroup, FieldLabel, Field } from '@portal/components/ui/field';
import { Input } from '@portal/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@portal/components/ui/toggle-group';

const itemFormSchema = object({
  collectionIds: array(pipe(number(), integer())),
  name: string(),
  content: string(),
});

export type ItemFormData = InferInput<typeof itemFormSchema>;

interface ItemFormProps {
  afterSubmit?: (data: ItemFormData) => Promise<WriteOutcome>;
  handleClose: () => void;
  checkResult?: (data: ItemFormData) => Promise<boolean>;
  mode?: 'create' | 'edit';
  initialValues?: ItemFormData;
  loading?: boolean;
  readError?: unknown;
  retryRead?: () => unknown;
}

export default function ItemForm({
  afterSubmit,
  handleClose,
  mode,
  initialValues,
  loading,
  checkResult,
  readError,
  retryRead,
}: ItemFormProps) {
  // 表单控制
  const {
    handleSubmit,
    register,
    control,
    setValue,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = useForm<ItemFormData>({ defaultValues: initialValues });
  useEffect(() => {
    if (initialValues) {
      setValue('name', initialValues?.name);
      setValue('content', initialValues?.content);
      setValue('collectionIds', initialValues.collectionIds);
    }
  }, [initialValues, setValue]);
  const action = useWriteAction();
  const onSubmit: SubmitHandler<ItemFormData> = async (data) => {
    if (!afterSubmit) return;
    clearErrors();
    const result = await action.run(() => afterSubmit(data));
    for (const issue of rejectionFieldErrors(result)) {
      const field = issue.path[0];
      if (field === 'name' || field === 'content' || field === 'collectionIds')
        setError(field, { type: 'server', message: t('request_invalid') });
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
    <DialogContent className="sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>
          {match(mode)
            .with('create', () => t('create_item'))
            .otherwise(() => t('modify_item'))}
        </DialogTitle>
      </DialogHeader>
      <RequestNotice error={readError} retry={retryRead} />
      {mode === 'edit' && !loading && !initialValues && <p>{t('request_association_failed')}</p>}
      <FieldGroup className="w-full">
        <Field>
          <FieldLabel>{t('item_name')}</FieldLabel>
          <Input aria-invalid={!!errors.name} required {...register('name', { required: true })} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </Field>
        {mode === 'create' && (
          <Field>
            <FieldLabel>{t('match_collections')}</FieldLabel>
            <Controller
              control={control}
              name="collectionIds"
              render={({ field }) => <CollectionMultiSelect {...field} />}
            />
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
                  <CustomEdit wordWrap="on" className="w-full h-[500px] rounded-lg" language="markdown" {...field} />
                ))
                .otherwise(() => (
                  <Markdown
                    className="w-[calc(var(--container-5xl)-(--spacing(12)))] overflow-y-auto h-[500px]"
                    value={field.value ?? ''}
                  />
                ))}
            </Field>
          )}
        />
      </FieldGroup>
      <WriteNotice
        outcome={action.outcome}
        pending={action.pending}
        viewHref="/collections/collections"
        check={
          checkResult
            ? async () => {
                if (await action.check(() => checkResult(getValues()))) handleClose();
              }
            : undefined
        }
      />
      <DialogFooter>
        <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
        <Button
          disabled={action.blocked || loading || (mode === 'edit' && !initialValues)}
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
