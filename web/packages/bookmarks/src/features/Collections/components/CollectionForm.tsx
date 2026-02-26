import type { CreateCollectionMutationVariables } from '@bookmarks/gql/graphql';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { match } from 'ts-pattern';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@portal/components/ui/dialog';
import { Button } from '@portal/components/ui/button';
import { FieldError, FieldGroup, FieldLabel, Field } from '@portal/components/ui/field';
import { Input } from '@portal/components/ui/input';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { nullish, object, string } from 'valibot';

enum CollectionFormType {
  create = 'create',
  edit = 'edit',
}

export type CollectionFormData = Omit<CreateCollectionMutationVariables, 'parentId'>;

interface CollectionFormProps {
  afterSubmit?: (data: CollectionFormData) => Promise<void>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: CollectionFormType;
  initialValues?: CollectionFormData;
}

export default function CollectionForm({
  open,
  onOpenChange,
  afterSubmit,
  initialValues,
  mode = CollectionFormType.create,
}: CollectionFormProps) {
  // 表单控制
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<CollectionFormData>({
    defaultValues: initialValues,
    resolver: valibotResolver(object({ name: string(), description: nullish(string()) })),
  });
  const onSubmit: SubmitHandler<CollectionFormData> = async (data) => {
    await afterSubmit?.(data);
  };
  const t = useI18n();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {match(mode)
                .with(CollectionFormType.create, () => t('create_collection'))
                .with(CollectionFormType.edit, () => t('modify_collection'))
                .exhaustive()}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>{t('collection_name')}</FieldLabel>
              <Input required {...register('name', { required: true })} />
              {errors.name?.message && <FieldError errors={[errors.name]} />}
            </Field>
            <Field>
              <FieldLabel>{t('description')}</FieldLabel>
              <Input {...register('description')} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
            <Button
              onClick={() => {
                handleSubmit(onSubmit)();
              }}
            >
              {t('submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
