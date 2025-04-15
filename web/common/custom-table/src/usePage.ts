/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 14:11:06
 * @FilePath: /self-tools/web/common/custom-table/src/usePage.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { useMemo, useState } from 'react';

const INIT_PAGE_INDEX = 1;
const INIT_PAGE_SIZE = 10;
const INIT_PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 50, 100];

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
  initPageIndex = INIT_PAGE_INDEX,
  initPageSize = INIT_PAGE_SIZE,
  pageSizeOptions: initPageSizeOptions = INIT_PAGE_SIZE_OPTIONS,
}: {
  initPageSize?: number;
  initPageIndex?: number;
  pageSizeOptions?: number[];
} = {}): PageState {
  const [pageIndex, setPage] = useState(initPageIndex);
  const [pageSize, setPageSize] = useState(initPageSize);
  const [pageSizeOptions] = useState(initPageSizeOptions);

  const offset = useMemo(() => (pageIndex - 1) * pageSize, [pageIndex, pageSize]);
  const limit = useMemo(() => pageSize, [pageSize]);
  return useMemo(
    () => ({ pageIndex, setPage, offset, limit, pageSize, setPageSize, pageSizeOptions }),
    [limit, offset, pageIndex, pageSize, pageSizeOptions],
  );
}

/** 表格需要的 page 数据 */
export type PageWithTotal = Omit<PageState, 'limit' | 'offset'> & { total: number };

export function usePageWithTotal(page: Omit<PageState, 'limit' | 'offset'>, total?: number): PageWithTotal | undefined {
  const pageWithTotal = useMemo(() => {
    if (total) {
      return { ...page, total };
    }
  }, [page, total]);
  return pageWithTotal;
}
