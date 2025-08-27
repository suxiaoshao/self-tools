import { Close, Edit as EditIcon, Preview } from '@mui/icons-material';
import {
  AppBar,
  Backdrop,
  Box,
  Button,
  CircularProgress,
  Dialog,
  FormLabel,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from '@mui/material';
import { useI18n } from 'i18n';
import { useEffect, useState } from 'react';
import { Controller, type SubmitHandler, useForm } from 'react-hook-form';
import { match } from 'ts-pattern';
import CustomEdit from '../../../components/CustomEdit';
import Markdown from '../../../components/Markdown';
import type { CreateItemMutationVariables } from '../../../gql/graphql';
export type ItemFormData = Omit<CreateItemMutationVariables, 'collectionId'>;

export interface ItemFormProps {
  afterSubmit?: (data: ItemFormData) => Promise<void>;
  handleClose: () => void;
  open: boolean;
  mode?: 'create' | 'edit';
  initialValues?: ItemFormData;
  loading?: boolean;
}

export default function ItemForm({
  afterSubmit,
  handleClose,
  open,
  mode,
  initialValues,
  loading = false,
}: ItemFormProps) {
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
  const [alignment, setAlignment] = useState<'edit' | 'preview' | null>('edit');
  const handleAlignment = (event: React.MouseEvent<HTMLElement>, newAlignment: 'edit' | 'preview' | null) => {
    setAlignment(newAlignment);
  };
  const t = useI18n();
  return (
    <Dialog fullScreen open={open} onClose={handleClose}>
      <Box sx={{ height: '100%' }} onSubmit={handleSubmit(onSubmit)} component="form">
        <AppBar sx={{ position: 'relative' }}>
          <Toolbar>
            <IconButton edge="start" color="secondary" onClick={handleClose} aria-label="close">
              <Close />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              {match(mode)
                .with('create', () => t('create_item'))
                .otherwise(() => t('modify_item'))}
            </Typography>
            <Button type="submit" color="inherit">
              {t('submit')}
            </Button>
          </Toolbar>
        </AppBar>
        <Box
          sx={{
            overflow: 'hidden',
            height: 'calc(100% - 64px)',
            display: 'flex',
            flexDirection: 'column',
            padding: 2,
          }}
        >
          <TextField
            variant="standard"
            required
            fullWidth
            label={t('item_name')}
            {...register('name', { required: true })}
          />

          <Controller
            control={control}
            name="content"
            rules={{ required: true }}
            render={({ field }) => (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                  <FormLabel sx={{ flex: 1 }} required>
                    {t('content')}
                  </FormLabel>
                  <ToggleButtonGroup
                    color="primary"
                    size="small"
                    value={alignment}
                    exclusive
                    onChange={handleAlignment}
                  >
                    <ToggleButton value="edit">
                      <EditIcon />
                    </ToggleButton>
                    <ToggleButton value="preview">
                      <Preview />
                    </ToggleButton>
                  </ToggleButtonGroup>
                </Box>
                {match(alignment)
                  .with('edit', () => (
                    <CustomEdit
                      wordWrap="on"
                      sx={{ width: '100%', flex: '1 1 0', borderRadius: 2, overflow: 'hidden', mt: 1 }}
                      language="markdown"
                      {...field}
                    />
                  ))
                  .otherwise(() => (
                    <Markdown sx={{ overflowY: 'auto', mt: 1 }} value={field.value ?? ''} />
                  ))}
              </>
            )}
          />
        </Box>
      </Box>
      <Backdrop sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }} open={loading}>
        <CircularProgress />
      </Backdrop>
    </Dialog>
  );
}
