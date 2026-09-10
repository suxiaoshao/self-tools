import { Button } from 'ui/components/button';
import { Label } from 'ui/components/label';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useId } from 'react';
import type { PageWithTotal } from './usePage';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from 'ui/components/select';
import { useI18n } from 'i18n';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from 'ui/components/combobox';

export default function TablePagination({
  pageIndex,
  pageSize,
  setPageSize,
  total,
  pageSizeOptions,
  setPage,
}: PageWithTotal) {
  const t = useI18n();
  const pageCount = Math.ceil(total / pageSize);
  const pageSizeId = useId();
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);
  return (
    <div className="flex items-center justify-between px-4">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {t('table_pagination_total', { total, pageCount })}
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor={pageSizeId} className="text-sm font-medium">
            {t('table_pagination_row_per_page')}
          </Label>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              setPageSize(Number(value));
            }}
          >
            <SelectTrigger size="sm" className="w-20" id={pageSizeId}>
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              <SelectGroup>
                {(pageSizeOptions ?? [10, 20, 30, 40, 50]).map((pageSize) => (
                  <SelectItem key={pageSize} value={`${pageSize}`}>
                    {pageSize}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium gap-2">
          <Combobox
            items={pages}
            value={pageIndex}
            itemToStringLabel={String}
            onValueChange={(value) => {
              if (value !== null && value !== pageIndex) setPage(value);
            }}
          >
            <ComboboxInput aria-label={t('search_page')} className="w-24" />
            <ComboboxContent>
              <ComboboxEmpty>{t('no_page_found')}</ComboboxEmpty>
              <ComboboxList>
                {(page) => (
                  <ComboboxItem key={page} value={page}>
                    {page}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
          {t('table_pagination_page', { pageCount })}
        </div>
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <Button
            variant="outline"
            className="hidden h-8 w-8 p-0 lg:flex"
            onClick={() => setPage(1)}
            disabled={pageIndex === 1}
          >
            <span className="sr-only">{t('go_to_first_page')}</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => setPage(pageIndex - 1)}
            disabled={pageIndex === 1}
          >
            <span className="sr-only">{t('go_to_previous_page')}</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            className="size-8"
            size="icon"
            onClick={() => setPage(pageIndex + 1)}
            disabled={pageIndex === pageCount}
          >
            <span className="sr-only">{t('go_to_next_page')}</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            className="hidden size-8 lg:flex"
            size="icon"
            onClick={() => setPage(pageCount)}
            disabled={pageIndex === pageCount}
          >
            <span className="sr-only">{t('go_to_last_page')}</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
