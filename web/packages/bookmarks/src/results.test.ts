import { describe, expect, it } from 'vitest';
import { writeResult } from './results';

describe('bookmarks mutation contracts', () => {
  it('does not treat a fulfilled rejection or missing payload as saved', () => {
    expect(writeResult({ __typename: 'Conflict', reason: 'SOURCE_ID_EXISTS', resources: [] })).toMatchObject({
      status: 'rejected',
    });
    expect(writeResult(undefined)).toMatchObject({ status: 'failed', unconfirmed: true });
    expect(writeResult({ __typename: 'NovelSaved', novelId: 0 })).toMatchObject({ status: 'failed' });
  });
  it('keeps already-read chapter identifiers and accepts an empty acknowledged batch', () => {
    expect(writeResult({ __typename: 'ChaptersAlreadyRead', chapterIds: [4] })).toEqual({
      status: 'rejected',
      rejection: { kind: 'alreadyRead', chapterIds: [4] },
    });
    expect(writeResult({ __typename: 'ReadRecordsUpdated', chapterIds: [], changedCount: 0 })).toMatchObject({
      status: 'saved',
    });
    expect(writeResult({ __typename: 'ReadRecordsUpdated', chapterIds: [4], changedCount: 2 })).toMatchObject({
      status: 'failed',
    });
  });
});
