/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-14 03:12:52
 * @FilePath: /self-tools/web/packages/portal/src/components/AppDrawer/index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Home } from '@mui/icons-material';
import { Box, Divider, List, Paper } from '@mui/material';
import { Outlet } from 'react-router-dom';
import RouterItems from './RouterItem';
import { I18nDrawerItem, useI18n } from 'i18n';
import DrawerMenu from '../../features/Menu';
import { AuthDrawerItem } from '../../features/Auth';
import { ThemeDrawerItem } from '../../features/Theme';

export default function AppDrawer() {
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
          <RouterItems text={t('home')} icon={<Home />} matchPaths={['/']} toPath="/" />
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
      </Box>
    </Box>
  );
}
