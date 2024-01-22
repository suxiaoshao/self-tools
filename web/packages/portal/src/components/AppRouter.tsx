/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-21 22:53:48
 * @FilePath: /self-tools/web/packages/portal/src/components/AppRouter.tsx
 */
import { Routes, Route } from 'react-router-dom';
import AppDrawer from './AppDrawer';
import Home from '../features/Home';
import Login, { useLogin } from '../features/Auth';
import { microConfigs } from '@portal/micro';
import { Menu } from 'types';

function MenuRouter({ path }: Menu) {
  switch (path.tag) {
    case 'path':
      return <Route key={path.value.path} path={path.value.path} element={path.value.element} />;
    case 'menu':
      return (
        <>
          {path.value.map((item) => (
            <MenuRouter key={item.name} {...item} />
          ))}
        </>
      );
  }
}

export default function AppRouter() {
  useLogin();

  return (
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
  );
}
