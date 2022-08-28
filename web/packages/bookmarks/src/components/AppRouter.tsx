import { Routes, Route } from 'react-router-dom';
import Login, { useLogin } from 'auth';
import Collection from '../features/Collections';
import AppDrawer from './AppDrawer';
import Tags from '../features/Tags';
import Author from '../features/Author';
import Novel from '../features/Novel';

export default function AppRouter() {
  useLogin();

  return (
    <Routes>
      <Route path="/" element={<AppDrawer />}>
        <Route index element={<Novel />} />
        <Route path="tags" element={<Tags />} />
        <Route path="authors" element={<Author />} />
        <Route path="collections" element={<Collection />} />
      </Route>
      <Route path="login" element={<Login />} />
    </Routes>
  );
}
