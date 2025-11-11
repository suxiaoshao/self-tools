import { LogOut } from 'lucide-react';
import { useAuthStore } from './authSlice';
import { useI18n } from 'i18n';
import { useShallow } from 'zustand/react/shallow';
import { SidebarMenuButton, SidebarMenuItem } from '@portal/components/ui/sidebar';

export default function AuthDrawerItem() {
  const logout = useAuthStore(useShallow(({ logout }) => logout));
  const t = useI18n();
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        onClick={() => {
          logout();
        }}
      >
        <LogOut />
        <span>{t('logout')}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
