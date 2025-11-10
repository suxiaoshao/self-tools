import { useMutation } from '@apollo/client/react';
import { graphql } from '@bookmarks/gql';
import type { CreateCommentMutationVariables } from '@bookmarks/gql/graphql';
import CustomEdit from '@collections/components/CustomEdit';
import useDialog from '@collections/hooks/useDialog';
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
} from '@portal/components/ui/dialog';
import { Button } from '@portal/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@portal/components/ui/tooltip';
import { FieldError, FieldGroup, FieldLabel, FieldSet } from '@portal/components/ui/field';
import { Spinner } from '@portal/components/ui/spinner';

const CreateCommentSchema = object({
  content: pipe(string(), minLength(1)),
});

const CreateComment = graphql(`
  mutation CreateComment($novelId: Int!, $content: String!) {
    addCommentForNovel(novelId: $novelId, content: $content) {
      __typename
    }
  }
`);

const UpdateComment = graphql(`
  mutation UpdateComment($novelId: Int!, $content: String!) {
    updateCommentForNovel(novelId: $novelId, content: $content) {
      __typename
    }
  }
`);

export interface CommentEditProps {
  novelId: number;
  refetch: () => void;
  mode: 'create' | 'update';
  initContent?: string;
}

export default function CommentEdit({ novelId, refetch, mode, initContent }: CommentEditProps) {
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
      await updateComment({ variables: { ...data, novelId } });
    } else {
      await createComment({ variables: { ...data, novelId } });
    }
    handleClose();
    refetch();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Edit />
            </Button>
          </DialogTrigger>
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
        <form className="w-full flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup className="w-full">
            <Controller
              name="content"
              control={control}
              render={({ field, fieldState }) => (
                <FieldSet>
                  <FieldLabel>{t('content')}</FieldLabel>
                  <CustomEdit wordWrap="on" className="h-[500px] rounded-lg" language="markdown" {...field} />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldSet>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{t('cancel')}</Button>
            </DialogClose>
            <Button type="submit" disabled={loading || updateLoading}>
              {(loading || updateLoading) && <Spinner />}
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
