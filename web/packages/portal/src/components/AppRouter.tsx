import { Routes, Route } from 'react-router-dom';
import AppDrawer from './AppDrawer';
import Home from '../features/Home';
import Login, { useLogin } from '../features/Auth';

export default function AppRouter() {
  useLogin();

  return (
    <Routes>
      <Route path="/" element={<AppDrawer />}>
        <Route path="/" element={<Home />} />
        <Route path="/collections/*" />
        <Route path="/bookmarks/*" />
        <Route path="login" element={<Login />} />
      </Route>
    </Routes>
  );
}
