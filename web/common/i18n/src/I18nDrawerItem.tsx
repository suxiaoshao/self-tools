import { Languages } from 'lucide-react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { useI18nStore, LangMode, CustomLang } from './i18nSlice';
import { object, enum_, type InferInput } from 'valibot';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useI18n } from './useI18n';
import { useShallow } from 'zustand/react/shallow';
import { SidebarMenuButton, SidebarMenuItem } from '@portal/components/ui/sidebar';
import useDialog from '@collections/hooks/useDialog';
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
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldSet } from '@portal/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@portal/components/ui/radio-group';

const createColorSchema = object({
  langMode: enum_(LangMode),
  customLang: enum_(CustomLang),
});

type FormData = InferInput<typeof createColorSchema>;

export default function I18nDrawerItem() {
  const t = useI18n();
  // 控制 dialog
  const { open, handleClose, handleOpenChange } = useDialog();
  const { i18n, setLangSetting } = useI18nStore(
    useShallow((state) => ({
      i18n: state.value,
      setLangSetting: state.setLangSetting,
    })),
  );
  const { handleSubmit, control, watch, reset } = useForm<FormData>({
    defaultValues: {
      langMode: i18n.langMode,
      customLang: i18n.customLang,
    },
    resolver: valibotResolver(createColorSchema),
  });
  const onSubmit: SubmitHandler<FormData> = (data) => {
    setLangSetting(data);
    handleClose();
  };
  const watchTag = watch('langMode');
  const onOpenChange = (open: boolean) => {
    handleOpenChange(open);
    reset(i18n);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Languages />
            <span>{t('language_setting')}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('language_setting')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} id="language-form">
          <FieldGroup>
            <Controller
              name="langMode"
              control={control}
              rules={{ required: true }}
              render={({ field, fieldState }) => (
                <FieldSet>
                  <FieldLegend>{t('select_mode')}</FieldLegend>
                  <RadioGroup
                    aria-labelledby="color-setting"
                    {...field}
                    onValueChange={field.onChange}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  >
                    <Field orientation="horizontal">
                      <RadioGroupItem value={LangMode.custom} id="lang-mode-custom" />
                      <FieldLabel htmlFor="lang-mode-custom" className="font-normal">
                        {t('custom')}
                      </FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem value={LangMode.system} id="lang-mode-system" />
                      <FieldLabel htmlFor="lang-mode-system" className="font-normal">
                        {t('system')}
                      </FieldLabel>
                    </Field>
                  </RadioGroup>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </FieldSet>
              )}
            />

            {watchTag === 'custom' && (
              <Controller
                name="customLang"
                control={control}
                rules={{ required: true }}
                render={({ field, fieldState }) => (
                  <FieldSet>
                    <FieldLegend id="color-setting">{t('select_language')}</FieldLegend>
                    <RadioGroup
                      aria-labelledby="color-setting"
                      {...field}
                      onValueChange={field.onChange}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                    >
                      <Field orientation="horizontal">
                        <RadioGroupItem value={CustomLang.zh} id="lang-zh" />
                        <FieldLabel htmlFor="lang-zh" className="font-normal">
                          {t('chinese')}
                        </FieldLabel>
                      </Field>
                      <Field orientation="horizontal">
                        <RadioGroupItem value={CustomLang.en} id="lang-en" />
                        <FieldLabel htmlFor="lang-en" className="font-normal">
                          {t('english')}
                        </FieldLabel>
                      </Field>
                    </RadioGroup>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </FieldSet>
                )}
              />
            )}
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">{t('cancel')}</Button>
          </DialogClose>
          <Button type="submit" form="language-form">
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
