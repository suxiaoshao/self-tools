import { Language } from '@mui/icons-material';
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
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Radio,
  RadioGroup,
} from '@mui/material';
import { useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { useI18nStore, LangMode, CustomLang } from './i18nSlice';
import { object, enum_, type InferInput } from 'valibot';
import { valibotResolver } from '@hookform/resolvers/valibot';
import { useI18n } from './useI18n';
import { useShallow } from 'zustand/react/shallow';

export default function I18nDrawerItem() {
  const t = useI18n();
  const createColorSchema = object({
    langMode: enum_(LangMode),
    customLang: enum_(CustomLang),
  });
  type FormData = InferInput<typeof createColorSchema>;
  // 控制 dialog
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const { i18n, setLangSetting } = useI18nStore(
    useShallow((state) => ({
      i18n: state.value,
      setLangSetting: state.setLangSetting,
    })),
  );
  const {
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<FormData>({
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

  return (
    <>
      <ListItemButton
        onClick={() => {
          setOpen(true);
        }}
      >
        <ListItemIcon>
          <Language />
        </ListItemIcon>
        <ListItemText>{t('language_setting')}</ListItemText>
      </ListItemButton>
      <Dialog PaperProps={{ sx: { maxWidth: 700 } }} open={open} onClose={handleClose}>
        <Box sx={{ width: 500 }} onSubmit={handleSubmit(onSubmit)} component="form">
          <DialogTitle>{t('language_setting')}</DialogTitle>
          <DialogContent>
            <FormControl error={errors.langMode && true} fullWidth>
              <FormLabel id="color-setting">{t('select_mode')}</FormLabel>
              <Controller
                name="langMode"
                control={control}
                rules={{ required: true }}
                render={({ field }) => (
                  <RadioGroup
                    row
                    aria-labelledby="color-setting"
                    {...field}
                    onChange={(event, newValue) => {
                      field.onChange(newValue as 'custom' | 'system');
                    }}
                  >
                    <FormControlLabel value={LangMode.custom} control={<Radio />} label={t('custom')} />
                    <FormControlLabel value={LangMode.system} control={<Radio />} label={t('system')} />
                  </RadioGroup>
                )}
              />

              <FormHelperText id="color-setting">{errors.langMode?.message}</FormHelperText>
            </FormControl>
            {watchTag === 'custom' && (
              <FormControl error={errors.customLang && true} fullWidth>
                <FormLabel id="color-setting">{t('select_language')}</FormLabel>
                <Controller
                  name="customLang"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <RadioGroup
                      row
                      aria-labelledby="color-setting"
                      {...field}
                      onChange={(event, newValue) => {
                        field.onChange(newValue as 'en' | 'zh');
                      }}
                    >
                      <FormControlLabel value={CustomLang.zh} control={<Radio />} label={t('chinese')} />
                      <FormControlLabel value={CustomLang.en} control={<Radio />} label={t('english')} />
                    </RadioGroup>
                  )}
                />
                <FormHelperText id="color-setting">{errors.customLang?.message}</FormHelperText>
              </FormControl>
            )}
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
