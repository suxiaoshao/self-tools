import { type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useI18n } from 'i18n';
import { AsyncBoundary } from 'ui/async-boundary';
import { Button } from 'ui/components/button';
import { PageToolbar } from 'ui/page-toolbar';

export default function RouteBoundary({ children }: { children?: ReactNode }) {
  const t = useI18n();
  const location = useLocation();
  return (
    <AsyncBoundary
      resetKey={location.pathname}
      pending={
        <div className="flex min-h-0 size-full flex-col">
          <PageToolbar />
          <output className="min-h-0 flex-1 overflow-auto p-4">{t('loading')}</output>
        </div>
      }
      failed={
        <div className="flex min-h-0 size-full flex-col">
          <PageToolbar>
            <Button onClick={() => window.location.reload()}>{t('reload_page')}</Button>
          </PageToolbar>
          <div role="alert" className="min-h-0 flex-1 overflow-auto p-4">
            <p>{t('route_load_failed')}</p>
          </div>
        </div>
      }
    >
      {children ?? <Outlet />}
    </AsyncBoundary>
  );
}
