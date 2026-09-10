import { beforeEach, describe, expect, it, vi } from 'vitest';
import { safeFrom } from './redirect';
import {
  credentialJSON,
  decodeBase64Url,
  passwordReauth,
  passwordLogin,
  passkeyAuthentication,
  registerPasskey,
  UnconfirmedWrite,
} from './service';
import { RequestError } from 'request-errors';
import { useAuthStore } from './authSlice';
vi.mock('custom-graphql', () => ({ clearAuthenticatedState: vi.fn<() => void>() }));
const session = {
  user: { id: 'admin', username: 'admin' },
  idleExpiresAt: '2026-10-01T00:00:00Z',
  absoluteExpiresAt: '2026-12-01T00:00:00Z',
  recentAuthenticationUntil: '2026-09-08T00:05:00Z',
};
beforeEach(() => {
  vi.unstubAllGlobals();
  useAuthStore.setState({ status: 'checking', session: null, generation: 0 });
});
describe('session identity boundary', () => {
  it('ignores an old 401 after a new login and coalesces repeated invalidation', () => {
    useAuthStore.getState().accept(session, 0);
    useAuthStore.getState().invalidate(0);
    expect(useAuthStore.getState().status).toBe('authenticated');
    useAuthStore.getState().invalidate(1);
    const generation = useAuthStore.getState().generation;
    useAuthStore.getState().invalidate(1);
    expect(useAuthStore.getState().generation).toBe(generation);
    expect(useAuthStore.getState().status).toBe('anonymous');
  });
  it('clears legacy credentials and keeps service failure distinct from anonymous', async () => {
    localStorage.setItem('auth', 'legacy-jwt');
    vi.stubGlobal(
      'fetch',
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response(JSON.stringify({ error: { code: 'UNAVAILABLE', requestId: 'a'.repeat(32) } }), { status: 503 }),
        ),
    );
    await useAuthStore.getState().initialize(new AbortController().signal);
    expect(localStorage.getItem('auth')).toBeNull();
    expect(useAuthStore.getState().status).toBe('unavailable');
  });
  it('does not let a late initialization replace a newer login', async () => {
    let resolve!: (value: Response) => void;
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            resolve = r;
          }),
      ),
    );
    const pending = useAuthStore.getState().initialize(new AbortController().signal);
    useAuthStore.getState().accept(session, 1);
    resolve(new Response(JSON.stringify({ data: null })));
    await pending;
    expect(useAuthStore.getState().status).toBe('authenticated');
  });
});
it('accepts only safe local return paths', () => {
  for (const path of [
    'https://evil.test',
    '//evil.test',
    '/\\evil.test',
    '/login',
    '/login?from=/',
    '/LOGIN',
    '/%6cogin',
    '/login/again',
    '/\n/evil.test',
  ])
    expect(safeFrom(path)).toBe('/');
  expect(safeFrom('/bookmarks/novels?page=2#item')).toBe('/bookmarks/novels?page=2#item');
});
it('sends same-origin JSON and keeps server failure codes', async () => {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
    new Response(JSON.stringify({ error: { code: 'AUTHENTICATION_FAILED', requestId: 'a'.repeat(32) } }), {
      status: 401,
    }),
  );
  vi.stubGlobal('fetch', fetchMock);
  await expect(passwordReauth('test-only', new AbortController().signal)).rejects.toEqual(
    new RequestError({ kind: 'public', error: { code: 'AUTHENTICATION_FAILED', requestId: 'a'.repeat(32) } }),
  );
  expect(fetchMock).toHaveBeenCalledWith(
    '/api/auth/reauth/password',
    expect.objectContaining({
      credentials: 'same-origin',
      headers: { 'X-Self-Tools-Request': '1', 'Content-Type': 'application/json' },
    }),
  );
});
it('serializes all assertion bytes and only one extension field', () => {
  class Assertion {
    clientDataJSON = Uint8Array.from([0, 255]).buffer;
    authenticatorData = Uint8Array.from([1, 2]).buffer;
    signature = Uint8Array.from([3, 4]).buffer;
    userHandle = null;
  }
  vi.stubGlobal('AuthenticatorAssertionResponse', Assertion);
  vi.stubGlobal('AuthenticatorAttestationResponse', class Attestation {});
  const json = credentialJSON({
    id: 'credential',
    rawId: Uint8Array.from([255, 254]).buffer,
    type: 'public-key',
    response: new Assertion(),
    authenticatorAttachment: 'platform',
    getClientExtensionResults: () => ({ appid: false }),
  } as unknown as PublicKeyCredential);
  expect(json).toMatchObject({
    rawId: '__4',
    clientExtensionResults: { appid: false },
    response: { clientDataJSON: 'AP8', authenticatorData: 'AQI', signature: 'AwQ', userHandle: null },
  });
  expect(json).not.toHaveProperty('extensions');
  expect(Array.from(decodeBase64Url('__4'))).toEqual([255, 254]);
});

