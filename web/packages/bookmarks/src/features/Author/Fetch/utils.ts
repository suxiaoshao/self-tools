/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-28 09:21:57
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 09:47:56
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Fetch/utils.ts
 */
import type { FetchAuthorQuery, SaveChapterInfo, SaveDraftAuthor, SaveTagInfo } from '@bookmarks/gql/graphql';

export function convertFetchToDraftAuthor(fetchAuthor: FetchAuthorQuery['fetchAuthor']): SaveDraftAuthor {
  const site = fetchAuthor?.site;
  return {
    description: fetchAuthor?.description,
    name: fetchAuthor?.name,
    id: fetchAuthor?.id,
    image: fetchAuthor?.image,
    novels: fetchAuthor?.novels?.map((novel) => ({
      chapters: novel.chapters?.map<SaveChapterInfo>((chapter) => ({
        id: chapter.id,
        name: chapter.title,
        time: chapter.time,
        wordCount: chapter.wordCount,
      })),
      id: novel.id,
      name: novel.name,
      site,
      description: novel.description,
      image: novel.image,
      novelStatus: novel.status,
      tags: novel.tags?.map<SaveTagInfo>(({ id, name }) => ({ id, name })),
    })),
    site,
  };
}
