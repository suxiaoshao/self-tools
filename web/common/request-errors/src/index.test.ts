import { describe, expect, it } from 'vitest';
import { decodePublicError, fetchFailure, isUnauthenticated, RequestError } from './index';

const requestId = '1234567890abcdef1234567890abcdef';
describe('public error boundary', () => {
  it('discards arbitrary messages and diagnostics, and rejects unknown or malformed contracts', () => {
    expect(
      decodePublicError({ code: 'UNAVAILABLE', requestId, message: 'secret', source: { password: 'secret' } }),
    ).toEqual({ code: 'UNAVAILABLE', requestId });
    expect(decodePublicError({ code: 'FUTURE_CODE', requestId })).toBeUndefined();
    expect(decodePublicError({ code: 'UNAUTHENTICATED', requestId: '0'.repeat(32) })).toBeUndefined();
    expect(decodePublicError({ code: 'RATE_LIMITED', requestId, retryAfterSeconds: -1 })).toBeUndefined();
    expect(
      decodePublicError({ code: 'INVALID_REQUEST', requestId, fieldErrors: [{ path: [], code: 'REQUIRED' }] }),
    ).toBeUndefined();
  });
  it('does not confuse credential rejection or network failure with session invalidation', () => {
    expect(
      isUnauthenticated(new RequestError({ kind: 'public', error: { code: 'AUTHENTICATION_FAILED', requestId } })),
    ).toBe(false);
    expect(isUnauthenticated(new RequestError({ kind: 'public', error: { code: 'UNAUTHENTICATED', requestId } }))).toBe(
      true,
    );
    expect(fetchFailure(new TypeError('private URL')).failure).toEqual({ kind: 'network' });
    const controller = new AbortController();
    controller.abort();
    expect(fetchFailure(new Error('private reason'), controller.signal).failure).toEqual({ kind: 'cancelled' });
  });
});