it.each(['login', 'register'] as const)(
  'uses native WebAuthn JSON conversion for %s while preserving the ceremony and cancellation signal',
  async (purpose) => {
    const publicKey =
      purpose === 'login'
        ? { challenge: 'AQI', allowCredentials: [{ id: 'AwQ', type: 'public-key' }] }
        : {
            challenge: 'AQI',
            rp: { name: 'Self Tools' },
            user: { id: 'AwQ', name: 'admin', displayName: 'Admin' },
            pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          };
    const parsed = { challenge: new Uint8Array([1, 2]) };
    const nativeJSON = {
      id: 'credential',
      type: 'public-key',
      rawId: 'AwQ',
      response: { clientDataJSON: 'AQI' },
      clientExtensionResults: {},
    };
    class NativeCredential {
      static parseRequestOptionsFromJSON = vi.fn<(value: unknown) => typeof parsed>(() => parsed);
      static parseCreationOptionsFromJSON = vi.fn<(value: unknown) => typeof parsed>(() => parsed);
      toJSON() {
        return nativeJSON;
      }
    }
    vi.stubGlobal('PublicKeyCredential', NativeCredential);
    const get = vi.fn<(options: unknown) => Promise<NativeCredential>>().mockResolvedValue(new NativeCredential());
    const create = vi.fn<(options: unknown) => Promise<NativeCredential>>().mockResolvedValue(new NativeCredential());
    vi.stubGlobal('navigator', { credentials: { get, create } });
    const passkey = {
      id: 'b5968c77-731a-4b4e-bdd5-80b253c2d9f5',
      name: 'Laptop',
      createdAt: '2026-09-10T00:00:00Z',
      lastUsedAt: null,
    };
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { ceremonyId: 'BQY', publicKey } })))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: purpose === 'login' ? session : passkey })));
    vi.stubGlobal('fetch', fetchMock);
    const signal = new AbortController().signal;
    const result = purpose === 'login' ? passkeyAuthentication('login', signal) : registerPasskey('Laptop', signal);
    const parse =
      purpose === 'login'
        ? NativeCredential.parseRequestOptionsFromJSON
        : NativeCredential.parseCreationOptionsFromJSON;
    await expect(result).resolves.toEqual(purpose === 'login' ? session : passkey);
    expect(parse).toHaveBeenCalledExactlyOnceWith(publicKey);
    expect(purpose === 'login' ? get : create).toHaveBeenCalledExactlyOnceWith({ signal, publicKey: parsed });
    expect(JSON.parse(fetchMock.mock.calls[1][1]?.body as string)).toEqual({
      ceremonyId: 'BQY',
      credential: nativeJSON,
    });
  },
);

it('rejects malformed success data and preserves an unconfirmed login after failed reconciliation', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: { user: 'malformed' } })))
    .mockRejectedValueOnce(new TypeError('private network detail'));
  vi.stubGlobal('fetch', fetchMock);
  await expect(passwordLogin('admin', 'secret', new AbortController().signal)).rejects.toBeInstanceOf(UnconfirmedWrite);
  expect(fetchMock).toHaveBeenCalledTimes(2);
  expect(fetchMock.mock.calls[1][0]).toBe('/api/auth/session');
});
it('confirms a lost login response by reading the session without replaying the password', async () => {
  const fetchMock = vi
    .fn<typeof fetch>()
    .mockRejectedValueOnce(new TypeError('network'))
    .mockResolvedValueOnce(new Response(JSON.stringify({ data: session })));
  vi.stubGlobal('fetch', fetchMock);
  await expect(passwordLogin('admin', 'secret', new AbortController().signal)).resolves.toEqual(session);
  expect(fetchMock).toHaveBeenCalledTimes(2);
});
