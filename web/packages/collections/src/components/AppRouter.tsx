import { Routes, Route } from 'react-router-dom';
import Login, { useLogin } from 'auth';
import AppDrawer from './AppDrawer';
import Collection from '../features/Collection';
import ItemList from '../features/Item/List';
export default function AppRouter() {
  useLogin();

  return (
    <Routes>
      <Route path="/" element={<AppDrawer />}>
        <Route index element={<ItemList />} />
        <Route path="collections" element={<Collection />} />
      </Route>
      <Route path="login" element={<Login />} />
    </Routes>
  );
}
