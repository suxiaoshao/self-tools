import { Routes, Route } from 'react-router-dom';
import Login, { useLogin } from 'auth';
import Home from '../pages/Home';

export default function AppRouter() {
  useLogin();

  return (
    <Routes>
      <Route path="/">
        <Route index element={<Home />} />
        <Route path="login" element={<Login />} />
      </Route>
    </Routes>
  );
}
