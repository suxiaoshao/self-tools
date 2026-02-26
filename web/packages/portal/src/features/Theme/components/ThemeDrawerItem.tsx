import { Palette } from 'lucide-react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { ColorSetting, useThemeStore } from '../themeSlice';
import { string, object, type InferInput, pipe, regex, enum_ } from 'valibot';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useI18n } from 'i18n';
import { useShallow } from 'zustand/react/shallow';
import { SidebarMenuButton, SidebarMenuItem } from '@portal/components/ui/sidebar';
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
import { FieldError, FieldGroup, FieldLabel, Field } from '@portal/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@portal/components/ui/radio-group';
import { Input } from '@portal/components/ui/input';
import useDialog from '@collections/hooks/useDialog';

export default function ThemeDrawerItem() {
  const { open, handleClose, handleOpenChange } = useDialog();
  const { updateColor, ...theme } = useThemeStore(useShallow((state) => state));
  const t = useI18n();
  const createColorSchema = object({
    color: pipe(string(), regex(/^#[0-9a-fA-F]{6}$/, t('color_format_error'))),
    colorSetting: enum_(ColorSetting),
  });
  type FormData = InferInput<typeof createColorSchema>;
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    defaultValues: theme,
    resolver: valibotResolver(createColorSchema),
  });
  const onSubmit: SubmitHandler<FormData> = ({ color, colorSetting }) => {
    updateColor(color, colorSetting);
    handleClose();
    reset(theme);
  };
  const onOpenChange = (open: boolean) => {
    handleOpenChange(open);
    reset(theme);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger render={<SidebarMenuItem />}>
        <SidebarMenuButton>
          <Palette />
          <span>{t('theme_setting')}</span>
        </SidebarMenuButton>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('theme_setting')}</DialogTitle>
        </DialogHeader>
        <form id="theme-form" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="colorSetting"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel>{t('select_mode')}</FieldLabel>
                  <RadioGroup
                    {...field}
                    onValueChange={field.onChange}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  >
                    <Field orientation="horizontal">
                      <RadioGroupItem value={ColorSetting.light} id="theme-light" />
                      <FieldLabel htmlFor="theme-light" className="font-normal">
                        {t('light')}
                      </FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem value={ColorSetting.dark} id="theme-dark" />
                      <FieldLabel htmlFor="theme-dark" className="font-normal">
                        {t('dark')}
                      </FieldLabel>
                    </Field>
                    <Field orientation="horizontal">
                      <RadioGroupItem value={ColorSetting.system} id="theme-system" />
                      <FieldLabel htmlFor="theme-system" className="font-normal">
                        {t('system')}
                      </FieldLabel>
                    </Field>
                  </RadioGroup>
                </Field>
              )}
            />

            <Field>
              <FieldLabel>{t('theme_color')}</FieldLabel>
              <Input type="color" {...register('color')} />
              {errors.color?.message && <FieldError errors={[errors.color]} />}
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
          <Button type="submit" form="theme-form">
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
