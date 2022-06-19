import { atom } from 'jotai';
import { enqueueSnackbar } from 'notify';

const innerAuthAtom = atom<string | null>(window.localStorage.getItem('auth'));
export const authAtom = atom(
  (get) => get(innerAuthAtom),
  async (_get, set, data: LoginForm) => {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const request = new Request('http://auth.sushao.top/api/login', {
      mode: 'cors',
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });
    const response = await fetch(request);
    const auth = await response.json();
    if (auth.message) {
      enqueueSnackbar(auth.message, { variant: 'error' });
      return;
    }
    window.localStorage.setItem('auth', auth.data);
    set(innerAuthAtom, auth.data);
  },
);
export interface LoginForm {
  username: string;
  password: string;
}
