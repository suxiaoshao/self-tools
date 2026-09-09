import { useId } from 'react';
import { useWriteAction, WriteNotice, rejectionFieldErrors, type WriteOutcome } from 'custom-graphql';
import { useI18n } from 'i18n';
import { useForm, type SubmitHandler } from 'react-hook-form';
import type { CreateCollectionMutationVariables } from '../../../gql/graphql';
import { match } from 'ts-pattern';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from 'ui/components/dialog';
import { Button } from 'ui/components/button';
import { FieldError, FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { Input } from 'ui/components/input';
export type CollectionFormData = Omit<CreateCollectionMutationVariables, 'parentId'>;
interface CollectFormProps {
  afterSubmit?: (data: CollectionFormData) => Promise<WriteOutcome>;
  handleClose: () => void;
  checkResult?: (data: CollectionFormData) => Promise<boolean>;
  mode?: 'create' | 'edit';
  initialValues?: CollectionFormData;
}

export default function CollectionForm({
  afterSubmit,
  handleClose,
  mode = 'create',
  initialValues,
  checkResult,
}: CollectFormProps) {
  const formId = useId();
  // 表单控制
  const {
    handleSubmit,
    register,
    setError,
    clearErrors,
    getValues,
    formState: { errors },
  } = useForm<CollectionFormData>({ defaultValues: initialValues });

  const action = useWriteAction();
  const onSubmit: SubmitHandler<CollectionFormData> = async (data) => {
    if (!afterSubmit) return;
    clearErrors();
    const result = await action.run(() => afterSubmit(data));
    for (const issue of rejectionFieldErrors(result)) {
      const field = issue.path[0];
      if (field === 'name' || field === 'description')
        setError(field, { type: 'server', message: t('request_invalid') });
    }
    if (result?.status === 'saved') handleClose();
  };
  const t = useI18n();

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {match(mode)
            .with('create', () => t('create_collection'))
            .with('edit', () => t('modify_collection'))
            .exhaustive()}
        </DialogTitle>
      </DialogHeader>
      <form noValidate id={formId} onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field data-invalid={!!errors.name}>
            <FieldLabel htmlFor={`${formId}-name`}>{t('collection_name')}</FieldLabel>
            <Input
              disabled={action.blocked}
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
          <Field data-invalid={!!errors.description}>
            <FieldLabel htmlFor={`${formId}-description`}>{t('description')}</FieldLabel>
            <Input
              disabled={action.blocked}
              id={`${formId}-description`}
              aria-describedby={errors.description ? `${formId}-description-error` : undefined}
              aria-invalid={!!errors.description}
              {...register('description', { setValueAs: (value) => value || null })}
            />

            <FieldError
              id={`${formId}-description-error`}
              errors={[
                errors.description && {
                  ...errors.description,
                  message: errors.description?.type === 'required' ? t('request_required') : errors.description.message,
                },
              ]}
            />
          </Field>
        </FieldGroup>
      </form>

      <WriteNotice
        fieldLabels={{ name: t('collection_name'), description: t('description') }}
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
        <DialogClose render={<Button />}>{t('cancel')}</DialogClose>
        <Button disabled={action.blocked} type="submit" form={formId}>
          {t('submit')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
