export interface SessionView {
  user: { id: string; username: string };
  idleExpiresAt: string;
  absoluteExpiresAt: string;
  recentAuthenticationUntil: string;
}
export interface PasskeyView {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
}
export class AuthError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
export async function authRequest<T>(
  path: string,
  signal: AbortSignal,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/auth/${path}`, {
      credentials: 'same-origin',
      method,
      signal,
      cache: 'no-store',
      headers: { 'X-Self-Tools-Request': '1', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    if (signal.aborted) throw error;
    throw new AuthError('NETWORK_ERROR');
  }
  if (response.status === 204) return undefined as T;
  const result = await response.json().catch(() => {
    throw new AuthError('NETWORK_ERROR');
  });
  if (!response.ok) throw new AuthError(typeof result.code === 'string' ? result.code : 'AUTH_UNAVAILABLE');
  return result.data as T;
}
export const getSession = (signal: AbortSignal) => authRequest<SessionView | null>('session', signal);
async function loginResult(path: string, body: unknown, signal: AbortSignal): Promise<SessionView> {
  try {
    return await authRequest<SessionView>(path, signal, body);
  } catch (error) {
    // A response may be lost after Set-Cookie has already reached the browser.
    if (error instanceof AuthError && error.code === 'NETWORK_ERROR' && !signal.aborted) {
      const session = await getSession(signal);
      if (session) return session;
    }
    throw error;
  }
}
export const passwordLogin = (username: string, password: string, signal: AbortSignal) =>
  loginResult('password/login', { username, password }, signal);
export function decodeBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - (value.length % 4)) % 4));
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}
function encodeBase64Url(value: ArrayBuffer): string {
  return btoa(Array.from(new Uint8Array(value), (byte) => String.fromCharCode(byte)).join(''))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}
type DescriptorJSON = Omit<PublicKeyCredentialDescriptor, 'id'> & { id: string };
type RequestJSON = Omit<PublicKeyCredentialRequestOptions, 'challenge' | 'allowCredentials'> & {
  challenge: string;
  allowCredentials?: DescriptorJSON[];
};
type CreationJSON = Omit<PublicKeyCredentialCreationOptions, 'challenge' | 'user' | 'excludeCredentials'> & {
  challenge: string;
  user: Omit<PublicKeyCredentialUserEntity, 'id'> & { id: string };
  excludeCredentials?: DescriptorJSON[];
};
interface Options<T> {
  ceremonyId: string;
  publicKey: T;
}
const descriptor = (value: DescriptorJSON): PublicKeyCredentialDescriptor => ({
  ...value,
  id: decodeBase64Url(value.id),
});
export function credentialJSON(credential: PublicKeyCredential): unknown {
  const response = credential.response;
  const common = {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    clientExtensionResults: credential.getClientExtensionResults(),
    authenticatorAttachment: credential.authenticatorAttachment,
  };
  if (response instanceof AuthenticatorAttestationResponse)
    return {
      ...common,
      response: {
        clientDataJSON: encodeBase64Url(response.clientDataJSON),
        attestationObject: encodeBase64Url(response.attestationObject),
        transports: response.getTransports?.() ?? [],
      },
    };
  if (response instanceof AuthenticatorAssertionResponse)
    return {
      ...common,
      response: {
        clientDataJSON: encodeBase64Url(response.clientDataJSON),
        authenticatorData: encodeBase64Url(response.authenticatorData),
        signature: encodeBase64Url(response.signature),
        userHandle: response.userHandle ? encodeBase64Url(response.userHandle) : null,
      },
    };
  throw new AuthError('PASSKEY_UNSUPPORTED');
}
function requirePasskeys(): void {
  if (!window.PublicKeyCredential || !navigator.credentials) throw new AuthError('PASSKEY_UNSUPPORTED');
}
export async function passkeyAuthentication(purpose: 'login' | 'reauth', signal: AbortSignal): Promise<SessionView> {
  requirePasskeys();
  const path = purpose === 'login' ? 'passkey/login' : 'reauth/passkey';
  const options = await authRequest<Options<RequestJSON>>(`${path}/options`, signal, {});
  const credential = await navigator.credentials.get({
    signal,
    publicKey: {
      ...options.publicKey,
      challenge: decodeBase64Url(options.publicKey.challenge),
      allowCredentials: options.publicKey.allowCredentials?.map(descriptor),
    },
  });
  signal.throwIfAborted();
  if (!(credential instanceof PublicKeyCredential)) throw new AuthError('PASSKEY_CANCELLED');
  const body = { ceremonyId: options.ceremonyId, credential: credentialJSON(credential) };
  return purpose === 'login'
    ? loginResult(`${path}/finish`, body, signal)
    : authRequest<SessionView>(`${path}/finish`, signal, body);
}
export async function registerPasskey(name: string, signal: AbortSignal): Promise<PasskeyView> {
  requirePasskeys();
  const options = await authRequest<Options<CreationJSON>>('passkeys/options', signal, { name });
  const credential = await navigator.credentials.create({
    signal,
    publicKey: {
      ...options.publicKey,
      challenge: decodeBase64Url(options.publicKey.challenge),
      user: { ...options.publicKey.user, id: decodeBase64Url(options.publicKey.user.id) },
      excludeCredentials: options.publicKey.excludeCredentials?.map(descriptor),
    },
  });
  signal.throwIfAborted();
  if (!(credential instanceof PublicKeyCredential)) throw new AuthError('PASSKEY_CANCELLED');
  return authRequest<PasskeyView>('passkeys/finish', signal, {
    ceremonyId: options.ceremonyId,
    credential: credentialJSON(credential),
  });
}
