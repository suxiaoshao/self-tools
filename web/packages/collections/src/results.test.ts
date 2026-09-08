import { describe, expect, it } from 'vitest';
import { itemResult, collectionResult, deleteResult, membershipResult } from './results';
import { attemptWrite } from 'custom-graphql';
import { RequestError } from 'request-errors';

describe('collections mutation contracts', () => {
  it('accepts only committed success identifiers and the expected membership state', () => {
    expect(itemResult({ __typename: 'ItemSaved', itemId: 8 }).status).toBe('saved');
    expect(itemResult({ __typename: 'ItemSaved', itemId: undefined as unknown as number }).status).toBe('failed');
    expect(itemResult(undefined).status).toBe('failed');
    expect(
      membershipResult(
        {
          __typename: 'CollectionMembershipChanged',
          collectionId: 2,
          resource: { kind: 'ITEM', id: 8 },
          present: false,
        },
        true,
      ).status,
    ).toBe('failed');
    expect(deleteResult({ __typename: 'ResourceDeleted', resource: { kind: 'ITEM', id: 8 } }).status).toBe('saved');
  });
  it('keeps typed rejections on the normal result path', async () => {
    const result = await attemptWrite(
      async () => ({
        __typename: 'ValidationFailure' as const,
        issues: [{ path: ['name'], code: 'INVALID_FORMAT' as const, min: null, max: null }],
      }),
      collectionResult,
    );
    expect(result.status).toBe('rejected');
    expect(collectionResult({ __typename: 'Conflict', reason: 'COLLECTION_PATH_EXISTS', resources: [] }).status).toBe(
      'rejected',
    );
  });
  it('lost responses remain unconfirmed and do not replay', async () => {
    let requests = 0;
    const outcome = await attemptWrite(async () => {
      requests++;
      throw new RequestError({ kind: 'timeout' });
    }, itemResult);
    expect(outcome).toEqual({ status: 'failed', failure: { kind: 'timeout' }, unconfirmed: true });
    expect(requests).toBe(1);
  });
});
