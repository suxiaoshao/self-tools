import { describe, expect, it } from 'vitest';
import { collectionResult } from './results';
import { attemptWrite } from 'custom-graphql';
describe('collection mutation contracts', () => {
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
});
