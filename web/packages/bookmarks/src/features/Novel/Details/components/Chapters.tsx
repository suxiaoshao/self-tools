import { GetNovelQuery } from '@bookmarks/graphql';
import { useMemo } from 'react';
import { useI18n } from 'i18n';
import {
  CustomColumnDefArray,
  CustomTable,
  CustomTableOptions,
  CustomTableProps,
  createCustomColumnHelper,
  getCoreRowModel,
  useCustomTable,
} from 'custom-table';
import { format } from 'time';

type Data = GetNovelQuery['getNovel']['chapters'][0];

export interface ChaptersProps extends Omit<CustomTableProps<Data>, 'tableInstance'> {
  chapters: Data[];
}

const columnHelper = createCustomColumnHelper<Data>();

export default function Chapters({ chapters, ...props }: ChaptersProps) {
  const t = useI18n();
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () => [
      columnHelper.accessor('title', { header: t('title'), id: 'title', cell: (context) => context.getValue() }),
      columnHelper.accessor('wordCount', {
        header: t('word_count'),
        id: 'wordCount',
        cell: (context) => context.getValue(),
      }),
      columnHelper.accessor(({ time }) => format(time), {
        header: t('time'),
        id: 'time',
        cell: (context) => context.getValue(),
      }),
      columnHelper.accessor(({ createTime }) => format(createTime), {
        header: t('create_time'),
        id: 'createTime',
        cell: (context) => context.getValue(),
      }),
      columnHelper.accessor(({ updateTime }) => format(updateTime), {
        header: t('update_time'),
        id: 'updateTime',
        cell: (context) => context.getValue(),
      }),
    ],
    [t],
  );
  const tableOptions = useMemo<CustomTableOptions<Data>>(
    () => ({ columns, data: chapters, getCoreRowModel: getCoreRowModel() }),
    [columns, chapters],
  );
  const tableInstance = useCustomTable(tableOptions);
  return <CustomTable tableInstance={tableInstance} {...props} />;
}
