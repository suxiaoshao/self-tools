import { LoginForm } from './authSlice';
import { Enum } from '../../types/src';

export type HttpResponse<T> =
  | Enum<'network'>
  | Enum<'response', T>
  | Enum<'unknown'>
  | Enum<'json'>
  | Enum<'error', string>;

export async function login(data: LoginForm): Promise<HttpResponse<string>> {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  const request = new Request('https://auth.sushao.top/api/login', {
    mode: 'cors',
    credentials: 'include',
    method: 'POST',
    body: JSON.stringify(data),
    headers,
  });
  try {
    const response = await fetch(request);
    try {
      const auth = await response.json();
      if (auth.message) {
        return { value: auth.message, tag: 'error' };
      }
      return { value: auth.data, tag: 'response' };
    } catch (err) {
      if (err instanceof Error) {
        return { tag: 'json' };
      }
      return { tag: 'unknown' };
    }
  } catch (err) {
    if (err instanceof Error) {
      return { tag: 'network' };
    }
    return { tag: 'unknown' };
  }
}
