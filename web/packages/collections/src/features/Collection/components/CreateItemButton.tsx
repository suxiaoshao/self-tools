import { Close, Edit as EditIcon, Preview } from '@mui/icons-material';
import {
  Button,
  Dialog,
  Box,
  TextField,
  AppBar,
  IconButton,
  Toolbar,
  Typography,
  FormLabel,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { CreateItemMutationVariables, useCreateItemMutation } from '../../../graphql';
import CustomEdit from '../../../components/CustomEdit';
import Markdown from '../../../components/Markdown';

export interface CreateItemButtonProps {
  /** 表格重新刷新 */
  refetch: () => void;
  collectionId: number;
}

export default function CreateItemButton({ refetch, collectionId }: CreateItemButtonProps): JSX.Element {
  type FormData = Omit<CreateItemMutationVariables, 'parentId'>;
  // 表单控制
  const { handleSubmit, register, control } = useForm<FormData>();
  const [createItem] = useCreateItemMutation();

  const onSubmit: SubmitHandler<FormData> = async ({ name, content }) => {
    await createItem({ variables: { name, collectionId, content } });
    refetch();
    handleClose();
  };
  // 控制 dialog
  const [open, setOpen] = useState(false);
  const handleClose = () => {
    setOpen(false);
  };
  const [alignment, setAlignment] = useState<'edit' | 'preview' | null>('edit');
  const handleAlignment = (event: React.MouseEvent<HTMLElement>, newAlignment: 'edit' | 'preview' | null) => {
    setAlignment(newAlignment);
  };
  return (
    <>
      <Button color="secondary" sx={{ ml: 2 }} size="large" variant="contained" onClick={() => setOpen(true)}>
        添加项目
      </Button>
      <Dialog fullScreen open={open} onClose={handleClose}>
        <Box sx={{ height: '100%' }} onSubmit={handleSubmit(onSubmit)} component="form">
          <AppBar sx={{ position: 'relative' }}>
            <Toolbar>
              <IconButton edge="start" color="secondary" onClick={handleClose} aria-label="close">
                <Close />
              </IconButton>
              <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
                新建项目
              </Typography>
              <Button autoFocus type="submit" color="inherit">
                提交
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
            <TextField variant="standard" required fullWidth label="项目名" {...register('name', { required: true })} />

            <Controller
              control={control}
              name="content"
              rules={{ required: true }}
              render={({ field }) => (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                    <FormLabel sx={{ flex: 1 }} required>
                      内容
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
                  {alignment === 'edit' ? (
                    <CustomEdit
                      sx={{ width: '100%', flex: '1 1 0', borderRadius: 2, overflow: 'hidden', mt: 1 }}
                      language="markdown"
                      {...field}
                    />
                  ) : (
                    <Markdown sx={{ overflowY: 'auto' }} value={field.value ?? ''} />
                  )}
                </>
              )}
            />
          </Box>
        </Box>
      </Dialog>
    </>
  );
}
