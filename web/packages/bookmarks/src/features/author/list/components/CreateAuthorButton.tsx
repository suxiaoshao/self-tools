import { NativeSelect, NativeSelectOption } from 'ui/components/native-select';
import { useId, useEffect } from 'react';
import { rejectionFieldErrors } from 'custom-graphql';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { CreateAuthorDocument as CreateAuthor } from '@bookmarks/gql/graphql';
import { useMutation } from '@apollo/client/react';
import type { CreateAuthorMutationVariables } from '@bookmarks/gql/graphql';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ui/components/dialog';
import { Button } from 'ui/components/button';
import { useDialog } from 'hooks';
import { FieldError, FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { Input } from 'ui/components/input';

interface CreateAuthorButtonProps {
  refetch: () => void;
}

export default function CreateAuthorButton({ refetch }: CreateAuthorButtonProps) {
  const t = useI18n();
  const write = useBookmarkWrite('/bookmarks/authors');
  const [createAuthor] = useMutation(CreateAuthor);
  const formId = useId();
  // 表单控制
  type FormData = CreateAuthorMutationVariables;
  const {
    handleSubmit,
    setError,
    register,
    formState: { errors },
  } = useForm<FormData>();
  // 控制 dialog
  const { handleClose, open, handleOpenChange } = useDialog();
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!(await write.execute(async () => (await createAuthor({ variables: { ...data } })).data?.createAuthor))) return;
    void Promise.resolve()
      .then(() => refetch())
      .catch(() => undefined);
    handleClose();
  };

  useEffect(() => {
    for (const issue of rejectionFieldErrors(write.outcome)) {
      const field = issue.path[0] === 'data' ? issue.path[1] : issue.path[0];
      if (field === 'name' || field === 'avatar' || field === 'description' || field === 'site' || field === 'siteId') {
        setError(field, {
          type: 'server',
          message: t(issue.code === 'REQUIRED' ? 'request_required' : 'request_invalid'),
        });
      }
    }
  }, [write.outcome, setError, t]);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!write.pending) handleOpenChange(next);
      }}
    >
      <DialogTrigger render={<Button className="ml-2" />}>{t('add_author')}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('create_author')}</DialogTitle>
        </DialogHeader>
        <form noValidate id="create-author-form" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor={`${formId}-name`}>{t('author_name')}</FieldLabel>
              <Input
                disabled={write.blocked}
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
            <Field data-invalid={!!errors.avatar}>
              <FieldLabel htmlFor={`${formId}-avatar`}>{t('avatar')}</FieldLabel>
              <Input
                disabled={write.blocked}
                id={`${formId}-avatar`}
                aria-describedby={errors.avatar ? `${formId}-avatar-error` : undefined}
                aria-invalid={!!errors.avatar}
                required
                {...register('avatar', { required: t('request_required') })}
              />

              <FieldError
                id={`${formId}-avatar-error`}
                errors={[
                  errors.avatar && {
                    ...errors.avatar,
                    message: errors.avatar?.type === 'required' ? t('request_required') : errors.avatar.message,
                  },
                ]}
              />
            </Field>
            <Field data-invalid={!!errors.site}>
              <FieldLabel htmlFor={`${formId}-site`}>{t('novel_site')}</FieldLabel>
              <NativeSelect
                className="w-full"
                disabled={write.blocked}
                id={`${formId}-site`}
                aria-describedby={errors.site ? `${formId}-site-error` : undefined}
                aria-invalid={!!errors.site}
                {...register('site', { required: t('request_required') })}
              >
                <NativeSelectOption value="JJWXC">{t('jjwxc')}</NativeSelectOption>
                <NativeSelectOption value="QIDIAN">{t('qidian')}</NativeSelectOption>
              </NativeSelect>

              <FieldError
                id={`${formId}-site-error`}
                errors={[
                  errors.site && {
                    ...errors.site,
                    message: errors.site?.type === 'required' ? t('request_required') : errors.site.message,
                  },
                ]}
              />
            </Field>
            <Field data-invalid={!!errors.siteId}>
              <FieldLabel htmlFor={`${formId}-siteId`}>{t('request_source_id')}</FieldLabel>
              <Input
                disabled={write.blocked}
                id={`${formId}-siteId`}
                aria-describedby={errors.siteId ? `${formId}-siteId-error` : undefined}
                aria-invalid={!!errors.siteId}
                required
                {...register('siteId', { required: t('request_required') })}
              />

              <FieldError
                id={`${formId}-siteId-error`}
                errors={[
                  errors.siteId && {
                    ...errors.siteId,
                    message: errors.siteId?.type === 'required' ? t('request_required') : errors.siteId.message,
                  },
                ]}
              />
            </Field>
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor={`${formId}-description`}>{t('description')}</FieldLabel>
              <Input
                disabled={write.blocked}
                id={`${formId}-description`}
                aria-describedby={errors.description ? `${formId}-description-error` : undefined}
                aria-invalid={!!errors.description}
                {...register('description', { required: t('request_required') })}
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
        </form>
        {write.notice}
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" disabled={write.pending} />}>{t('cancel')}</DialogClose>
          <Button disabled={write.blocked} type="submit" form="create-author-form">
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
