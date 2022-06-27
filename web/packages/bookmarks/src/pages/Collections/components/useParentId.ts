import { useSearchParams } from 'react-router-dom';

export default function useParentId() {
  const [urlSearch] = useSearchParams();
  const parentId = parseInt(urlSearch.get('parentId') ?? '') || null;
  return parentId;
}
