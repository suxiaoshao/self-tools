/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-01 17:51:59
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Novel/Components/CreateNovelButton.tsx
 */
import { useI18n } from 'i18n';
import { useForm, type SubmitHandler, Controller } from 'react-hook-form';
import AuthorSelect from '../../../../components/AuthorSelect';
import TagsSelect from '../../../../components/TagsSelect';
import { graphql } from '@bookmarks/gql';
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
} from '@portal/components/ui/dialog';
import useDialog from '@collections/hooks/useDialog';
import { Button } from '@portal/components/ui/button';
import { FieldGroup, FieldLabel, Field } from '@portal/components/ui/field';
import { Input } from '@portal/components/ui/input';

const CreateNovel = graphql(`
  mutation createNovel($data: CreateNovelInput!) {
    createNovel(data: $data) {
      id
    }
  }
`);

export interface CreateNovelButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
}

export default function CreateNovelButton({ refetch }: CreateNovelButtonProps) {
  type FormData = Omit<CreateNovelMutationVariables['data'], 'collectionId'>;
  // 表单控制
  const { handleSubmit, register, control } = useForm<FormData>({ defaultValues: { tags: [] } });

  const [createNovel] = useMutation(CreateNovel);

  const onSubmit: SubmitHandler<FormData> = async ({ ...formData }) => {
    await createNovel({ variables: { data: { ...formData } } });
    refetch();
    handleClose();
  };
  // 控制 dialog
  const { open, handleClose, handleOpenChange } = useDialog();
  const t = useI18n();
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button />}>{t('add_novel')}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('create_novel')}</DialogTitle>
        </DialogHeader>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>{t('novel_name')}</FieldLabel>
              <Input required {...register('name', { required: true })} />
            </Field>
            <Field>
              <FieldLabel>{t('avatar')}</FieldLabel>
              <Input required {...register('avatar', { required: true })} />
            </Field>
            <Field>
              <FieldLabel>{t('description')}</FieldLabel>
              <Input {...register('description')} />
            </Field>
            <Field>
              <FieldLabel>{t('link')}</FieldLabel>
              <Input required {...register('site', { required: true })} />
            </Field>
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <Field className="w-full">
                  <FieldLabel>{t('tags')}</FieldLabel>
                  <TagsSelect {...field} />
                </Field>
              )}
            />
            <Controller
              rules={{ required: true }}
              control={control}
              name="authorId"
              render={({ field }) => (
                <Field className="w-full">
                  <FieldLabel>{t('author')}</FieldLabel>
                  <AuthorSelect className="w-full" {...field} />
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="secondary" />}>{t('cancel')}</DialogClose>
            <Button type="submit">{t('submit')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
