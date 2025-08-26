/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-28 00:34:34
 * @FilePath: /self-tools/web/packages/portal/src/components/AppRouter.tsx
 */
import { Routes, Route } from 'react-router-dom';
import AppDrawer from './AppDrawer';
import Home from '../features/Home';
import Login, { useLogin } from '../features/Auth';
import { microConfigs } from '@portal/micro';
import type { Menu } from 'types';
import { match } from 'ts-pattern';
import { useI18n } from 'i18n';

function MenuRouter({ path }: Menu) {
  return match(path)
    .with({ tag: 'path' }, ({ value }) => {
      return (
        <Route key={value.path} path={value.path} element={value.element}>
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
  const t = useI18n();

  return (
    <>
      <title>{t('self_tools')}</title>
      <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      <link rel="icon" type="image/png" href="/logo.png" sizes="32x32" />
      <link rel="apple-touch-icon" href="/logo.png" />
      <link rel="shortcut icon" href="/logo.png" />
      <Routes>
        <Route path="/" element={<AppDrawer />}>
          <Route path="/" element={<Home />} />
          {microConfigs.map((item) => (
            <Route key={`route-${item.getActiveRule()}`} path={item.getActiveRule()} element={item.getElement()}>
              {item.getMenu().map((menu) => MenuRouter(menu))}
            </Route>
          ))}
          <Route path="login" element={<Login />} />
        </Route>
      </Routes>
    </>
  );
}
