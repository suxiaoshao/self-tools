import { afterEach, describe, expect, it, vi } from 'vitest';
import { gql } from '@apollo/client';
import { clearAuthenticatedState, getClient, graphQLFailures, registerAuthBoundary } from './index';
const query = gql`
  query Test {
    value
  }
`;
afterEach(() => {
  clearAuthenticatedState();
  vi.unstubAllGlobals();
});
describe('GraphQL authentication and safe failure boundary', () => {
  it('does not invalidate on a bare 401 or credential rejection, but accepts the authenticated error contract', async () => {
    const unauthenticated = vi.fn<(generation: number) => void>();
    const unregister = registerAuthBoundary({ generation: () => 3, unauthenticated });
    const requestId = 'a'.repeat(32);
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('unauthorized', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 'AUTHENTICATION_FAILED', requestId } }), { status: 401 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { code: 'UNAUTHENTICATED', requestId } }), { status: 401 }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const client = getClient('/api/test');
    await client.query({ query });
    await client.query({ query });
    expect(unauthenticated).not.toHaveBeenCalled();
    await client.query({ query });
    expect(unauthenticated).toHaveBeenCalledExactlyOnceWith(3);
    unregister();
  });
  it('keeps partial data and safe error paths without forwarding messages or source payloads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response(
          JSON.stringify({
            data: { value: null },
            errors: [
              {
                message: 'private source',
                path: ['value'],
                extensions: { code: 'INTERNAL', requestId: 'a'.repeat(32), source: 'password=secret' },
              },
            ],
          }),
        ),
      ),
    );
    const result = await getClient('/api/test').query({ query });
    expect(result.data).toEqual({ value: null });
    expect(graphQLFailures(result.error)).toEqual([
      { path: ['value'], failure: { kind: 'public', error: { code: 'INTERNAL', requestId: 'a'.repeat(32) } } },
    ]);
    expect(JSON.stringify(graphQLFailures(result.error))).not.toContain('secret');
  });
});
