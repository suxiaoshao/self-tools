import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { graphql } from '@bookmarks/gql/index';
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
import { FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { Input } from 'ui/components/input';

const CreateAuthor = graphql(`
  mutation createAuthor($avatar: String!, $description: String!, $name: String!, $site: NovelSite!, $siteId: String!) {
    createAuthor(avatar: $avatar, description: $description, name: $name, site: $site, siteId: $siteId) {
      __typename
      ... on AuthorSaved {
        authorId
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

interface CreateAuthorButtonProps {
  refetch: () => void;
}

export default function CreateAuthorButton({ refetch }: CreateAuthorButtonProps) {
  const write = useBookmarkWrite('/bookmarks/authors');
  const [createAuthor] = useMutation(CreateAuthor);
  // 表单控制
  type FormData = CreateAuthorMutationVariables;
  const { handleSubmit, register } = useForm<FormData>();
  // 控制 dialog
  const { handleClose, open, handleOpenChange } = useDialog();
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    if (!(await write.execute(async () => (await createAuthor({ variables: { ...data } })).data?.createAuthor))) return;
    void Promise.resolve()
      .then(() => refetch())
      .catch(() => undefined);
    handleClose();
  };

  const t = useI18n();
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button className="ml-2" />}>{t('add_author')}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('create_author')}</DialogTitle>
        </DialogHeader>
        <form id="create-author-form" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>{t('author_name')}</FieldLabel>
              <Input required {...register('name', { required: true })} />
            </Field>
            <Field>
              <FieldLabel>{t('avatar')}</FieldLabel>
              <Input required {...register('avatar', { required: true })} />
            </Field>
            <Field>
              <FieldLabel>{t('novel_site')}</FieldLabel>
              <select {...register('site', { required: true })}>
                <option value="JJWXC">{t('jjwxc')}</option>
                <option value="QIDIAN">{t('qidian')}</option>
              </select>
            </Field>
            <Field>
              <FieldLabel>{t('request_source_id')}</FieldLabel>
              <Input required {...register('siteId', { required: true })} />
            </Field>
            <Field>
              <FieldLabel>{t('description')}</FieldLabel>
              <Input {...register('description', { required: true })} />
            </Field>
          </FieldGroup>
        </form>
        {write.notice}
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
          <Button disabled={write.blocked} type="submit" form="create-author-form">
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
