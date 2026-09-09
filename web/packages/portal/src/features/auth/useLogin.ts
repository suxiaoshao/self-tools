import { useEffect } from 'react';
import { registerAuthBoundary } from 'custom-graphql';
import { useAuthStore } from './authSlice';
export default function useLogin() {
  useEffect(() => {
    const unregister = registerAuthBoundary({
      generation: () => useAuthStore.getState().generation,
      unauthenticated: (generation) => useAuthStore.getState().invalidate(generation),
    });
    const controller = new AbortController();
    void useAuthStore.getState().initialize(controller.signal);
    return () => {
      controller.abort();
      unregister();
    };
  }, []);
}
