import { Home } from '@mui/icons-material';
import { Box, Divider, List, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';
import RouterItem from './RouterItem';
import { I18nDrawerItem, useI18n } from 'i18n';
import DrawerMenu from '../../features/Menu';
import { AuthDrawerItem } from '../../features/Auth';
import { ThemeDrawerItem } from '../../features/Theme';

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
          <RouterItem text={t('home')} icon={<Home />} matchPaths={['/']} toPath="/" />
          <DrawerMenu />
        </List>
        <Divider />
        <List sx={{ width }}>
          <ThemeDrawerItem />
          <I18nDrawerItem />
          <AuthDrawerItem />
        </List>
      </Box>

      <Box sx={{ flex: '1 1 0' }}>
        <Outlet />
        <Box sx={{ width: '100%', height: '100%' }} id="micro"></Box>
      </Box>
    </Box>
  );
}
