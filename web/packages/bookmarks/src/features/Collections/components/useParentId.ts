import { useSearchParams } from 'react-router-dom';

export default function useParentId() {
  const [urlSearch] = useSearchParams();
  const parentId = Number.parseInt(urlSearch.get('parentId') ?? '', 10) || null;
  return parentId;
}
