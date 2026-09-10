import { useId, useEffect } from 'react';
import { rejectionFieldErrors } from 'custom-graphql';
import { checkNovelState } from '@bookmarks/features/novel/model/reconcile';
import { useApolloClient } from '@apollo/client/react';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { useMutation } from '@apollo/client/react';
import { CreateCommentDocument as CreateComment, UpdateCommentDocument as UpdateComment } from '@bookmarks/gql/graphql';
import type { CreateCommentMutationVariables } from '@bookmarks/gql/graphql';
import CustomEdit from 'edit/form';
import { useDialog } from 'hooks';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { Edit } from 'lucide-react';
import { useI18n } from 'i18n';
import { Controller, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import { minLength, object, pipe, string } from 'valibot';
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
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui/components/tooltip';
import { FieldError, FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { Spinner } from 'ui/components/spinner';

interface CommentEditProps {
  disabled?: boolean;
  novelId: number;
  refetch: () => void;
  mode: 'create' | 'update';
  initContent?: string;
}

export default function CommentEdit({ novelId, refetch, mode, initContent, disabled }: CommentEditProps) {
  const client = useApolloClient();
  const write = useBookmarkWrite('/bookmarks');
  const t = useI18n();
  const formId = useId();
  const CreateCommentSchema = object({ content: pipe(string(), minLength(1, t('request_required'))) });
  const { open, handleClose, handleOpenChange } = useDialog();
  const [createComment, { loading }] = useMutation(CreateComment);
  const [updateComment, { loading: updateLoading }] = useMutation(UpdateComment);
  const { handleSubmit, control, setError } = useForm<Omit<CreateCommentMutationVariables, 'novelId'>>({
    resolver: valibotResolver(CreateCommentSchema),
    defaultValues: {
      content: initContent,
    },
  });
  const onSubmit = async (data: Omit<CreateCommentMutationVariables, 'novelId'>) => {
    if (mode === 'update') {
      if (
        !(await write.execute(
          async () => (await updateComment({ variables: { ...data, novelId } })).data?.updateCommentForNovel,
          {
            verify: () => checkNovelState(client, novelId, { comment: data.content }),
            confirmed: () => {
              handleClose();
              refetch();
            },
          },
        ))
      )
        return;
    } else {
      if (
        !(await write.execute(
          async () => (await createComment({ variables: { ...data, novelId } })).data?.addCommentForNovel,
          {
            verify: () => checkNovelState(client, novelId, { comment: data.content }),
            confirmed: () => {
              handleClose();
              refetch();
            },
          },
        ))
      )
        return;
    }
    handleClose();
    void Promise.resolve()
      .then(() => refetch())
      .catch(() => undefined);
  };

  useEffect(() => {
    for (const issue of rejectionFieldErrors(write.outcome)) {
      if (issue.path[0] === 'content') setError('content', { type: 'server', message: t('request_invalid') });
    }
  }, [write.outcome, setError, t]);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!write.pending) handleOpenChange(next);
      }}
    >
      <Tooltip>
        <TooltipTrigger
          render={
            <DialogTrigger render={<Button disabled={disabled} variant="ghost" size="icon" aria-label={t('edit')} />} />
          }
        >
          <Edit />
        </TooltipTrigger>
        <TooltipContent>{t('edit')}</TooltipContent>
      </Tooltip>

      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {match(mode)
              .with('create', () => t('add_comment'))
              .with('update', () => t('update_comment'))
              .exhaustive()}
          </DialogTitle>
        </DialogHeader>
        <form noValidate className="w-full flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="w-full">
            <Controller
              name="content"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel id={`${formId}-content-label`}>{t('content')}</FieldLabel>
                  <CustomEdit
                    aria-label={t('content')}
                    readOnly={write.blocked}
                    aria-labelledby={`${formId}-content-label`}
                    aria-invalid={fieldState.invalid}
                    aria-describedby={fieldState.invalid ? `${formId}-content-error` : undefined}
                    wordWrap="on"
                    className="h-[min(500px,50dvh)] rounded-lg"
                    language="markdown"
                    {...field}
                  />
                  {fieldState.invalid && (
                    <FieldError
                      id={`${formId}-content-error`}
                      errors={[
                        fieldState.error && {
                          ...fieldState.error,
                          message:
                            fieldState.error?.type === 'required' || fieldState.error?.type === 'min_length'
                              ? t('request_required')
                              : fieldState.error.message,
                        },
                      ]}
                    />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          {write.notice}
          <DialogFooter>
            <DialogClose render={<Button disabled={write.pending} type="button" variant="secondary" />}>
              {t('cancel')}
            </DialogClose>
            <Button type="submit" disabled={write.blocked || loading || updateLoading}>
              {(loading || updateLoading) && <Spinner />}
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
