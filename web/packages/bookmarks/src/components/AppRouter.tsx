import { Routes, Route } from 'react-router-dom';
import Collection from '../features/Collections';
import Tags from '../features/Tags';
import Author from '../features/Author';
import Novel from '../features/Novel';

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/">
        <Route index element={<Novel />} />
        <Route path="tags" element={<Tags />} />
        <Route path="authors" element={<Author />} />
        <Route path="collections" element={<Collection />} />
      </Route>
    </Routes>
  );
}
