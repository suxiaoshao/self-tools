/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-14 03:12:52
 * @FilePath: /self-tools/web/packages/portal/src/components/AppDrawer/index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Home } from 'lucide-react';
import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router';
import RouterItems from './RouterItem';
import { useI18n } from 'i18n';
import { I18nDrawerItem } from '../../features/language';
import DrawerMenu from '../../features/menu/index';
import { AuthDrawerItem } from '../../features/auth/index';
import { ThemeDrawerItem } from '../../features/theme';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarProvider,
  useSidebar,
} from 'ui/components/sidebar';
import { Toaster } from 'ui/components/sonner';

function CloseSidebarOnNavigation() {
  const { key } = useLocation();
  const { setOpenMobile } = useSidebar();

  // A location key also changes when a link targets the current page.
  useEffect(() => {
    setOpenMobile(false);
  }, [key, setOpenMobile]);

  return null;
}

export default function AppDrawer() {
  const t = useI18n();
  return (
    <SidebarProvider defaultOpen className="h-dvh min-h-0">
      <CloseSidebarOnNavigation />
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
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          <Outlet />
        </div>
        <Toaster />
      </main>
    </SidebarProvider>
  );
}
