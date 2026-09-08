import { LogOut, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router';
import { useI18n } from 'i18n';
import { useAuthStore } from './authSlice';
import { logout } from './service';
import { useAuthAction } from './useAuthAction';
import { SidebarMenuButton, SidebarMenuItem } from '@portal/components/ui/sidebar';
export default function AuthDrawerItem() {
  const t = useI18n();
  const action = useAuthAction();
  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton render={<Link to="/settings/security" />}>
          <ShieldCheck />
          <span>{t('auth_security')}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          disabled={action.pending}
          onClick={() =>
            action.run(async (signal, generation) => {
              await logout(signal);
              if (!signal.aborted) useAuthStore.getState().accept(null, generation);
            })
          }
        >
          <LogOut />
          <span>{t('logout')}</span>
        </SidebarMenuButton>
        {action.error && (
          <p role="alert" className="px-2 text-sm">
            {t(action.error)} {action.requestId && <code>{action.requestId}</code>}
          </p>
        )}
      </SidebarMenuItem>
    </>
  );
}
