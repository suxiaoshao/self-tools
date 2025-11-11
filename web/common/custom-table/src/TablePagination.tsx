import { Button } from '@portal/components/ui/button';
import { Label } from '@portal/components/ui/label';
import { CheckIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import type { PageWithTotal } from './usePage';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@portal/components/ui/select';
import { useI18n } from 'i18n';
import { Popover, PopoverContent, PopoverTrigger } from '@portal/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@portal/components/ui/command';
import useDialog from '@collections/hooks/useDialog';
import { match } from 'ts-pattern';

export default function TablePagination({
  pageIndex,
  pageSize,
  setPageSize,
  total,
  pageSizeOptions,
  setPage,
}: PageWithTotal) {
  const { open, handleOpenChange, handleClose } = useDialog();
  const t = useI18n();
  const pageCount = Math.ceil(total / pageSize);
  return (
    <div className="flex items-center justify-between px-4">
      <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
        {t('table_pagination_total', { total, pageCount })}
      </div>
      <div className="flex w-full items-center gap-8 lg:w-fit">
        <div className="hidden items-center gap-2 lg:flex">
          <Label htmlFor="rows-per-page" className="text-sm font-medium">
            {t('table_pagination_row_per_page')}
          </Label>
          <Select
            value={`${pageSize}`}
            onValueChange={(value) => {
              setPageSize(Number(value));
            }}
          >
            <SelectTrigger size="sm" className="w-20" id="rows-per-page">
              <SelectValue placeholder={pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {(pageSizeOptions ?? [10, 20, 30, 40, 50]).map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-fit items-center justify-center text-sm font-medium gap-2">
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              {/* oxlint-disable-next-line role-has-required-aria-props */}
              <Button variant="outline" className="h-8 px-3" role="combobox">
                {pageIndex}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[150px] p-0">
              <Command>
                <CommandInput placeholder={t('search_page')} />
                <CommandList>
                  <CommandEmpty>{t('no_page_found')}</CommandEmpty>
                  <CommandGroup>
                    {Array.from({ length: pageCount }, (_, i) => i + 1).map((page) => (
                      <CommandItem
                        key={page}
                        value={String(page)}
                        onSelect={(currentValue) => {
                          if (!(currentValue === String(pageIndex))) {
                            setPage(Number(currentValue));
                          }
                          handleClose();
                        }}
                      >
                        <CheckIcon
                          visibility={match(page)
                            .with(pageIndex, () => 'visible')
                            .otherwise(() => 'hidden')}
                          className="mr-2 h-4 w-4"
                        />
                        {page}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
