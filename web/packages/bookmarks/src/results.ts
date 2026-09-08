import { protocolFailure, saved, type WriteOutcome } from 'custom-graphql';
import type * as G from './gql/graphql';
type Result =
  | G.CreateCollectionMutation['createCollection']
  | G.CreateAuthorMutation['createAuthor']
  | G.CreateNovelMutation['createNovel']
  | G.CreateTagMutation['createTag']
  | G.DeleteNovelMutation['deleteNovel']
  | G.CreateCommentMutation['addCommentForNovel']
  | G.AddCollectionForNovelMutation['addCollectionForNovel']
  | G.AddReadRecordMutation['addReadRecordsForChapter'];
/** Project generated operation results; unknown/missing payloads never imply success. */
export function writeResult(result: Result | null | undefined): WriteOutcome {
  if (!result) return protocolFailure();
  switch (result.__typename) {
    case 'CollectionSaved':
      return saved(result.collectionId);
    case 'AuthorSaved':
      return saved(result.authorId);
    case 'NovelSaved':
    case 'CommentSaved':
      return saved(result.novelId);
    case 'TagSaved':
      return saved(result.tagId);
    case 'ResourceDeleted':
      return saved(result.resource.id);
    case 'CollectionMembershipChanged':
      return result.collectionId > 0 ? saved(result.resource.id) : protocolFailure();
    case 'ReadRecordsUpdated':
      return Number.isSafeInteger(result.changedCount) &&
        result.changedCount >= 0 &&
        result.changedCount <= result.chapterIds.length &&
        result.chapterIds.every((id) => Number.isSafeInteger(id) && id > 0)
        ? saved()
        : protocolFailure();
    case 'ValidationFailure':
      return result.issues.length
        ? {
            status: 'rejected',
            rejection: {
              kind: 'validation',
              issues: result.issues.map((issue) => ({
                ...issue,
                min: issue.min ?? undefined,
                max: issue.max ?? undefined,
              })),
            },
          }
        : protocolFailure();
    case 'MissingResources':
      return result.resources.length
        ? { status: 'rejected', rejection: { kind: 'missing', resources: result.resources } }
        : protocolFailure();
    case 'Conflict':
      switch (result.reason) {
        case 'COLLECTION_PATH_EXISTS':
        case 'SOURCE_ID_EXISTS':
        case 'MEMBERSHIP_EXISTS':
        case 'COMMENT_EXISTS':
          return { status: 'rejected', rejection: { kind: 'conflict', reason: result.reason } };
        default: {
          const exhaustive: never = result.reason;
          void exhaustive;
          return protocolFailure();
        }
      }
    case 'ChaptersAlreadyRead':
      return result.chapterIds.length
        ? { status: 'rejected', rejection: { kind: 'alreadyRead', chapterIds: result.chapterIds } }
        : protocolFailure();
    default: {
      const exhaustive: never = result;
      void exhaustive;
      return protocolFailure();
    }
  }
}
