import { Tag, People, CollectionsBookmark, Book } from '@mui/icons-material';
import { Box, Divider, List, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';
import RouterItem from './RouterItem';
import { ThemeDrawerItem } from 'theme';
import { I18nDrawerItem, useI18n } from 'i18n';

export default function AppDrawer(): JSX.Element {
  const t = useI18n();
  const width = 250;
  return (
    <Box sx={{ display: 'flex', height: '100%' }}>
      <Box
        elevation={3}
        sx={{
          flex: `0 0 ${width}px`,
        }}
        component={Paper}
        square
      >
        <List sx={{ width }}>
          <RouterItem text={t('workspace')} icon={<Book />} matchPaths={['/']} toPath="/" />
          <RouterItem
            text={t('collection_manage')}
            icon={<CollectionsBookmark />}
            matchPaths={['/collections']}
            toPath="/collections"
          />
          <RouterItem text={t('tag_manage')} icon={<Tag />} matchPaths={['/tags']} toPath="/tags" />
          <RouterItem text={t('author_manage')} icon={<People />} matchPaths={['/authors']} toPath="/authors" />
        </List>
        <Divider />
        <List sx={{ width }}>
          <ThemeDrawerItem />
          <I18nDrawerItem />
        </List>
      </Box>

      <Box sx={{ flex: '1 1 0' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
