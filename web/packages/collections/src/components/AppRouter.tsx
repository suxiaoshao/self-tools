import { Routes, Route } from 'react-router-dom';
import Login, { useLogin } from 'auth';
import AppDrawer from './AppDrawer';
import Collection from '../features/Collection';
export default function AppRouter() {
  useLogin();

  return (
    <Routes>
      <Route path="/" element={<AppDrawer />}>
        <Route index element={<>home</>} />
        <Route path="collections" element={<Collection />} />
      </Route>
      <Route path="login" element={<Login />} />
    </Routes>
  );
}
