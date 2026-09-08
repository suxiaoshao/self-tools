import { create } from 'zustand';
import { clearAuthenticatedState } from 'custom-graphql';
import { getSession, type SessionView } from './service';
interface AuthState {
  status: 'checking' | 'anonymous' | 'authenticated' | 'unavailable';
  session: SessionView | null;
  generation: number;
  initialize: (signal: AbortSignal) => Promise<void>;
  accept: (session: SessionView | null, generation: number) => void;
  refresh: (session: SessionView, generation: number) => void;
  invalidate: (generation: number) => void;
}
export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'checking',
  session: null,
  generation: 0,
  initialize: async (signal) => {
    window.localStorage.removeItem('auth');
    const generation = get().generation + 1;
    set({ status: 'checking', session: null, generation });
    clearAuthenticatedState();
    try {
      const session = await getSession(signal);
      if (!signal.aborted) get().accept(session, generation);
    } catch {
      if (!signal.aborted && get().generation === generation) set({ status: 'unavailable' });
    }
  },
  accept: (session, generation) => {
    if (get().generation !== generation) return;
    clearAuthenticatedState();
    set({ session, status: session ? 'authenticated' : 'anonymous', generation: generation + 1 });
  },
  refresh: (session, generation) => {
    if (get().generation === generation) set({ session });
  },
  invalidate: (generation) => {
    if (get().generation !== generation || get().status !== 'authenticated') return;
    get().accept(null, generation);
  },
}));
