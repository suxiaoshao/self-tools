import { Routes, Route } from 'react-router-dom';
import Collection from '../features/Collection';
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/">
        <Route index element={<>home</>} />
        <Route path="collections" element={<Collection />} />
      </Route>
    </Routes>
  );
}
