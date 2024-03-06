/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-05 23:57:14
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-06 00:35:18
 * @FilePath: /self-tools/web/packages/bookmarks/src/components/ChapterModal/index.tsx
 */
import { FetchAuthorQuery } from '@bookmarks/graphql';
import { Dialog, DialogTitle, IconButton, List, ListItem, ListItemButton, ListItemText, Tooltip } from '@mui/material';
import { useCallback, useState } from 'react';
import { useI18n } from 'i18n';
import { ViewList } from '@mui/icons-material';

export interface ChapterModalProps {
  chapters: FetchAuthorQuery['fetchAuthor']['novels'][0]['chapters'];
}

export default function ChapterModal({ chapters }: ChapterModalProps) {
  const [open, setOpen] = useState(false);
  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);
  const handleOpen = useCallback(() => {
    setOpen(true);
  }, []);
  const t = useI18n();
  return (
    <>
      <Tooltip title={t('view_novel_chapters')}>
        <IconButton onClick={handleOpen}>
          <ViewList />
        </IconButton>
      </Tooltip>
      <Dialog fullWidth maxWidth={'xs'} onClose={handleClose} open={open}>
        <DialogTitle>{t('novel_chapters')}</DialogTitle>
        <List sx={{ pt: 0 }}>
          {chapters.map((chapter) => (
            <ListItem key={chapter.url}>
              <ListItemText primary={chapter.title} secondary={`${chapter.time} - ${chapter.wordCount}`} />
            </ListItem>
          ))}
        </List>
      </Dialog>
    </>
  );
}
