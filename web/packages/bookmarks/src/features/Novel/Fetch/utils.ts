import type { FetchNovelQuery, SaveChapterInfo, SaveDraftNovel, SaveTagInfo } from '@bookmarks/graphql';

export function convertFetchToDraftNovel(fetchNovel: FetchNovelQuery['fetchNovel']): SaveDraftNovel {
  const site = fetchNovel.site;
  return {
    author: {
      description: fetchNovel.author.description,
      id: fetchNovel.author.id,
      image: fetchNovel.author.image,
      name: fetchNovel.author.name,
      site: site,
    },
    chapters: fetchNovel.chapters?.map<SaveChapterInfo>((chapter) => ({
      id: chapter.id,
      name: chapter.title,
      time: chapter.time,
      wordCount: chapter.wordCount,
    })),
    description: fetchNovel.description,
    id: fetchNovel.id,
    image: fetchNovel.image,
    name: fetchNovel.name,
    novelStatus: fetchNovel.status,
    site: site,
    tags: fetchNovel.tags?.map<SaveTagInfo>(({ id, name }) => ({ id, name })),
  };
}
