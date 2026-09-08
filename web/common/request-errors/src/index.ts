import * as v from 'valibot';

const requestId = v.pipe(v.string(), v.regex(/^(?!0{32}$)[0-9a-f]{32}$/));
const integer = v.pipe(v.number(), v.safeInteger());
const nonnegative = v.pipe(integer, v.minValue(0));
const fieldViolation = v.object({
  path: v.pipe(v.array(v.pipe(v.string(), v.nonEmpty())), v.nonEmpty()),
  code: v.picklist(['REQUIRED', 'INVALID_FORMAT', 'TOO_LONG', 'OUT_OF_RANGE']),
  min: v.optional(integer),
  max: v.optional(integer),
});
const resource = v.object({
  kind: v.picklist(['COLLECTION', 'ITEM', 'AUTHOR', 'TAG', 'NOVEL', 'CHAPTER', 'COMMENT', 'PASSKEY']),
  id: v.pipe(
    v.string(),
    v.regex(/^(?:[0-9]+|[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/),
  ),
});
const publicError = v.union([
  v.object({
    requestId,
    code: v.literal('INVALID_REQUEST'),
    fieldErrors: v.optional(v.pipe(v.array(fieldViolation), v.nonEmpty())),
  }),
  v.object({ requestId, code: v.literal('NOT_FOUND'), resources: v.optional(v.pipe(v.array(resource), v.nonEmpty())) }),
  v.object({ requestId, code: v.literal('RATE_LIMITED'), retryAfterSeconds: nonnegative }),
  v.object({
    requestId,
    code: v.picklist([
      'UNAUTHENTICATED',
      'REQUEST_REJECTED',
      'REAUTH_REQUIRED',
      'AUTHENTICATION_FAILED',
      'CEREMONY_INVALID',
      'NO_PASSKEY',
      'PASSKEY_EXISTS',
      'INTERNAL',
      'UNAVAILABLE',
      'UPSTREAM_TIMEOUT',
      'UPSTREAM_FAILURE',
    ]),
  }),
]);

export type FieldViolation = v.InferOutput<typeof fieldViolation>;
export type PublicError = v.InferOutput<typeof publicError>;
export type RequestFailure =
  | { kind: 'public'; error: PublicError }
  | { kind: 'network' | 'timeout' | 'protocol'; requestId?: string }
  | { kind: 'cancelled' };
export type WriteState =
  | { kind: 'idle' | 'pending' | 'succeeded' | 'rejected' }
  | { kind: 'unconfirmed'; failure: RequestFailure };

/** Holds only the normalized, safe projection; never a server message or response body. */
export class RequestError extends Error {
  constructor(public readonly failure: RequestFailure) {
    super(failure.kind === 'public' ? failure.error.code : failure.kind);
    this.name = 'RequestError';
  }
}

export function decodePublicError(value: unknown): PublicError | undefined {
  if (typeof value !== 'object' || value === null) return undefined;
  if ('fieldErrors' in value && (!('code' in value) || value.code !== 'INVALID_REQUEST')) return undefined;
  if ('resources' in value && (!('code' in value) || value.code !== 'NOT_FOUND')) return undefined;
  if ('retryAfterSeconds' in value && (!('code' in value) || value.code !== 'RATE_LIMITED')) return undefined;
  const result = v.safeParse(publicError, value);
  return result.success ? result.output : undefined;
}

export function decodeRequestId(value: unknown): string | undefined {
  const result = v.safeParse(requestId, value);
  return result.success ? result.output : undefined;
}

export function normalizeRequestFailure(error: unknown): RequestFailure {
  if (error instanceof RequestError) return error.failure;
  if (error instanceof DOMException && error.name === 'AbortError') return { kind: 'cancelled' };
  if (error instanceof DOMException && error.name === 'TimeoutError') return { kind: 'timeout' };
  return { kind: 'protocol' };
}

/** Call only around fetch itself: arbitrary application TypeErrors are not network failures. */
export function fetchFailure(error: unknown, signal?: AbortSignal): RequestError {
  const failure = normalizeRequestFailure(error);
  if (signal?.aborted) {
    return new RequestError(
      signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError'
        ? { kind: 'timeout' }
        : { kind: 'cancelled' },
    );
  }
  return new RequestError(failure.kind === 'protocol' ? { kind: 'network' } : failure);
}

export function isUnauthenticated(error: unknown): boolean {
  const failure = normalizeRequestFailure(error);
  return failure.kind === 'public' && failure.error.code === 'UNAUTHENTICATED';
}

export function isUnconfirmed(error: unknown): boolean {
  const failure = normalizeRequestFailure(error);
  if (failure.kind !== 'public') return true;
  return ['INTERNAL', 'UNAVAILABLE', 'UPSTREAM_TIMEOUT', 'UPSTREAM_FAILURE'].includes(failure.error.code);
}

export function publicHttpStatus(code: PublicError['code']): number {
  switch (code) {
    case 'INVALID_REQUEST':
    case 'CEREMONY_INVALID':
      return 400;
    case 'UNAUTHENTICATED':
    case 'AUTHENTICATION_FAILED':
      return 401;
    case 'REQUEST_REJECTED':
    case 'REAUTH_REQUIRED':
      return 403;
    case 'NOT_FOUND':
      return 404;
    case 'NO_PASSKEY':
    case 'PASSKEY_EXISTS':
      return 409;
    case 'RATE_LIMITED':
      return 429;
    case 'INTERNAL':
      return 500;
    case 'UNAVAILABLE':
      return 503;
    case 'UPSTREAM_TIMEOUT':
      return 504;
    case 'UPSTREAM_FAILURE':
      return 502;
  }
}
