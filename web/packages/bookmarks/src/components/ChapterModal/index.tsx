/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-05 23:57:14
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-31 11:42:00
 * @FilePath: /self-tools/web/packages/bookmarks/src/components/ChapterModal/index.tsx
 */
import type { FetchAuthorQuery } from '@bookmarks/gql/graphql';
import { useI18n } from 'i18n';
import { TableOfContents } from 'lucide-react';
import { format } from 'time';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@portal/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@portal/components/ui/tooltip';
import { Button } from '@portal/components/ui/button';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@portal/components/ui/item';

export interface ChapterModalProps {
  chapters: FetchAuthorQuery['fetchAuthor']['novels'][0]['chapters'];
}

export default function ChapterModal({ chapters }: ChapterModalProps) {
  const t = useI18n();
  return (
    <Dialog>
      <Tooltip>
        <DialogTrigger render={<Button type="button" variant="ghost" size="icon" />}>
          <TooltipTrigger render={<span />}>
            <TableOfContents />
          </TooltipTrigger>
        </DialogTrigger>
        <TooltipContent>{t('view_novel_chapters')}</TooltipContent>
      </Tooltip>
      <DialogContent className="px-0 pb-0 sm:max-w-sm">
        <DialogHeader className="px-6">
          <DialogTitle>{t('novel_chapters')}</DialogTitle>
        </DialogHeader>
        <li className="max-h-[70vh] overflow-y-auto">
          {chapters.map((chapter) => (
            <Item size="sm" key={chapter.url}>
              <ItemContent>
                <ItemTitle>{chapter.title}</ItemTitle>
                <ItemDescription>{format(chapter.time)}</ItemDescription>
              </ItemContent>
              <ItemContent className="flex-none text-center">
                <ItemDescription>{chapter.wordCount}</ItemDescription>
              </ItemContent>
            </Item>
          ))}
        </li>
      </DialogContent>
    </Dialog>
  );
}
