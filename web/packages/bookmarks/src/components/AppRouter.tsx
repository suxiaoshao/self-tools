import { Routes, Route } from 'react-router-dom';
import Login, { useLogin } from 'auth';

export default function AppRouter() {
  useLogin();

  return (
    <Routes>
      <Route path="/">
        <Route index element={<>xixi</>} />
        <Route path="login" element={<Login />} />
      </Route>
    </Routes>
  );
}
