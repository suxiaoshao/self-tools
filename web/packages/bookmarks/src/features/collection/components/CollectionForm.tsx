import { useId } from 'react';
import type { ReactNode } from 'react';
import type { CreateCollectionMutationVariables } from '@bookmarks/gql/graphql';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { match } from 'ts-pattern';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from 'ui/components/dialog';
import { Button } from 'ui/components/button';
import { FieldError, FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { Input } from 'ui/components/input';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { minLength, pipe, nullish, object, string } from 'valibot';

export type CollectionFormData = Omit<CreateCollectionMutationVariables, 'parentId'>;

interface CollectionFormProps {
  afterSubmit?: (data: CollectionFormData) => Promise<void>;
  notice?: ReactNode;
  disabled?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'create' | 'edit';
  initialValues?: CollectionFormData;
}

export default function CollectionForm({
  open,
  notice,
  disabled,
  onOpenChange,
  afterSubmit,
  initialValues,
  mode = 'create',
}: CollectionFormProps) {
  const t = useI18n();
  const formId = useId();
  // 表单控制
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm<CollectionFormData>({
    defaultValues: initialValues,
    resolver: valibotResolver(
      object({ name: pipe(string(), minLength(1, t('request_required'))), description: nullish(string()) }),
    ),
  });
  const onSubmit: SubmitHandler<CollectionFormData> = async (data) => {
    await afterSubmit?.(data);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form noValidate id={formId} onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>
              {match(mode)
                .with('create', () => t('create_collection'))
                .with('edit', () => t('modify_collection'))
                .exhaustive()}
            </DialogTitle>
          </DialogHeader>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor={`${formId}-name`}>{t('collection_name')}</FieldLabel>
              <Input
                disabled={disabled}
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
                disabled={disabled}
                id={`${formId}-description`}
                aria-describedby={errors.description ? `${formId}-description-error` : undefined}
                aria-invalid={!!errors.description}
                {...register('description')}
              />

              <FieldError
                id={`${formId}-description-error`}
                errors={[
                  errors.description && {
                    ...errors.description,
                    message:
                      errors.description?.type === 'required' ? t('request_required') : errors.description.message,
                  },
                ]}
              />
            </Field>
          </FieldGroup>

          {notice}
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
            <Button disabled={disabled} type="submit">
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
