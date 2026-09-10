import { useI18n } from 'i18n';
import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { checkNovelState } from '@bookmarks/features/novel/model/reconcile';
import {
  AddReadRecordDocument as AddReadRecord,
  DeleteReadRecordDocument as DeleteReadRecord,
} from '@bookmarks/gql/graphql';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { Switch } from 'ui/components/switch';

export { AddReadRecord };

export { DeleteReadRecord };

interface ChapterTableActionProps {
  isRead: boolean;
  novelId: number;
  chapterId: number;
  refetch: () => void;
}

export default function ChapterTableAction({ isRead, novelId, chapterId, refetch }: ChapterTableActionProps) {
  const t = useI18n();
  const [addReadRecord] = useMutation(AddReadRecord);
  const [deleteReadRecord] = useMutation(DeleteReadRecord);
  const write = useBookmarkWrite(`/bookmarks/novel/${novelId}`);
  const client = useApolloClient();
  const handleToggle = async (checked: boolean) => {
    const recover = {
      verify: () =>
        checkNovelState(client, novelId, { read: checked ? [chapterId] : [], unread: checked ? [] : [chapterId] }),
      confirmed: refetch,
    };
    const success = checked
      ? await write.execute(
          async () =>
            (await addReadRecord({ variables: { novelId, chapterIds: [chapterId] } })).data?.addReadRecordsForChapter,
          recover,
        )
      : await write.execute(
          async () =>
            (await deleteReadRecord({ variables: { chapterIds: [chapterId] } })).data?.deleteReadRecordsForChapter,
          recover,
        );
    if (success)
      void Promise.resolve()
        .then(() => refetch())
        .catch(() => undefined);
  };
  return (
    <div>
      <Switch
        aria-label={t('mark_read', { id: chapterId })}
        checked={isRead}
        onCheckedChange={handleToggle}
        disabled={write.blocked}
      />
      {write.notice}
    </div>
  );
}
