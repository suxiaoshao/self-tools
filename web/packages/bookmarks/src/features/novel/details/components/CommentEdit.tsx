import { checkNovelState } from '@bookmarks/features/novel/model/reconcile';
import { useApolloClient } from '@apollo/client/react';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { useMutation } from '@apollo/client/react';
import { graphql } from '@bookmarks/gql/index';
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

const CreateCommentSchema = object({
  content: pipe(string(), minLength(1)),
});

const CreateComment = graphql(`
  mutation CreateComment($novelId: Int!, $content: String!) {
    addCommentForNovel(novelId: $novelId, content: $content) {
      __typename
      ... on CommentSaved {
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

const UpdateComment = graphql(`
  mutation UpdateComment($novelId: Int!, $content: String!) {
    updateCommentForNovel(novelId: $novelId, content: $content) {
      __typename
      ... on CommentSaved {
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

interface CommentEditProps {
  novelId: number;
  refetch: () => void;
  mode: 'create' | 'update';
  initContent?: string;
}

export default function CommentEdit({ novelId, refetch, mode, initContent }: CommentEditProps) {
  const client = useApolloClient();
  const write = useBookmarkWrite('/bookmarks/novel');
  const t = useI18n();
  const { open, handleClose, handleOpenChange } = useDialog();
  const [createComment, { loading }] = useMutation(CreateComment);
  const [updateComment, { loading: updateLoading }] = useMutation(UpdateComment);
  const { handleSubmit, control } = useForm<Omit<CreateCommentMutationVariables, 'novelId'>>({
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

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <DialogTrigger render={<Button variant="ghost" size="icon" />}>
          <TooltipTrigger render={<span />}>
            <Edit />
          </TooltipTrigger>
        </DialogTrigger>
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
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="w-full">
            <Controller
              name="content"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>{t('content')}</FieldLabel>
                  <CustomEdit wordWrap="on" className="h-[500px] rounded-lg" language="markdown" {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </FieldGroup>
          {write.notice}
          <DialogFooter>
            <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
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
