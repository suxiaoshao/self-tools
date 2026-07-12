import { useSearchParams } from 'react-router';

export default function useParentId() {
  const [urlSearch] = useSearchParams();
  const parentId = Number.parseInt(urlSearch.get('parentId') ?? '', 10) || null;
  return parentId;
}
