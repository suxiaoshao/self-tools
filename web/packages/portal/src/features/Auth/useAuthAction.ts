import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthError } from './service';
import { useAuthStore } from './authSlice';
import type { I18nKey } from 'i18n';
const messages: Record<string, I18nKey> = {
  AUTHENTICATION_FAILED: 'auth_failed',
  NO_PASSKEY: 'auth_no_passkey',
  PASSKEY_EXISTS: 'auth_passkey_exists',
  CEREMONY_INVALID: 'auth_ceremony_invalid',
  REAUTH_REQUIRED: 'auth_reauth_required',
  UNAUTHENTICATED: 'auth_session_expired',
  RATE_LIMITED: 'auth_rate_limited',
  AUTH_UNAVAILABLE: 'auth_unavailable',
  NETWORK_ERROR: 'auth_network_error',
  PASSKEY_UNSUPPORTED: 'auth_passkey_unsupported',
  PASSKEY_CANCELLED: 'auth_passkey_cancelled',
  INVALID_REQUEST: 'auth_invalid_request',
  NOT_FOUND: 'auth_not_found',
  REQUEST_REJECTED: 'auth_request_rejected',
};
function authErrorKey(error: unknown): I18nKey {
  if (error instanceof AuthError) return messages[error.code] ?? 'auth_unavailable';
  if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError'))
    return 'auth_passkey_cancelled';
  return 'auth_unavailable';
}
export function useAuthAction() {
  const active = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<I18nKey | null>(null);
  useEffect(
    () => () => {
      active.current?.abort();
      active.current = null;
    },
    [],
  );
  const run = useCallback(async (action: (signal: AbortSignal, generation: number) => Promise<void>) => {
    if (active.current) return;
    const controller = new AbortController();
    const generation = useAuthStore.getState().generation;
    active.current = controller;
    setPending(true);
    setError(null);
    try {
      await action(controller.signal, generation);
    } catch (error) {
      if (!controller.signal.aborted && useAuthStore.getState().generation === generation) {
        if (error instanceof AuthError && error.code === 'UNAUTHENTICATED')
          useAuthStore.getState().invalidate(generation);
        setError(authErrorKey(error));
      }
    } finally {
      if (active.current === controller) {
        active.current = null;
        setPending(false);
      }
    }
  }, []);
  const cancel = useCallback(() => {
    active.current?.abort();
    active.current = null;
    setPending(false);
  }, []);
  return { pending, error, setError, run, cancel };
}

export function formText(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}
