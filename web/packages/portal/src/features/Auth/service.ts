import type { Enum } from 'types';
import type { LoginForm } from './authSlice';
import { match } from 'ts-pattern';
import { enqueueSnackbar } from 'notify';

export type HttpResponse<T> =
  | Enum<'network'>
  | Enum<'response', T>
  | Enum<'unknown'>
  | Enum<'json'>
  | Enum<'error', string>;

export function responseThen<T>(response: HttpResponse<T>, doThen: (data: T) => void): void {
  match(response as HttpResponse<unknown>)
    .with({ tag: 'response' }, ({ value }) => {
      doThen(value as T);
    })
    .with({ tag: 'json' }, () => {
      enqueueSnackbar('json error', { variant: 'error' });
    })
    .with({ tag: 'error' }, ({ value }) => {
      enqueueSnackbar(value, { variant: 'error' });
    })
    .with({ tag: 'network' }, () => {
      enqueueSnackbar('network error', { variant: 'error' });
    })
    .with({ tag: 'unknown' }, () => {
      enqueueSnackbar('unknown error', { variant: 'error' });
    });
}

async function fetchBase<Bod, Res>(url: string, body: Bod): Promise<HttpResponse<Res>> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const request = new Request(url, {
    mode: 'cors',
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(body),
    headers,
  });
  try {
    const response = await fetch(request);
    try {
      const auth = await response.json();
      if (auth.message) {
        return { value: auth.message, tag: 'error' };
      }
      return { value: auth.data as Res, tag: 'response' } as HttpResponse<Res>;
    } catch (error) {
      if (error instanceof Error) {
        return { tag: 'json' };
      }
      return { tag: 'unknown' };
    }
  } catch (error) {
    if (error instanceof Error) {
      return { tag: 'network' };
    }
    return { tag: 'unknown' };
  }
}

export async function login(data: LoginForm): Promise<HttpResponse<string>> {
  return await fetchBase('https://auth.sushao.top/api/login', data);
}

export interface RegistrationRequest {
  publicKey: Omit<PublicKeyCredentialCreationOptions, 'user' | 'challenge'> & {
    challenge: string;
    user: Omit<PublicKeyCredentialUserEntity, 'id'> & {
      id: string;
    };
  };
}
export function base64UrlToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  // 1. 补齐“=”到 4 的倍数
  const padLength = (4 - (base64Url.length % 4)) % 4;
  const padded = base64Url + '='.repeat(padLength);

  // 2. 恢复成标准 Base64
  const b64 = padded.replaceAll('-', '+').replaceAll('_', '/');

  // 3. 解码成 binary string
  const binary = atob(b64);

  // 4. 转成 Uint8Array
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i += 1) {
    bytes[i] = binary.codePointAt(i) ?? 0;
  }
  return bytes;
}

export async function startRegister(data: LoginForm): Promise<HttpResponse<CredentialCreationOptions>> {
  const response = await fetchBase<LoginForm, RegistrationRequest>('https://auth.sushao.top/api/start-register', data);
  return match(response)
    .with(
      { tag: 'response' },
      ({ value }) =>
        ({
          tag: 'response',
          value: {
            publicKey: {
              ...value.publicKey,
              user: {
                id: base64UrlToUint8Array(value.publicKey.user.id),
                name: value.publicKey.user.name,
                displayName: value.publicKey.user.displayName,
              },
              challenge: base64UrlToUint8Array(value.publicKey.challenge),
            },
          } satisfies CredentialCreationOptions,
        }) satisfies HttpResponse<CredentialCreationOptions>,
    )
    .otherwise((value) => value);
}

export async function finishRegister(data: Credential): Promise<HttpResponse<string>> {
  const response = await fetchBase<Credential, string>('https://auth.sushao.top/api/finish-register', data);
  return response;
}

export interface StartAuthenticationRequest {
  username: string;
}

interface StartAuthenticationResponse {
  publicKey: Omit<PublicKeyCredentialRequestOptions, 'challenge' | 'allowCredentials'> & {
    challenge: string;
    allowCredentials: (Omit<PublicKeyCredentialDescriptor, 'id'> & {
      id: string;
    })[];
  };
}

export async function startAuthentication(
  data: StartAuthenticationRequest,
): Promise<HttpResponse<CredentialRequestOptions>> {
  const response = await fetchBase<StartAuthenticationRequest, StartAuthenticationResponse>(
    'https://auth.sushao.top/api/start-authentication',
    data,
  );
  return match(response)
    .with(
      { tag: 'response' },
      ({ value }) =>
        ({
          tag: 'response',
          value: {
            publicKey: {
              ...value.publicKey,
              challenge: base64UrlToUint8Array(value.publicKey.challenge),
              allowCredentials: value.publicKey.allowCredentials.map((credential) => ({
                ...credential,
                id: base64UrlToUint8Array(credential.id),
              })),
            },
          } satisfies CredentialRequestOptions,
        }) satisfies HttpResponse<CredentialRequestOptions>,
    )
    .otherwise((value) => value);
}

export async function finishAuthentication(data: Credential): Promise<HttpResponse<string>> {
  const response = await fetchBase<Credential, string>('https://auth.sushao.top/api/finish-authentication', data);
  return response;
}
