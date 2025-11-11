import type { GetNovelQuery } from '@bookmarks/gql/graphql';
import { useMemo } from 'react';
import { useI18n } from 'i18n';
import {
  type CustomColumnDefArray,
  CustomTable,
  type CustomTableProps,
  createCustomColumnHelper,
  getCoreRowModel,
  useCustomTable,
} from 'custom-table';
import { format } from 'time';
import ChapterTableAction from './ChapterTableAction';
import ChapterBatchUpdate from './ChapterBatchUpdate';

type Data = GetNovelQuery['getNovel']['chapters'][0];

export interface ChaptersProps extends Omit<CustomTableProps<Data>, 'tableInstance'> {
  chapters: Data[];
  refetch: () => void;
  novelId: number;
}

const columnHelper = createCustomColumnHelper<Data>();

export default function Chapters({ chapters, refetch, novelId, ...props }: ChaptersProps) {
  const t = useI18n();
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () =>
      [
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
        columnHelper.accessor(
          ({ isRead, id }) => <ChapterTableAction isRead={isRead} chapterId={id} novelId={novelId} refetch={refetch} />,

          {
            header: () => <ChapterBatchUpdate chapters={chapters} novelId={novelId} refetch={refetch} />,
            id: 'isRead',
            cell: (context) => context.getValue(),
          },
        ),
      ] as CustomColumnDefArray<Data>,
    [t, refetch, chapters, novelId],
  );
  const tableInstance = useCustomTable(
    useMemo(() => ({ columns, data: chapters, getCoreRowModel: getCoreRowModel() }), [columns, chapters]),
  );
  return <CustomTable className="h-[600px] flex-none overscroll-none" tableInstance={tableInstance} {...props} />;
}
