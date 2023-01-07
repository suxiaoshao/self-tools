import { Tag, People, CollectionsBookmark, Book } from '@mui/icons-material';
import { Box, Divider, List, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';
import RouterItem from './RouterItem';
import { AuthDrawerItem } from 'auth';
import { ThemeDrawerItem } from 'theme';

export default function AppDrawer(): JSX.Element {
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
          <RouterItem text="工作区" icon={<Book />} matchPaths={['/']} toPath="/" />
          <RouterItem
            text="集合管理"
            icon={<CollectionsBookmark />}
            matchPaths={['/collections']}
            toPath="/collections"
          />
          <RouterItem text="标签管理" icon={<Tag />} matchPaths={['/tags']} toPath="/tags" />
          <RouterItem text="作者管理" icon={<People />} matchPaths={['/authors']} toPath="/authors" />
        </List>
        <Divider />
        <List sx={{ width }}>
          <ThemeDrawerItem />
          <AuthDrawerItem />
        </List>
      </Box>

      <Box sx={{ flex: '1 1 0' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
