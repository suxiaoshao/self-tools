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
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useAppDispatch, useAppSelector, setLangSetting, I18nSliceType } from './i18nSlice';
import { string, object } from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useI18n } from '.';

export default function I18nDrawerItem() {
  const t = useI18n();
  const createColorSchema = object({
    langMode: string().required(t('cannot_empty')).equals(['custom', 'system']),
    customLang: string().required(t('cannot_empty')).equals(['en', 'zh']),
  });
  // 控制 dialog
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  type FormData = Pick<I18nSliceType, 'customLang' | 'langMode'>;
  const i18n = useAppSelector((state) => state.i18n);
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
    resolver: yupResolver(createColorSchema),
  });
  const dispatch = useAppDispatch();
  const onSubmit: SubmitHandler<FormData> = async (data) => {
    await dispatch(setLangSetting(data));
    handleClose();
  };
  const watchTag = watch('langMode');

  return (
    <>
      <ListItemButton onClick={() => setOpen(true)}>
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
                      field.onChange(newValue);
                    }}
                  >
                    <FormControlLabel value="custom" control={<Radio />} label={t('custom')} />
                    <FormControlLabel value="system" control={<Radio />} label={t('system')} />
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
                        field.onChange(newValue);
                      }}
                    >
                      <FormControlLabel value="zh" control={<Radio />} label={t('chinese')} />
                      <FormControlLabel value="en" control={<Radio />} label={t('english')} />
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
