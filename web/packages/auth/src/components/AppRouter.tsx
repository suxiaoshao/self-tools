import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/">
        <Route index element={<Navigate to={'/login'} replace />} />
        <Route path="login" element={<Login />} />
        <Route path="logined" />
        <Route path="*" element={<Navigate to={'/login'} replace />} />
      </Route>
    </Routes>
  );
}
