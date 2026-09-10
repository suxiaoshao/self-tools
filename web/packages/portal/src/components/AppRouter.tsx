/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-28 00:34:34
 * @FilePath: /self-tools/web/packages/portal/src/components/AppRouter.tsx
 */
import { Routes, Route } from 'react-router';
import AppDrawer from './AppDrawer/index';
import Home from '../features/home/index';
import Login, { useLogin, SessionGate, Security, useAuthStore } from '../features/auth';
import { microConfigs } from '@portal/micro/index';
import type { Menu } from 'types';
import { match } from 'ts-pattern';
import ErrorPage from './Error/index';
import RouteBoundary from './RouteBoundary';

function MenuRouter({ path }: Menu) {
  return match(path)
    .with({ tag: 'path' }, ({ value }) => {
      return (
        <Route key={value.path} path={value.path} element={<RouteBoundary>{value.element}</RouteBoundary>}>
          {value.children}
        </Route>
      );
    })
    .with({ tag: 'menu' }, ({ value }) => {
      return (
        <>
          {value.map((item) => (
            <MenuRouter key={item.name} {...item} />
          ))}
        </>
      );
    })
    .exhaustive();
}

export default function AppRouter() {
  useLogin();
  const generation = useAuthStore((s) => s.generation);

  return (
    <>
      <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      <link rel="icon" type="image/png" href="/logo.png" sizes="32x32" />
      <link rel="apple-touch-icon" href="/logo.png" />
      <link rel="shortcut icon" href="/logo.png" />
      <SessionGate>
        <Routes key={generation}>
          <Route path="/" element={<AppDrawer />}>
            <Route path="/" element={<Home />} />
            <Route
              path="/settings/security"
              element={
                <RouteBoundary>
                  <Security />
                </RouteBoundary>
              }
            />
            {microConfigs.map((item) => (
              <Route
                key={`route-${item.getActiveRule()}`}
                path={item.getActiveRule()}
                element={<RouteBoundary>{item.getElement()}</RouteBoundary>}
              >
                {item.getMenu().map((menu) => MenuRouter(menu))}
              </Route>
            ))}
          </Route>
          <Route path="login" element={<Login />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </SessionGate>
    </>
  );
}
