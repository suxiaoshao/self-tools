import { create } from 'zustand';
import { login, responseThen } from './service';

interface AuthSliceType {
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
    responseThen(auth, (value) => {
      get().setAuth(value);
    });
  },
}));

export interface LoginForm {
  username: string;
  password: string;
}
