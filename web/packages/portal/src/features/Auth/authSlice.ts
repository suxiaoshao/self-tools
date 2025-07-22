import { create } from 'zustand';
import { enqueueSnackbar } from 'notify';
import { login } from './service';
import { match } from 'ts-pattern';

export interface AuthSliceType {
  value: string | null;
}

interface AuthState extends AuthSliceType {
  setAuth: (auth: string | null) => void;
  logout: () => void;
  login: (data: LoginForm) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  value: window.localStorage.getItem('auth'),
  setAuth: (auth: string | null) => {
    set({ value: auth });
    if (auth === null) {
      window.localStorage.removeItem('auth');
    } else {
      window.localStorage.setItem('auth', auth);
    }
  },
  logout: () => {
    set({ value: null });
    window.localStorage.removeItem('auth');
  },
  login: async (data: LoginForm) => {
    const auth = await login(data);
    match(auth)
      .with({ tag: 'response' }, ({ value }) => {
        get().setAuth(value);
      })
      .with({ tag: 'json' }, () => enqueueSnackbar('json error', { variant: 'error' }))
      .with({ tag: 'error' }, ({ value }) => enqueueSnackbar(value, { variant: 'error' }))
      .with({ tag: 'network' }, () => enqueueSnackbar('network error', { variant: 'error' }))
      .with({ tag: 'unknown' }, () => enqueueSnackbar('unknown error', { variant: 'error' }));
  },
}));

export interface LoginForm {
  username: string;
  password: string;
}
