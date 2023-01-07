import { Logout, Book, CollectionsBookmark } from '@mui/icons-material';
import { Box, Divider, List, ListItemButton, ListItemIcon, ListItemText, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';
import RouterItem from './RouterItem';
import { useAppDispatch } from '../../app/hooks';
import { logout } from 'auth';
import { ThemeFormItem } from 'theme';

export default function AppDrawer(): JSX.Element {
  const width = 250;
  const dispatch = useAppDispatch();
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
        </List>
        <Divider />
        <List sx={{ width }}>
          <ThemeFormItem />
          <ListItemButton onClick={() => dispatch(logout())}>
            <ListItemIcon>
              <Logout />
            </ListItemIcon>
            <ListItemText>登出</ListItemText>
          </ListItemButton>
        </List>
      </Box>

      <Box sx={{ flex: '1 1 0' }}>
        <Outlet />
      </Box>
    </Box>
  );
}
