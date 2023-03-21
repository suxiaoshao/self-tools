import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useParentId() {
  const [urlSearch] = useSearchParams();
  const parentId = useMemo(() => parseInt(urlSearch.get('parentId') ?? '') || null, [urlSearch]);
  return parentId;
}
