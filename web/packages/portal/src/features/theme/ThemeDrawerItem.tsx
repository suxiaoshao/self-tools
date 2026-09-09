import { Palette } from 'lucide-react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { ColorSetting, useThemeStore } from 'ui/theme';
import { string, object, type InferInput, pipe, regex, enum_ } from 'valibot';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useI18n } from 'i18n';
import { useShallow } from 'zustand/react/shallow';
import { SidebarMenuButton, SidebarMenuItem } from 'ui/components/sidebar';
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
import { FieldError, FieldGroup, FieldLabel, Field } from 'ui/components/field';
import { RadioGroup, RadioGroupItem } from 'ui/components/radio-group';
import { Input } from 'ui/components/input';
import { useDialog } from 'hooks';

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
      <SidebarMenuItem>
        <DialogTrigger render={<SidebarMenuButton />}>
          <Palette />
          <span>{t('theme_setting')}</span>
        </DialogTrigger>
      </SidebarMenuItem>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('theme_setting')}</DialogTitle>
        </DialogHeader>
        <form noValidate id="theme-form" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="colorSetting"
              control={control}
              render={({ field, fieldState }) => (
                <Field>
                  <FieldLabel id="theme-mode-label">{t('select_mode')}</FieldLabel>
                  <RadioGroup
                    aria-labelledby="theme-mode-label"
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
              <FieldLabel htmlFor="theme-color">{t('theme_color')}</FieldLabel>
              <Input
                id="theme-color"
                aria-invalid={!!errors.color}
                aria-describedby={errors.color ? 'theme-color-error' : undefined}
                type="color"
                {...register('color')}
              />
              {errors.color?.message && (
                <FieldError
                  id="theme-color-error"
                  errors={[
                    errors.color && {
                      ...errors.color,
                      message: errors.color?.type === 'required' ? t('request_required') : errors.color.message,
                    },
                  ]}
                />
              )}
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
