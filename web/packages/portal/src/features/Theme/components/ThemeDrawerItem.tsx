import { Palette } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputBase,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  RadioGroup,
} from '@mui/material';
import { useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { ColorSetting, useThemeStore } from '../themeSlice';
import { string, object, InferInput, pipe, regex, enum_ } from 'valibot';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useI18n } from 'i18n';
import { useShallow } from 'zustand/react/shallow';

export default function ThemeDrawerItem() {
  // 控制 dialog
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
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
  } = useForm<FormData>({
    defaultValues: theme,
    resolver: valibotResolver(createColorSchema),
  });
  const onSubmit: SubmitHandler<FormData> = ({ color, colorSetting }) => {
    updateColor(color, colorSetting);
    handleClose();
  };

  return (
    <>
      <ListItemButton onClick={() => setOpen(true)}>
        <ListItemIcon>
          <Palette />
        </ListItemIcon>
        <ListItemText>{t('theme_setting')}</ListItemText>
      </ListItemButton>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>{t('theme_setting')}</DialogTitle>
          <DialogContent>
            <FormControl fullWidth error={errors.colorSetting && true}>
              <FormLabel id="color-setting">{t('select_mode')}</FormLabel>
              <Controller
                name="colorSetting"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <RadioGroup
                    row
                    aria-labelledby="color-setting"
                    {...field}
                    onChange={(event, newValue) => {
                      field.onChange(newValue as 'dark' | 'light' | 'system');
                    }}
                  >
                    <FormControlLabel value="light" control={<Radio />} label={t('light')} />
                    <FormControlLabel value="dark" control={<Radio />} label={t('dark')} />
                    <FormControlLabel value="system" control={<Radio />} label={t('system')} />
                  </RadioGroup>
                )}
              />

              <FormHelperText id="color-setting">{errors.colorSetting?.message}</FormHelperText>
            </FormControl>
            <FormControl error={errors.colorSetting && true}>
              <FormLabel id="color">{t('theme_color')}</FormLabel>
              <InputBase type="color" {...register('color', { required: true })} />

              <FormHelperText id="color">{errors.color?.message}</FormHelperText>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>{t('cancel')}</Button>
            <Button type="submit">{t('submit')}</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </>
  );
}
