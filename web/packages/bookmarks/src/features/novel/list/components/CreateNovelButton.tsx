import { useId, useEffect } from 'react';
import { rejectionFieldErrors } from 'custom-graphql';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { useI18n } from 'i18n';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import AuthorSelect from '../../../../components/AuthorSelect/index';
import TagsSelect from '../../../../components/TagsSelect/index';
import { graphql } from '@bookmarks/gql/index';
import { useMutation } from '@apollo/client/react';
import type { CreateNovelMutationVariables } from '@bookmarks/gql/graphql';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from 'ui/components/dialog';
import { useDialog } from 'hooks';
import { Button } from 'ui/components/button';
import { FieldError, FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { Input } from 'ui/components/input';

const CreateNovel = graphql(`
  mutation createNovel($data: CreateNovelInput!) {
    createNovel(data: $data) {
      __typename
      ... on NovelSaved {
        novelId
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
      ... on MissingResources {
        resources {
          kind
          id
        }
      }
      ... on Conflict {
        reason
        resources {
          kind
          id
        }
      }
    }
  }
`);

interface CreateNovelButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
}

export default function CreateNovelButton({ refetch }: CreateNovelButtonProps) {
  const t = useI18n();
  const write = useBookmarkWrite('/bookmarks');
  type FormData = Omit<CreateNovelMutationVariables['data'], 'collectionId'>;
  const formId = useId();
  // 表单控制
  const {
    handleSubmit,
    setError,
    register,
    control,
    formState: { errors },
  } = useForm<FormData>({ defaultValues: { tags: [] } });

  const [createNovel] = useMutation(CreateNovel);

  const onSubmit: SubmitHandler<FormData> = async ({ ...formData }) => {
    if (
      !(await write.execute(
        async () => (await createNovel({ variables: { data: { ...formData } } })).data?.createNovel,
      ))
    )
      return;
    void Promise.resolve()
      .then(() => refetch())
      .catch(() => undefined);
    handleClose();
  };
  // 控制 dialog
  const { open, handleClose, handleOpenChange } = useDialog();
  useEffect(() => {
    for (const issue of rejectionFieldErrors(write.outcome)) {
      const field = issue.path[0] === 'data' ? issue.path[1] : issue.path[0];
      if (
        field === 'name' ||
        field === 'avatar' ||
        field === 'description' ||
        field === 'site' ||
        field === 'siteId' ||
        field === 'novelStatus' ||
        field === 'authorId' ||
        field === 'tags'
      ) {
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
      <DialogTrigger render={<Button />}>{t('add_novel')}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('create_novel')}</DialogTitle>
        </DialogHeader>
        <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.novelStatus}>
              <FieldLabel htmlFor={`${formId}-novelStatus`}>{t('novel_status')}</FieldLabel>
              <select
                disabled={write.blocked}
                id={`${formId}-novelStatus`}
                aria-describedby={errors.novelStatus ? `${formId}-novelStatus-error` : undefined}
                aria-invalid={!!errors.novelStatus}
                {...register('novelStatus', { required: t('request_required') })}
              >
                <option value="ONGOING">{t('ongoing')}</option>
                <option value="COMPLETED">{t('completed')}</option>
                <option value="PAUSED">{t('paused')}</option>
              </select>

              <FieldError
                id={`${formId}-novelStatus-error`}
                errors={[
                  errors.novelStatus && {
                    ...errors.novelStatus,
                    message:
                      errors.novelStatus?.type === 'required' ? t('request_required') : errors.novelStatus.message,
                  },
                ]}
              />
            </Field>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor={`${formId}-name`}>{t('novel_name')}</FieldLabel>
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
            <Field data-invalid={!!errors.description}>
              <FieldLabel htmlFor={`${formId}-description`}>{t('description')}</FieldLabel>
              <Input
                disabled={write.blocked}
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
            <Field data-invalid={!!errors.site}>
              <FieldLabel htmlFor={`${formId}-site`}>{t('novel_site')}</FieldLabel>
              <select
                disabled={write.blocked}
                id={`${formId}-site`}
                aria-describedby={errors.site ? `${formId}-site-error` : undefined}
                aria-invalid={!!errors.site}
                {...register('site', { required: t('request_required') })}
              >
                <option value="JJWXC">{t('jjwxc')}</option>
                <option value="QIDIAN">{t('qidian')}</option>
              </select>

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
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <Field className="w-full">
                  <FieldLabel htmlFor={`${formId}-tags`}>{t('tags')}</FieldLabel>
                  <TagsSelect disabled={write.blocked} id={`${formId}-tags`} {...field} />
                </Field>
              )}
            />
            <Controller
              rules={{ required: t('request_required') }}
              control={control}
              name="authorId"
              render={({ field, fieldState }) => (
                <Field className="w-full" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-author`}>{t('author')}</FieldLabel>
                  <AuthorSelect
                    disabled={write.blocked}
                    id={`${formId}-author`}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? `${formId}-author-error` : undefined}
                    className="w-full"
                    {...field}
                  />
                  <FieldError
                    id={`${formId}-author-error`}
                    errors={[
                      fieldState.error && {
                        ...fieldState.error,
                        message:
                          fieldState.error?.type === 'required' ? t('request_required') : fieldState.error.message,
                      },
                    ]}
                  />
                </Field>
              )}
            />
          </FieldGroup>
          {write.notice}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="secondary" disabled={write.pending} />}>
              {t('cancel')}
            </DialogClose>
            <Button disabled={write.blocked} type="submit">
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
