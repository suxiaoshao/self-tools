import { Routes, Route } from 'react-router-dom';
import Login, { useLogin } from 'auth';
import AppDrawer from './AppDrawer';
import Home from '../features/Home';

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
