/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-03-28 09:21:57
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-28 09:47:56
 * @FilePath: /self-tools/web/packages/bookmarks/src/features/Author/Fetch/utils.ts
 */
import { FetchAuthorQuery, NovelSite, SaveChapterInfo, SaveDraftAuthor } from '@bookmarks/graphql';

export function convertFetchToDraftAuthor(fetchAuthor: FetchAuthorQuery['fetchAuthor']): SaveDraftAuthor {
  const site = convertFetchToDraftSite(fetchAuthor?.__typename);
  return {
    description: fetchAuthor?.description,
    name: fetchAuthor?.name,
    id: fetchAuthor?.id,
    image: fetchAuthor?.image,
    novels: fetchAuthor?.novels?.map((novel) => ({
      chapters: novel.chapters?.map<SaveChapterInfo>((chapter) => ({
        id: chapter.id,
        name: chapter.title,
        url: chapter.url,
        novelId: novel.id,
        time: chapter.time,
        wordCount: chapter.wordCount,
      })),
      id: novel.id,
      name: novel.name,
      site,
      description: novel.description,
      image: novel.image,
      novelStatus: novel.status,
      url: novel.url,
    })),
    site,
    url: fetchAuthor?.url,
  };
}

function convertFetchToDraftSite(fetchAuthor: FetchAuthorQuery['fetchAuthor']['__typename']): NovelSite {
  switch (fetchAuthor) {
    case 'JjAuthor':
      return NovelSite.Jjwxc;
    case 'QdAuthor':
      return NovelSite.Qidian;
  }
}
