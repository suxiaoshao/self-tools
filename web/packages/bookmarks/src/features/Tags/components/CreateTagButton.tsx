import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { useI18n } from 'i18n';
import { graphql } from '@bookmarks/gql';
import { useMutation } from '@apollo/client/react';
import { NovelSite, type CreateTagMutationVariables } from '@bookmarks/gql/graphql';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@portal/components/ui/dialog';
import useDialog from '@collections/hooks/useDialog';
import { Button } from '@portal/components/ui/button';
import { FieldError, FieldGroup, FieldLabel, Field } from '@portal/components/ui/field';
import { Input } from '@portal/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@portal/components/ui/select';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { enum_, object, string } from 'valibot';

const CreateTag = graphql(`
  mutation createTag($name: String!, $site: NovelSite!, $siteId: String!) {
    createTag(name: $name, site: $site, siteId: $siteId) {
      name
      id
    }
  }
`);
export interface CreateTagButtonProps {
  refetch: () => void;
}

export default function CreateTagButton({ refetch }: CreateTagButtonProps) {
  const [createTag] = useMutation(CreateTag);

  // 表单控制
  type FormData = Omit<CreateTagMutationVariables, 'collectionId'>;
  const {
    handleSubmit,
    register,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: valibotResolver(
      object({
        name: string(),
        site: enum_(NovelSite),
        siteId: string(),
      }),
    ),
  });
  const onSubmit: SubmitHandler<FormData> = async ({ name, site, siteId }) => {
    await createTag({ variables: { name, site, siteId } });
    refetch();
    handleClose();
  };

  // 控制 dialog
  const { open, handleClose, handleOpenChange } = useDialog();
  const t = useI18n();
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>{t('add_tag')}</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>{t('create_tag')}</DialogTitle>
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Field>
              <FieldLabel>{t('tag_name')}</FieldLabel>
              <Input {...register('name', { required: true })} />
              <FieldError errors={[errors.name]} />
            </Field>
            <Controller
              control={control}
              name="site"
              rules={{ required: true }}
              render={({ field: { onChange, ...field }, fieldState }) => (
                <Field className="flex-1">
                  <FieldLabel>{t('novel_site')}</FieldLabel>
                  <Select required {...field} onValueChange={onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value={NovelSite.Jjwxc}>{t('jjwxc')}</SelectItem>
                        <SelectItem value={NovelSite.Qidian}>{t('qidian')}</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
            <Field>
              <FieldLabel>{t('tag_site_id')}</FieldLabel>
              <Input {...register('siteId', { required: true })} />
              <FieldError errors={[errors.siteId]} />
            </Field>
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="secondary">{t('cancel')}</Button>
            </DialogClose>
            <Button type="submit">{t('submit')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
