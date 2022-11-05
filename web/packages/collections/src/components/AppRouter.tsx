import { Routes, Route } from 'react-router-dom';
import Login, { useLogin } from 'auth';
import AppDrawer from './AppDrawer';
export default function AppRouter() {
  useLogin();

  return (
    <Routes>
      <Route path="/" element={<AppDrawer />}>
        <Route index element={<>home</>} />
      </Route>
      <Route path="login" element={<Login />} />
    </Routes>
  );
}
