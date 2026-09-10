import { type ReactNode } from 'react';
import { Outlet, useLocation } from 'react-router';
import { useI18n } from 'i18n';
import { AsyncBoundary } from 'ui/async-boundary';
import { Button } from 'ui/components/button';

export default function RouteBoundary({ children }: { children?: ReactNode }) {
  const t = useI18n();
  const location = useLocation();
  return (
    <AsyncBoundary
      resetKey={location.pathname}
      pending={<output className="p-4">{t('loading')}</output>}
      failed={
        <div role="alert" className="p-4">
          <p>{t('route_load_failed')}</p>
          <Button onClick={() => window.location.reload()}>{t('reload_page')}</Button>
        </div>
      }
    >
      {children ?? <Outlet />}
    </AsyncBoundary>
  );
}
