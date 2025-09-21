import { useOptimistic, useTransition } from 'react';
import { graphql } from '@bookmarks/gql';
import { useMutation } from '@apollo/client/react';
import { Switch } from '@mui/material';

export const AddReadRecord = graphql(`
  mutation addReadRecord($novelId: Int!, $chapterIds: [Int!]!) {
    addReadRecordsForChapter(novelId: $novelId, chapterIds: $chapterIds)
  }
`);

export const DeleteReadRecord = graphql(`
  mutation deleteReadRecord($chapterIds: [Int!]!) {
    deleteReadRecordsForChapter(chapterIds: $chapterIds)
  }
`);

export interface ChapterTableActionProps {
  isRead: boolean;
  novelId: number;
  chapterId: number;
  refetch: () => void;
}

export default function ChapterTableAction({ isRead, novelId, chapterId, refetch }: ChapterTableActionProps) {
  const [addReadRecord] = useMutation(AddReadRecord);
  const [deleteReadRecord] = useMutation(DeleteReadRecord);
  const [optimisticIsRead, setOptimisticIsRead] = useOptimistic(isRead);
  const [isPending, startTransition] = useTransition();
  const handleToggle = (_event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => {
    startTransition(async () => {
      setOptimisticIsRead(checked);
      try {
        if (checked) {
          await addReadRecord({ variables: { novelId, chapterIds: [chapterId] } });
        } else {
          await deleteReadRecord({ variables: { chapterIds: [chapterId] } });
        }
        // oxlint-disable-next-line no-empty empty-brace-spaces
      } catch {
      } finally {
        refetch();
      }
    });
  };
  return <Switch checked={optimisticIsRead} onChange={handleToggle} disabled={isPending} />;
}
