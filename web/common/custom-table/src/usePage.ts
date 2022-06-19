import { useMemo, useState } from 'react';

export interface PageState {
  setPage: (num: number) => void;
  pageIndex: number;
  pageSize: number;
  offset: number;
  limit: number;
  setPageSize: (num: number) => void;
  pageSizeOptions?: number[];
}
export function usePage({
  initPageIndex = 0,
  initPageSize = 10,
  pageSizeOptions,
}: {
  initPageSize?: number;
  initPageIndex?: number;
  pageSizeOptions?: number[];
}): PageState {
  const [pageIndex, setPage] = useState(initPageIndex);
  const [pageSize, setPageSize] = useState(initPageSize);
  const offset = useMemo(() => pageIndex * pageSize, [pageIndex, pageSize]);
  const limit = useMemo(() => pageSize, [pageSize]);
  return { pageIndex, setPage, offset, limit, pageSize, setPageSize, pageSizeOptions };
}

/** 表格需要的 page 数据 */
export type PageWithTotal = Omit<PageState, 'limit' | 'offset'> & { total: number };

export function usePageWithTotal(page: Omit<PageState, 'limit' | 'offset'>, total?: number): PageWithTotal | undefined {
  const pageWithTotal = useMemo(() => {
    if (total) {
      return { ...page, total };
    } else {
      return undefined;
    }
  }, [page, total]);
  return pageWithTotal;
}
