import type { GetNovelQuery } from '@bookmarks/gql/graphql';
import { useMemo } from 'react';
import { useI18n } from 'i18n';
import { type CustomColumnDefArray, CustomTable, type CustomTableProps, createCustomColumnHelper } from 'custom-table';
import { format } from 'time';
import ChapterTableAction from './ChapterTableAction';
import ChapterBatchUpdate from './ChapterBatchUpdate';

type Data = NonNullable<NonNullable<GetNovelQuery['getNovel']>['chapters']>[0];

interface ChaptersProps extends Omit<CustomTableProps<Data>, 'options'> {
  chapters: Data[];
  refetch: () => void;
  novelId: number;
}

const columnHelper = createCustomColumnHelper<Data>();

export default function Chapters({ chapters, refetch, novelId, ...props }: ChaptersProps) {
  const t = useI18n();
  const columns = useMemo<CustomColumnDefArray<Data>>(
    () =>
      columnHelper.columns([
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
      ]),
    [t, refetch, chapters, novelId],
  );
  const tableOptions = useMemo(() => ({ columns, data: chapters }), [columns, chapters]);
  return <CustomTable className="h-[600px] flex-none overscroll-none" options={tableOptions} {...props} />;
}
