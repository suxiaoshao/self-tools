import { create } from 'zustand';
import { enqueueSnackbar } from 'notify';

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
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const request = new Request('https://auth.sushao.top/api/login', {
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
    get().setAuth(auth.data);
  },
}));

export interface LoginForm {
  username: string;
  password: string;
}
