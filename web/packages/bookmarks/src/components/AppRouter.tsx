import { Routes, Route } from 'react-router-dom';
import Login, { useLogin } from 'auth';
import Collection from '../pages/Collections';
import AppDrawer from './AppDrawer';
import Tags from '../pages/Tags';

export default function AppRouter() {
  useLogin();

  return (
    <Routes>
      <Route path="/" element={<AppDrawer />}>
        <Route index element={<>home</>} />
        <Route path="tags" element={<Tags />} />
        <Route path="authors" element={<>authors</>} />
        <Route path="collections" element={<Collection />} />
      </Route>
      <Route path="login" element={<Login />} />
    </Routes>
  );
}
