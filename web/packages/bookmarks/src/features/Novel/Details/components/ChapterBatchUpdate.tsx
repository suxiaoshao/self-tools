import useBookmarkWrite from '@bookmarks/useBookmarkWrite';
import { checkNovelState } from '@bookmarks/reconcile';
import { useMutation, useApolloClient } from '@apollo/client/react';
import type { GetNovelQuery } from '@bookmarks/gql/graphql';
import useDialog from '@collections/hooks/useDialog';
import { Edit } from 'lucide-react';
import { useI18n } from 'i18n';
import { useCallback, useState } from 'react';
import { format } from 'time';
import { match } from 'ts-pattern';
import { AddReadRecord, DeleteReadRecord } from './ChapterTableAction';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@portal/components/ui/dialog';
import { Button } from '@portal/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@portal/components/ui/tooltip';
import { Label } from '@portal/components/ui/label';
import { Checkbox } from '@portal/components/ui/checkbox';

type Data = NonNullable<NonNullable<GetNovelQuery['getNovel']>['chapters']>[0];

interface ChapterBatchUpdateProps {
  chapters: Data[];
  novelId: number;
  refetch: () => void;
}

export default function ChapterBatchUpdate({ chapters, novelId, refetch }: ChapterBatchUpdateProps) {
  const t = useI18n();
  const client = useApolloClient();
  const addWrite = useBookmarkWrite(`/bookmarks/novel/${novelId}`);
  const deleteWrite = useBookmarkWrite(`/bookmarks/novel/${novelId}`);
  const [appliedRead, setAppliedRead] = useState(() => new Set(chapters.filter((c) => c.isRead).map((c) => c.id)));
  const blocked = addWrite.blocked || deleteWrite.blocked;
  const { open, handleClose, handleOpenChange } = useDialog();
  const [checked, setChecked] = useState<number[]>(chapters.filter(({ isRead }) => isRead).map(({ id }) => id));
  const handleToggle = (id: number) => {
    setChecked((prev) =>
      match(prev.includes(id))
        .with(true, () => prev.filter((i) => i !== id))
        .with(false, () => [...prev, id])
        .exhaustive(),
    );
  };
  const [addReadRecord, { loading: addLoading }] = useMutation(AddReadRecord);
  const [deleteReadRecord, { loading: deleteLoading }] = useMutation(DeleteReadRecord);
  const handleSubmit = async () => {
    if (blocked) return;
    const addArrays = checked.filter((id) => !appliedRead.has(id));
    const deleteArrays = [...appliedRead].filter((id) => !checked.includes(id));
    const markAdded = () => setAppliedRead((prev) => new Set([...prev, ...addArrays]));
    const markDeleted = () => setAppliedRead((prev) => new Set([...prev].filter((id) => !deleteArrays.includes(id))));
    if (addArrays.length) {
      const success = await addWrite.execute(
        async () =>
          (await addReadRecord({ variables: { novelId, chapterIds: addArrays } })).data?.addReadRecordsForChapter,
        { verify: () => checkNovelState(client, novelId, { read: addArrays, unread: [] }), confirmed: markAdded },
      );
      if (!success) return;
      markAdded();
    }
    if (deleteArrays.length) {
      const success = await deleteWrite.execute(
        async () =>
          (await deleteReadRecord({ variables: { chapterIds: deleteArrays } })).data?.deleteReadRecordsForChapter,
        { verify: () => checkNovelState(client, novelId, { read: [], unread: deleteArrays }), confirmed: markDeleted },
      );
      if (!success) return;
      markDeleted();
    }
    handleClose();
    void Promise.resolve()
      .then(() => refetch())
      .catch(() => undefined);
  };
  const handleToggleAll = useCallback(() => {
    setChecked((prev) =>
      match(prev.length === chapters.length)
        .with(true, () => [])
        .with(false, () => chapters.map((chapter) => chapter.id))
        .exhaustive(),
    );
  }, [chapters]);
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next && !blocked) {
          const current = chapters.filter((c) => c.isRead).map((c) => c.id);
          setAppliedRead(new Set(current));
          setChecked(current);
        }
        handleOpenChange(next);
      }}
    >
      {t('is_read')}
      <Tooltip>
        <DialogTrigger render={<Button size="icon" variant="ghost" />}>
          <TooltipTrigger render={<span />}>
            <Edit fontSize="small" />
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent>{t('batch_update')}</TooltipContent>
      </Tooltip>
      <DialogContent className="px-0 sm:max-w-sm">
        <DialogHeader className="px-6">
          <DialogTitle className="gap-3 flex">
            {t('batch_update')}
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <Checkbox
                  checked={checked.length === chapters.length}
                  disabled={blocked}
                  onCheckedChange={handleToggleAll}
                />
              </TooltipTrigger>
              <TooltipContent>
                {match(checked.length === chapters.length)
                  .with(true, () => t('select_none'))
                  .with(false, () => t('select_all'))
                  .exhaustive()}
              </TooltipContent>
            </Tooltip>
          </DialogTitle>
        </DialogHeader>
        <li className="max-h-[70vh] overflow-y-auto">
          {chapters.map((chapter) => (
            <Label
              key={chapter.url}
              className="hover:bg-accent/50 flex items-start gap-3 p-3 has-aria-checked:bg-accent"
            >
              <Checkbox
                disabled={blocked}
                onCheckedChange={() => {
                  handleToggle(chapter.id);
                }}
                checked={checked.includes(chapter.id)}
              />
              <div className="grid gap-1.5 font-normal">
                <p className="text-sm leading-none font-medium">{chapter.title}</p>
                <p className="text-muted-foreground text-sm">
                  {format(chapter.time)} - {chapter.wordCount}
                </p>
              </div>
            </Label>
          ))}
        </li>
        {addWrite.notice}
        {deleteWrite.notice}
        <DialogFooter className="px-6">
          <DialogClose render={<Button variant="secondary" />}>{t('cancel')}</DialogClose>
          <Button onClick={handleSubmit} disabled={blocked || addLoading || deleteLoading}>
            {t('submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
