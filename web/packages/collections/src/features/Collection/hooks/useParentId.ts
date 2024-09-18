import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function useParentId() {
  const [urlSearch] = useSearchParams();
  const parentId = useMemo(() => Number.parseInt(urlSearch.get('parentId') ?? '', 10) || null, [urlSearch]);
  return parentId;
}
