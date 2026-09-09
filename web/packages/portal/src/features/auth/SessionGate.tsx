import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { useI18n } from 'i18n';
import { useAuthStore } from './authSlice';
import { Button } from 'ui/components/button';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription, EmptyContent } from 'ui/components/empty';
export default function SessionGate({ children }: { children: ReactNode }) {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();
  const t = useI18n();
  if (status === 'checking' || status === 'unavailable')
    return (
      <Empty className="min-h-svh">
        <EmptyHeader>
          <EmptyTitle>{t(status === 'checking' ? 'auth_checking' : 'auth_unavailable')}</EmptyTitle>
          <EmptyDescription>{t('auth_session_check_description')}</EmptyDescription>
        </EmptyHeader>
        {status === 'unavailable' && (
          <EmptyContent>
            <Button onClick={() => useAuthStore.getState().initialize(new AbortController().signal)}>
              {t('auth_retry')}
            </Button>
          </EmptyContent>
        )}
      </Empty>
    );
  if (status === 'anonymous' && location.pathname !== '/login')
    return (
      <Navigate
        replace
        to={{
          pathname: '/login',
          search: new URLSearchParams({ from: location.pathname + location.search + location.hash }).toString(),
        }}
      />
    );
  return children;
}
