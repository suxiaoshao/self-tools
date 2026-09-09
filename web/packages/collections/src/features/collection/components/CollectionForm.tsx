import { useWriteAction, WriteNotice, rejectionFieldErrors, type WriteOutcome } from 'custom-graphql';
import { useI18n } from 'i18n';
import { useForm, type SubmitHandler } from 'react-hook-form';
import type { CreateCollectionMutationVariables } from '../../../gql/graphql';
import { match } from 'ts-pattern';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from 'ui/components/dialog';
import { Button } from 'ui/components/button';
import { FieldGroup, FieldLabel, Field } from 'ui/components/field';
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
      <form onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <Field>
            <FieldLabel>{t('collection_name')}</FieldLabel>
            <Input aria-invalid={!!errors.name} required {...register('name', { required: true })} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </Field>
          <Field>
            <FieldLabel>{t('description')}</FieldLabel>
            <Input {...register('description', { setValueAs: (value) => value || null })} />
          </Field>
        </FieldGroup>
      </form>

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
        <DialogClose render={<Button />}>{t('cancel')}</DialogClose>
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
