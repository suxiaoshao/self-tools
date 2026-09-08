import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { checkNovelState } from '@bookmarks/reconcile';
import { graphql } from '@bookmarks/gql';
import { useMutation, useApolloClient } from '@apollo/client/react';
import { Switch } from '@portal/components/ui/switch';

export const AddReadRecord = graphql(`
  mutation addReadRecord($novelId: Int!, $chapterIds: [Int!]!) {
    addReadRecordsForChapter(novelId: $novelId, chapterIds: $chapterIds) {
      __typename
      ... on ReadRecordsUpdated {
        chapterIds
        changedCount
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
      ... on MissingResources {
        resources {
          kind
          id
        }
      }
      ... on ChaptersAlreadyRead {
        chapterIds
      }
    }
  }
`);

export const DeleteReadRecord = graphql(`
  mutation deleteReadRecord($chapterIds: [Int!]!) {
    deleteReadRecordsForChapter(chapterIds: $chapterIds) {
      __typename
      ... on ReadRecordsUpdated {
        chapterIds
        changedCount
      }
      ... on ValidationFailure {
        issues {
          path
          code
          min
          max
        }
      }
    }
  }
`);

interface ChapterTableActionProps {
  isRead: boolean;
  novelId: number;
  chapterId: number;
  refetch: () => void;
}

export default function ChapterTableAction({ isRead, novelId, chapterId, refetch }: ChapterTableActionProps) {
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
      <Switch checked={isRead} onCheckedChange={handleToggle} disabled={write.blocked} />
      {write.notice}
    </div>
  );
}
