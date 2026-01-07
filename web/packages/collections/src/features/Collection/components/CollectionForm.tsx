import { useI18n } from 'i18n';
import { useForm, type SubmitHandler } from 'react-hook-form';
import type { CreateCollectionMutationVariables } from '../../../gql/graphql';
import { match } from 'ts-pattern';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@portal/components/ui/dialog';
import { Button } from '@portal/components/ui/button';
import { FieldGroup, FieldLabel, Field } from '@portal/components/ui/field';
import { Input } from '@portal/components/ui/input';
export type CollectionFormData = Omit<CreateCollectionMutationVariables, 'parentId'>;
export interface CollectFormProps {
  afterSubmit?: (data: CollectionFormData) => Promise<void>;
  handleClose: () => void;
  mode?: 'create' | 'edit';
  initialValues?: CollectionFormData;
}

export default function CollectionForm({ afterSubmit, handleClose, mode = 'create', initialValues }: CollectFormProps) {
  // 表单控制
  const { handleSubmit, register } = useForm<CollectionFormData>({ defaultValues: initialValues });

  const onSubmit: SubmitHandler<CollectionFormData> = async (data) => {
    await afterSubmit?.(data);
    handleClose();
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
            <Input required {...register('name', { required: true })} />
          </Field>
          <Field>
            <FieldLabel>{t('description')}</FieldLabel>
            <Input {...register('description', { setValueAs: (value) => value || null })} />
          </Field>
        </FieldGroup>
      </form>

      <DialogFooter>
        <DialogClose asChild>
          <Button>{t('cancel')}</Button>
        </DialogClose>
        <Button
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
