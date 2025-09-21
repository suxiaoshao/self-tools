import { useMutation } from '@apollo/client/react';
import type { GetNovelQuery } from '@bookmarks/gql/graphql';
import useDialog from '@collections/hooks/useDialog';
import { Edit } from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Tooltip,
  Checkbox,
  List,
  ListItemText,
  ListItemButton,
  DialogContent,
} from '@mui/material';
import { useI18n } from 'i18n';
import { useCallback, useState } from 'react';
import { format } from 'time';
import { match } from 'ts-pattern';
import { AddReadRecord, DeleteReadRecord } from './ChapterTableAction';

type Data = GetNovelQuery['getNovel']['chapters'][0];

export interface ChapterBatchUpdateProps {
  chapters: Data[];
  novelId: number;
  refetch: () => void;
}

export default function ChapterBatchUpdate({ chapters, novelId, refetch }: ChapterBatchUpdateProps) {
  const t = useI18n();
  const { open, handleClose, handleOpen } = useDialog();
  const [checked, setChecked] = useState<number[]>(chapters.filter(({ isRead }) => isRead).map(({ id }) => id));
  const handleToggle = (id: number) => {
    setChecked((prev) =>
      match(prev.includes(id))
        .with(true, () => prev.filter((i) => i !== id))
        .with(false, () => [...prev, id])
        .exhaustive(),
    );
  };
  const [addReadRecord, { loading: addLoading }] = useMutation(AddReadRecord);
  const [deleteReadRecord, { loading: deleteLoading }] = useMutation(DeleteReadRecord);
  const handleSubmit = async () => {
    const addArrays = checked.filter((id) => !chapters.find((chapter) => chapter.id === id)?.isRead);
    const deleteArrays = checked.filter((id) => chapters.find((chapter) => chapter.id === id)?.isRead);
    await Promise.all([
      addArrays.length > 0 && addReadRecord({ variables: { chapterIds: addArrays, novelId } }),
      deleteArrays.length > 0 && deleteReadRecord({ variables: { chapterIds: deleteArrays } }),
    ]);
    handleClose();
    refetch();
  };
  const handleToggleAll = useCallback(() => {
    setChecked((prev) =>
      match(prev.length === chapters.length)
        .with(true, () => [])
        .with(false, () => chapters.map((chapter) => chapter.id))
        .exhaustive(),
    );
  }, [chapters]);
  const indeterminate = checked.length > 0 && checked.length < chapters.length;
  return (
    <Box>
      {t('is_read')}
      <Tooltip title={t('batch_update')}>
        <IconButton size="small" onClick={handleOpen}>
          <Edit fontSize="small" />
        </IconButton>
      </Tooltip>
      <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={open} scroll="paper">
        <DialogTitle>
          {t('batch_update')}
          <Tooltip
            title={match(indeterminate)
              .with(true, () => t('select_none'))
              .with(false, () => t('select_all'))
              .exhaustive()}
          >
            <Checkbox
              sx={(theme) => ({
                position: 'absolute',
                right: theme.spacing(2),
                top: theme.spacing(2),
              })}
              edge="end"
              checked={checked.length === chapters.length}
              onChange={handleToggleAll}
              indeterminate={indeterminate}
            />
          </Tooltip>
        </DialogTitle>
        <DialogContent>
          <List dense sx={{ pt: 0 }}>
            {chapters.map((chapter) => (
              <ListItemButton
                key={chapter.url}
                onClick={() => {
                  handleToggle(chapter.id);
                }}
              >
                <Checkbox edge="start" checked={checked.includes(chapter.id)} tabIndex={-1} disableRipple />
                <ListItemText primary={chapter.title} secondary={`${format(chapter.time)} - ${chapter.wordCount}`} />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('cancel')}</Button>
          <Button onClick={handleSubmit} disabled={addLoading || deleteLoading}>
            {t('submit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
