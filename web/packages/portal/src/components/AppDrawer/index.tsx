/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-14 03:12:52
 * @FilePath: /self-tools/web/packages/portal/src/components/AppDrawer/index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Home } from 'lucide-react';
import { Outlet } from 'react-router-dom';
import RouterItems from './RouterItem';
import { I18nDrawerItem, useI18n } from 'i18n';
import DrawerMenu from '../../features/Menu';
import { AuthDrawerItem } from '../../features/Auth';
import { ThemeDrawerItem } from '../../features/Theme';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarProvider,
  SidebarTrigger,
} from '../ui/sidebar';

export default function AppDrawer() {
  const t = useI18n();
  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>{t('pages')}</SidebarGroupLabel>
            <RouterItems subItem={false} text={t('home')} icon={<Home />} matchPaths={['/']} toPath="/" />
            <DrawerMenu />
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>{t('actions')}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <ThemeDrawerItem />
                <I18nDrawerItem />
                <AuthDrawerItem />
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="flex-1">
        <Outlet />
      </main>
    </SidebarProvider>
  );
}
