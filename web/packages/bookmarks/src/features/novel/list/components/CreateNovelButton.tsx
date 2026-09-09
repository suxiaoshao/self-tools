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
import { FieldGroup, FieldLabel, Field } from 'ui/components/field';
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
  const write = useBookmarkWrite('/bookmarks/novel');
  type FormData = Omit<CreateNovelMutationVariables['data'], 'collectionId'>;
  // 表单控制
  const { handleSubmit, register, control } = useForm<FormData>({ defaultValues: { tags: [] } });

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
              <FieldLabel>{t('novel_status')}</FieldLabel>
              <select {...register('novelStatus', { required: true })}>
                <option value="ONGOING">{t('ongoing')}</option>
                <option value="COMPLETED">{t('completed')}</option>
                <option value="PAUSED">{t('paused')}</option>
              </select>
            </Field>
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
          {write.notice}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="secondary" />}>{t('cancel')}</DialogClose>
            <Button disabled={write.blocked} type="submit">
              {t('submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
