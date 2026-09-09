import { useCallback, useEffect, useRef, useState } from 'react';
import { PasskeyError, UnconfirmedWrite } from './service';
import { isUnauthenticated, normalizeRequestFailure } from 'request-errors';
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
  INTERNAL: 'auth_unavailable',
  UNAVAILABLE: 'auth_unavailable',
  UPSTREAM_TIMEOUT: 'auth_network_error',
  UPSTREAM_FAILURE: 'auth_protocol_error',
  NETWORK_ERROR: 'auth_network_error',
  PASSKEY_UNSUPPORTED: 'auth_passkey_unsupported',
  PASSKEY_CANCELLED: 'auth_passkey_cancelled',
  INVALID_REQUEST: 'auth_invalid_request',
  NOT_FOUND: 'auth_not_found',
  REQUEST_REJECTED: 'auth_request_rejected',
};
function authErrorKey(error: unknown): I18nKey {
  if (error instanceof UnconfirmedWrite) return 'auth_result_unconfirmed';
  if (error instanceof PasskeyError)
    return error.reason === 'unsupported' ? 'auth_passkey_unsupported' : 'auth_passkey_cancelled';
  if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'AbortError'))
    return 'auth_passkey_cancelled';
  const failure = normalizeRequestFailure(error);
  if (failure.kind === 'public') return messages[failure.error.code] ?? 'auth_unavailable';
  if (failure.kind === 'protocol') return 'auth_protocol_error';
  if (failure.kind === 'network' || failure.kind === 'timeout') return 'auth_network_error';
  return 'auth_unavailable';
}
export function useAuthAction() {
  const active = useRef<AbortController | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<I18nKey | null>(null);
  const [requestId, setRequestId] = useState<string>();
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
    setRequestId(undefined);
    try {
      await action(controller.signal, generation);
    } catch (error) {
      if (!controller.signal.aborted && useAuthStore.getState().generation === generation) {
        if (isUnauthenticated(error)) useAuthStore.getState().invalidate(generation);
        const failure = normalizeRequestFailure(error);
        setRequestId(
          failure.kind === 'public' ? failure.error.requestId : 'requestId' in failure ? failure.requestId : undefined,
        );
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
  return { pending, error, requestId, setError, run, cancel };
}

export function formText(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === 'string' ? value : '';
}
