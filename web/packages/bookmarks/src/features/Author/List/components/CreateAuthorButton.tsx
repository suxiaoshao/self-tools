/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 17:52:09
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/List/components/CreateAuthorButton.tsx
 */
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { graphql } from '@bookmarks/gql';
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
} from '@portal/components/ui/dialog';
import { Button } from '@portal/components/ui/button';
import useDialog from '@collections/hooks/useDialog';
import { FieldGroup, FieldLabel, Field } from '@portal/components/ui/field';
import { Input } from '@portal/components/ui/input';

const CreateAuthor = graphql(`
  mutation createAuthor($avatar: String!, $description: String!, $name: String!, $site: NovelSite!, $siteId: String!) {
    createAuthor(avatar: $avatar, description: $description, name: $name, site: $site, siteId: $siteId) {
      id
    }
  }
`);

interface CreateAuthorButtonProps {
  refetch: () => void;
}

export default function CreateAuthorButton({ refetch }: CreateAuthorButtonProps) {
  const [createAuthor] = useMutation(CreateAuthor);
  // 表单控制
  type FormData = CreateAuthorMutationVariables;
  const { handleSubmit, register } = useForm<FormData>();
  // 控制 dialog
  const { handleClose, open, handleOpenChange } = useDialog();
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    await createAuthor({ variables: { ...data } });
    refetch();
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
              <FieldLabel>{t('link')}</FieldLabel>
              <Input required {...register('site', { required: true })} />
            </Field>
            <Field>
              <FieldLabel>{t('description')}</FieldLabel>
              <Input {...register('description', { required: true })} />
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
          <Button type="submit" form="create-author-form">
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
