import { useId, useEffect } from 'react';
import { rejectionFieldErrors } from 'custom-graphql';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { graphql } from '@bookmarks/gql/index';
import { useMutation } from '@apollo/client/react';
import type { CreateTagMutationVariables } from '@bookmarks/gql/graphql';
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogTitle, DialogTrigger } from 'ui/components/dialog';
import { useDialog } from 'hooks';
import { Button } from 'ui/components/button';
import { FieldError, FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { Input } from 'ui/components/input';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'ui/components/select';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { check, minLength, object, picklist, pipe, string, trim } from 'valibot';

const CreateTag = graphql(`
  mutation createTag($name: String!, $site: NovelSite!, $siteId: String!) {
    createTag(name: $name, site: $site, siteId: $siteId) {
      __typename
      ... on TagSaved {
        tagId
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
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
interface CreateTagButtonProps {
  refetch: () => void;
}

export default function CreateTagButton({ refetch }: CreateTagButtonProps) {
  const t = useI18n();
  const write = useBookmarkWrite('/bookmarks/tags');
  const [createTag] = useMutation(CreateTag);

  const formId = useId();
  // 表单控制
  type FormData = Omit<CreateTagMutationVariables, 'collectionId'>;
  const {
    handleSubmit,
    setError,
    register,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: valibotResolver(
      object({
        name: pipe(
          string(),
          trim(),
          minLength(1, t('request_required')),
          check((name) => Array.from(name).length <= 20, `${t('request_too_long')} (20)`),
        ),
        site: picklist(['JJWXC', 'QIDIAN'], t('request_required')),
        siteId: pipe(string(), trim(), minLength(1, t('request_required'))),
      }),
    ),
  });
  const onSubmit: SubmitHandler<FormData> = async ({ name, site, siteId }) => {
    if (!(await write.execute(async () => (await createTag({ variables: { name, site, siteId } })).data?.createTag)))
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
      if (field === 'name' || field === 'site' || field === 'siteId') {
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
      <DialogTrigger render={<Button />}>{t('add_tag')}</DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('create_tag')}</DialogTitle>
        <form noValidate className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field data-invalid={!!errors.name}>
              <FieldLabel htmlFor={`${formId}-name`}>{t('tag_name')}</FieldLabel>
              <Input
                disabled={write.blocked}
                id={`${formId}-name`}
                aria-describedby={errors.name ? `${formId}-name-error` : undefined}
                aria-invalid={!!errors.name}
                {...register('name', { required: t('request_required') })}
              />

              <FieldError
                id={`${formId}-name-error`}
                errors={[
                  errors.name && {
                    ...errors.name,
                    message:
                      errors.name?.type === 'required' || errors.name?.type === 'min_length'
                        ? t('request_required')
                        : errors.name.message,
                  },
                ]}
              />
            </Field>
            <Controller
              control={control}
              name="site"
              rules={{ required: t('request_required') }}
              render={({ field: { onChange, ref, ...field }, fieldState }) => (
                <Field className="flex-1" data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-site`}>{t('novel_site')}</FieldLabel>
                  <Select disabled={write.blocked} required {...field} onValueChange={onChange}>
                    <SelectTrigger
                      ref={ref}
                      id={`${formId}-site`}
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? `${formId}-site-error` : undefined}
                      className="w-full"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="JJWXC">{t('jjwxc')}</SelectItem>
                        <SelectItem value="QIDIAN">{t('qidian')}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError
                    id={`${formId}-site-error`}
                    errors={[
                      fieldState.error && {
                        ...fieldState.error,
                        message:
                          fieldState.error?.type === 'required' ||
                          fieldState.error?.type === 'picklist' ||
                          fieldState.error?.type === 'min_length'
                            ? t('request_required')
                            : fieldState.error.message,
                      },
                    ]}
                  />
                </Field>
              )}
            />
            <Field data-invalid={!!errors.siteId}>
              <FieldLabel htmlFor={`${formId}-siteId`}>{t('tag_site_id')}</FieldLabel>
              <Input
                disabled={write.blocked}
                id={`${formId}-siteId`}
                aria-describedby={errors.siteId ? `${formId}-siteId-error` : undefined}
                aria-invalid={!!errors.siteId}
                {...register('siteId', { required: t('request_required') })}
              />

              <FieldError
                id={`${formId}-siteId-error`}
                errors={[
                  errors.siteId && {
                    ...errors.siteId,
                    message:
                      errors.siteId?.type === 'required' || errors.siteId?.type === 'min_length'
                        ? t('request_required')
                        : errors.siteId.message,
                  },
                ]}
              />
            </Field>
          </FieldGroup>

          {write.notice}
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" disabled={write.pending} />}>{t('cancel')}</DialogClose>
            <Button disabled={write.blocked} type="submit">
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
