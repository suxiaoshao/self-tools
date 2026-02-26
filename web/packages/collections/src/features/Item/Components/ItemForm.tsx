import { Edit as EditIcon, View } from 'lucide-react';
import { useI18n } from 'i18n';
import { useEffect, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import CustomEdit from '../../../components/CustomEdit';
import Markdown from '../../../components/Markdown';
import CollectionMultiSelect from '@collections/components/CollectionMultiSelect';
import { array, type InferInput, integer, number, object, pipe, string } from 'valibot';
import { DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@portal/components/ui/dialog';
import { Button } from '@portal/components/ui/button';
import { FieldGroup, FieldLabel, Field } from '@portal/components/ui/field';
import { Input } from '@portal/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@portal/components/ui/toggle-group';

const itemFormSchema = object({
  collectionIds: array(pipe(number(), integer())),
  name: string(),
  content: string(),
});

export type ItemFormData = InferInput<typeof itemFormSchema>;

interface ItemFormProps {
  afterSubmit?: (data: ItemFormData) => Promise<void>;
  handleClose: () => void;
  mode?: 'create' | 'edit';
  initialValues?: ItemFormData;
  loading?: boolean;
}

export default function ItemForm({ afterSubmit, handleClose, mode, initialValues }: ItemFormProps) {
  // 表单控制
  const { handleSubmit, register, control, setValue } = useForm<ItemFormData>({ defaultValues: initialValues });
  useEffect(() => {
    if (initialValues) {
      setValue('name', initialValues?.name);
      setValue('content', initialValues?.content);
    }
  }, [initialValues, setValue]);
  const onSubmit: SubmitHandler<ItemFormData> = async (data) => {
    await afterSubmit?.(data);
    handleClose();
  };
  const [alignment, setAlignment] = useState<'edit' | 'preview'>('edit');
  const handleAlignment = (newAlignment: string) => {
    match(newAlignment)
      .with('edit', () => setAlignment('edit'))
      .with('preview', () => setAlignment('preview'))
      .otherwise(() => setAlignment('edit'));
  };
  const t = useI18n();
  return (
    <DialogContent className="sm:max-w-5xl">
      <DialogHeader>
        <DialogTitle>
          {match(mode)
            .with('create', () => t('create_item'))
            .otherwise(() => t('modify_item'))}
        </DialogTitle>
      </DialogHeader>
      <FieldGroup className="w-full">
        <Field>
          <FieldLabel>{t('item_name')}</FieldLabel>
          <Input required {...register('name', { required: true })} />
        </Field>
        <Field>
          <FieldLabel>{t('match_collections')}</FieldLabel>
          <Controller
            control={control}
            name="collectionIds"
            render={({ field }) => <CollectionMultiSelect {...field} />}
          />
        </Field>

        <Controller
          control={control}
          name="content"
          rules={{ required: true }}
          render={({ field }) => (
            <Field>
              <FieldLabel className="w-full flex items-center justify-between">
                <span>{t('content')}</span>
                <ToggleGroup
                  variant="outline"
                  value={[alignment]}
                  onValueChange={(newAlignment) => handleAlignment(newAlignment[0] ?? 'edit')}
                >
                  <ToggleGroupItem value="edit">
                    <EditIcon />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="preview">
                    <View />
                  </ToggleGroupItem>
                </ToggleGroup>
              </FieldLabel>
              {match(alignment)
                .with('edit', () => (
                  <CustomEdit wordWrap="on" className="w-full h-[500px] rounded-lg" language="markdown" {...field} />
                ))
                .otherwise(() => (
                  <Markdown
                    className="w-[calc(var(--container-5xl)-(--spacing(12)))] overflow-y-auto h-[500px]"
                    value={field.value ?? ''}
                  />
                ))}
            </Field>
          )}
        />
      </FieldGroup>
      <DialogFooter>
        <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
        <Button
          onClick={() => {
            handleSubmit(onSubmit)();
          }}
        >
          {t('submit')}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
