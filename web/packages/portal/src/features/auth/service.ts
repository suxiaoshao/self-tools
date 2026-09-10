import { endpoints } from 'runtime-config';
import * as v from 'valibot';
import {
  decodePublicError,
  decodeRequestId,
  fetchFailure,
  isUnconfirmed,
  normalizeRequestFailure,
  publicHttpStatus,
  RequestError,
} from 'request-errors';

const timestamp = v.pipe(
  v.string(),
  v.check((value) => Number.isFinite(Date.parse(value))),
);
const nonempty = v.pipe(v.string(), v.nonEmpty());
const base64url = v.pipe(nonempty, v.regex(/^[A-Za-z0-9_-]+$/));
const sessionSchema = v.object({
  user: v.object({ id: nonempty, username: nonempty }),
  idleExpiresAt: timestamp,
  absoluteExpiresAt: timestamp,
  recentAuthenticationUntil: timestamp,
});
const passkeySchema = v.object({
  id: v.pipe(v.string(), v.uuid()),
  name: nonempty,
  createdAt: timestamp,
  lastUsedAt: v.nullable(timestamp),
});
const deleteSchema = v.object({ id: v.pipe(v.string(), v.uuid()), sessionInvalidated: v.boolean() });
const descriptorSchema = v.object({
  id: base64url,
  type: v.literal('public-key'),
  transports: v.optional(v.array(v.picklist(['ble', 'hybrid', 'internal', 'nfc', 'usb']))),
});
const extensionsSchema = v.object({
  appid: v.optional(v.string()),
  uvm: v.optional(v.boolean()),
  credProps: v.optional(v.boolean()),
  minPinLength: v.optional(v.boolean()),
  hmacCreateSecret: v.optional(v.boolean()),
  credentialProtectionPolicy: v.optional(
    v.picklist([
      'userVerificationOptional',
      'userVerificationOptionalWithCredentialIDList',
      'userVerificationRequired',
    ]),
  ),
  enforceCredentialProtectionPolicy: v.optional(v.boolean()),
  hmacGetSecret: v.optional(v.object({ output1: base64url, output2: v.nullish(base64url) })),
});
const requestOptionsSchema = v.object({
  ceremonyId: base64url,
  publicKey: v.object({
    extensions: v.optional(extensionsSchema),
    hints: v.optional(v.array(v.string())),
    challenge: base64url,
    timeout: v.optional(v.number()),
    rpId: v.optional(nonempty),
    allowCredentials: v.optional(v.array(descriptorSchema)),
    userVerification: v.optional(v.picklist(['required', 'preferred', 'discouraged'])),
  }),
});
const creationOptionsSchema = v.object({
  ceremonyId: base64url,
  publicKey: v.object({
    extensions: v.optional(extensionsSchema),
    hints: v.optional(v.array(v.string())),
    attestationFormats: v.optional(v.array(v.string())),
    challenge: base64url,
    rp: v.object({ id: v.optional(nonempty), name: nonempty }),
    user: v.object({ id: base64url, name: nonempty, displayName: nonempty }),
    pubKeyCredParams: v.array(v.object({ type: v.literal('public-key'), alg: v.number() })),
    timeout: v.optional(v.number()),
    excludeCredentials: v.optional(v.array(descriptorSchema)),
    authenticatorSelection: v.optional(
      v.object({
        authenticatorAttachment: v.optional(v.picklist(['platform', 'cross-platform'])),
        residentKey: v.optional(v.picklist(['required', 'preferred', 'discouraged'])),
        requireResidentKey: v.optional(v.boolean()),
        userVerification: v.optional(v.picklist(['required', 'preferred', 'discouraged'])),
      }),
    ),
    attestation: v.optional(v.picklist(['none', 'indirect', 'direct', 'enterprise'])),
  }),
});
export type SessionView = v.InferOutput<typeof sessionSchema>;
export type PasskeyView = v.InferOutput<typeof passkeySchema>;
export class PasskeyError extends Error {
  constructor(public readonly reason: 'unsupported' | 'cancelled') {
    super(reason);
  }
}
export class UnconfirmedWrite extends RequestError {}
async function request<S extends v.GenericSchema>(
  path: string,
  schema: S,
  signal: AbortSignal,
  body?: unknown,
  method = body === undefined ? 'GET' : 'POST',
): Promise<v.InferOutput<S>> {
  const waiting = AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
  let response: Response;
  try {
    response = await fetch(`${endpoints.auth}${path}`, {
      credentials: 'same-origin',
      method,
      signal: waiting,
      cache: 'no-store',
      headers: { 'X-Self-Tools-Request': '1', ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    throw fetchFailure(error, waiting);
  }
  const requestId = decodeRequestId(response.headers.get('x-request-id'));
  const protocol = () => new RequestError({ kind: 'protocol', requestId });
  if (response.status === 204) {
    if (path === 'logout') return v.parse(schema, undefined);
    throw protocol();
  }
  let result: unknown;
  try {
    result = await response.json();
  } catch (error) {
    if (waiting.aborted) throw fetchFailure(error, waiting);
    throw protocol();
  }
  if (!response.ok) {
    const envelope = v.safeParse(v.object({ error: v.unknown() }), result);
    const error = envelope.success ? decodePublicError(envelope.output.error) : undefined;
    if (!error || publicHttpStatus(error.code) !== response.status || (requestId && requestId !== error.requestId))
      throw protocol();
    throw new RequestError({ kind: 'public', error });
  }
  const parsed = v.safeParse(v.object({ data: schema }), result);
  if (!parsed.success) throw protocol();
  return parsed.output.data;
}
export const getSession = (signal: AbortSignal) => request('session', v.nullable(sessionSchema), signal);
export const getPasskeys = (signal: AbortSignal) => request('passkeys', v.array(passkeySchema), signal);

async function reconcile<T>(
  write: () => Promise<T>,
  check: () => Promise<T | undefined>,
  signal: AbortSignal,
): Promise<T> {
  try {
    return await write();
  } catch (error) {
    if (signal.aborted || !isUnconfirmed(error)) throw error;
    try {
      const result = await check();
      if (result !== undefined) return result;
    } catch {
      /* The write is still unconfirmed. */
    }
    throw new UnconfirmedWrite(normalizeRequestFailure(error));
  }
}
async function loginResult(path: string, body: unknown, signal: AbortSignal): Promise<SessionView> {
  return reconcile(
    () => request(path, sessionSchema, signal, body),
    async () => (await getSession(signal)) ?? undefined,
    signal,
  );
}
async function reauthResult(path: string, body: unknown, signal: AbortSignal): Promise<SessionView> {
  return reconcile(
    () => request(path, sessionSchema, signal, body),
    async () => {
      const session = await getSession(signal);
      return session && Date.parse(session.recentAuthenticationUntil) > Date.now() ? session : undefined;
    },
    signal,
  );
}
export const passwordLogin = (username: string, password: string, signal: AbortSignal) =>
  loginResult('password/login', { username, password }, signal);
export const passwordReauth = (password: string, signal: AbortSignal) =>
  reauthResult('reauth/password', { password }, signal);
export const logout = (signal: AbortSignal) =>
  reconcile(
    async () => {
      await request('logout', v.undefined(), signal, {});
      return true;
    },
    async () => ((await getSession(signal)) === null ? true : undefined),
    signal,
  );
export const renamePasskey = (id: string, name: string, signal: AbortSignal) =>
  reconcile(
    () => request(`passkeys/${id}`, passkeySchema, signal, { name }, 'PATCH'),
    async () => (await getPasskeys(signal)).find((key) => key.id === id && key.name === name),
    signal,
  );
export const deletePasskey = (id: string, signal: AbortSignal) =>
  reconcile(
    () => request(`passkeys/${id}`, deleteSchema, signal, {}, 'DELETE'),
    async () => undefined,
    signal,
  );
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
type DescriptorJSON = v.InferOutput<typeof descriptorSchema>;
const descriptor = (value: DescriptorJSON): PublicKeyCredentialDescriptor => ({
  ...value,
  id: decodeBase64Url(value.id),
});
export function credentialJSON(credential: PublicKeyCredential): unknown {
  if (typeof credential.toJSON === 'function') return credential.toJSON();
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
  throw new PasskeyError('unsupported');
}
function requirePasskeys(): void {
  if (!window.PublicKeyCredential || !navigator.credentials) throw new PasskeyError('unsupported');
}
export async function passkeyAuthentication(purpose: 'login' | 'reauth', signal: AbortSignal): Promise<SessionView> {
  requirePasskeys();
  const path = purpose === 'login' ? 'passkey/login' : 'reauth/passkey';
  const options = await request(`${path}/options`, requestOptionsSchema, signal, {});
  const credential = await navigator.credentials.get({
    signal,
    publicKey:
      typeof PublicKeyCredential.parseRequestOptionsFromJSON === 'function'
        ? PublicKeyCredential.parseRequestOptionsFromJSON(options.publicKey)
        : {
            ...options.publicKey,
            challenge: decodeBase64Url(options.publicKey.challenge),
            allowCredentials: options.publicKey.allowCredentials?.map(descriptor),
          },
  });
  signal.throwIfAborted();
  if (!(credential instanceof PublicKeyCredential)) throw new PasskeyError('cancelled');
  const body = { ceremonyId: options.ceremonyId, credential: credentialJSON(credential) };
  return purpose === 'login'
    ? loginResult(`${path}/finish`, body, signal)
    : reauthResult(`${path}/finish`, body, signal);
}
export async function registerPasskey(name: string, signal: AbortSignal): Promise<PasskeyView> {
  requirePasskeys();
  const options = await request('passkeys/options', creationOptionsSchema, signal, { name });
  const credential = await navigator.credentials.create({
    signal,
    publicKey:
      typeof PublicKeyCredential.parseCreationOptionsFromJSON === 'function'
        ? PublicKeyCredential.parseCreationOptionsFromJSON(options.publicKey)
        : {
            ...options.publicKey,
            challenge: decodeBase64Url(options.publicKey.challenge),
            user: { ...options.publicKey.user, id: decodeBase64Url(options.publicKey.user.id) },
            excludeCredentials: options.publicKey.excludeCredentials?.map(descriptor),
          },
  });
  signal.throwIfAborted();
  if (!(credential instanceof PublicKeyCredential)) throw new PasskeyError('cancelled');
  return reconcile(
    () =>
      request('passkeys/finish', passkeySchema, signal, {
        ceremonyId: options.ceremonyId,
        credential: credentialJSON(credential),
      }),
    async () => undefined,
    signal,
  );
}
