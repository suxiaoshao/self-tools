import { PageToolbar } from 'ui/page-toolbar';
import { useEffect, useState } from 'react';
import { KeyRound, Plus } from 'lucide-react';
import { useI18n } from 'i18n';
import { useAuthStore } from './authSlice';
import {
  getPasskeys,
  getSession,
  passkeyAuthentication,
  passwordReauth,
  registerPasskey,
  renamePasskey,
  deletePasskey,
  UnconfirmedWrite,
  type PasskeyView,
  type SessionView,
} from './service';
import { normalizeRequestFailure } from 'request-errors';
import { useAuthAction, formText } from './useAuthAction';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from 'ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from 'ui/components/dialog';
import { Button } from 'ui/components/button';
import { Input } from 'ui/components/input';
import { FieldGroup, Field, FieldLabel } from 'ui/components/field';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from 'ui/components/empty';
type Operation = { kind: 'add'; name: string } | { kind: 'rename' | 'delete'; id: string; name: string };
export default function Security() {
  const t = useI18n();
  const [keys, setKeys] = useState<PasskeyView[] | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [reauth, setReauth] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [unconfirmed, setUnconfirmed] = useState(false);
  const [saved, setSaved] = useState(false);
  const { run, pending, error, requestId, setError, cancel } = useAuthAction();
  useEffect(() => {
    void run(async (signal, generation) => {
      const values = await getPasskeys(signal);
      if (!signal.aborted && useAuthStore.getState().generation === generation) setKeys(values);
    });
  }, [run]);
  async function refreshKeys(signal: AbortSignal, generation: number) {
    try {
      const values = await getPasskeys(signal);
      if (!signal.aborted && useAuthStore.getState().generation === generation) setKeys(values);
    } catch {
      if (!signal.aborted && useAuthStore.getState().generation === generation) setError('auth_refresh_failed');
    }
  }
  async function execute(op: Operation, signal: AbortSignal, generation: number) {
    let sessionInvalidated = false;
    try {
      if (op.kind === 'add') {
        const key = await registerPasskey(op.name.trim(), signal);
        if (!signal.aborted && useAuthStore.getState().generation === generation)
          setKeys((keys) => [...(keys ?? []), key]);
      } else if (op.kind === 'rename') {
        const key = await renamePasskey(op.id, op.name.trim(), signal);
        if (!signal.aborted && useAuthStore.getState().generation === generation)
          setKeys((keys) => keys?.map((old) => (old.id === key.id ? key : old)) ?? null);
      } else {
        const result = await deletePasskey(op.id, signal);
        sessionInvalidated = result.sessionInvalidated;
        if (!signal.aborted && useAuthStore.getState().generation === generation)
          setKeys((keys) => keys?.filter((key) => key.id !== result.id) ?? null);
      }
    } catch (error) {
      if (signal.aborted || useAuthStore.getState().generation !== generation) return;
      const failure = normalizeRequestFailure(error);
      if (failure.kind === 'public' && failure.error.code === 'REAUTH_REQUIRED') {
        setReauth(true);
        return;
      }
      if (error instanceof UnconfirmedWrite) setUnconfirmed(true);
      throw error;
    }
    if (signal.aborted || useAuthStore.getState().generation !== generation) return;
    setOperation(null);
    setReauth(false);
    setSaved(true);
    setUnconfirmed(false);
    if (sessionInvalidated) {
      useAuthStore.getState().invalidate(generation);
      return;
    }
    await refreshKeys(signal, generation);
  }
  async function checkResult(signal: AbortSignal, generation: number) {
    if (!operation) return;
    if (operation.kind === 'delete') {
      const session = await getSession(signal);
      if (signal.aborted || useAuthStore.getState().generation !== generation) return;
      if (!session) {
        useAuthStore.getState().invalidate(generation);
        return;
      }
      useAuthStore.getState().refresh(session, generation);
    }
    const values = await getPasskeys(signal);
    if (signal.aborted || useAuthStore.getState().generation !== generation) return;
    setKeys(values);
    const confirmed =
      operation.kind === 'delete'
        ? !values.some((key) => key.id === operation.id)
        : operation.kind === 'rename' &&
          values.some((key) => key.id === operation.id && key.name === operation.name.trim());
    if (confirmed) {
      setOperation(null);
      setUnconfirmed(false);
      setSaved(true);
    } else setError(operation.kind === 'add' ? 'auth_registration_unconfirmed' : 'auth_result_unconfirmed');
  }
  function submitOperation() {
    if (!operation || unconfirmed) return;
    const recent = useAuthStore.getState().session?.recentAuthenticationUntil;
    if (!recent || Date.now() >= Date.parse(recent)) {
      setReauth(true);
      return;
    }
    void run((signal, generation) => execute(operation, signal, generation));
  }
  async function verified(session: SessionView, signal: AbortSignal, generation: number) {
    if (signal.aborted || useAuthStore.getState().generation !== generation) return;
    useAuthStore.getState().refresh(session, generation);
    setReauth(false);
    setPasswordOpen(false);
    if (operation) await execute(operation, signal, generation);
  }
  const close = () => {
    cancel();
    setOperation(null);
    setReauth(false);
    setPasswordOpen(false);
    setUnconfirmed(false);
    setError(null);
  };
  const open = (operation: Operation) => {
    setSaved(false);
    setUnconfirmed(false);
    void run(async (signal, generation) => {
      const values = await getPasskeys(signal);
      if (!signal.aborted && useAuthStore.getState().generation === generation) setKeys(values);
    });
    setOperation(operation);
    setReauth(false);
    setError(null);
  };
  return (
    <section className="flex min-h-0 size-full flex-col">
      <title>{t('auth_security')}</title>
      <PageToolbar>
        <h1 className="font-medium">{t('auth_security')}</h1>
        <Button className="ml-auto" disabled={pending || keys === null} onClick={() => open({ kind: 'add', name: '' })}>
          <Plus data-icon="inline-start" />
          {t('auth_add_passkey')}
        </Button>
      </PageToolbar>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl p-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('auth_passkeys')}</CardTitle>
              <CardDescription>{t('auth_security_description')}</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {saved && <output>{t('auth_operation_saved')}</output>}

              {keys === null ? (
                <output>{t('auth_loading_passkeys')}</output>
              ) : keys.length === 0 ? (
                <Empty>
                  <EmptyHeader>
                    <EmptyTitle>{t('auth_no_passkeys_title')}</EmptyTitle>
                    <EmptyDescription>{t('auth_no_passkeys_description')}</EmptyDescription>
                  </EmptyHeader>
                </Empty>
              ) : (
                <ul className="flex flex-col gap-5">
                  {keys.map((key) => (
                    <li key={key.id} className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="break-words font-medium">{key.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {t('auth_created_at')}: {new Date(key.createdAt).toLocaleString()}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t('auth_last_used')}:{' '}
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : t('auth_never_used')}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          disabled={pending}
                          onClick={() => open({ kind: 'rename', id: key.id, name: key.name })}
                        >
                          {t('auth_rename')}
                        </Button>
                        <Button
                          variant="ghost"
                          disabled={pending}
                          onClick={() => open({ kind: 'delete', id: key.id, name: key.name })}
                        >
                          {t('delete')}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {!operation && error && (
                <>
                  <p role="alert">
                    {t(error)} {requestId && <code>{requestId}</code>}
                  </p>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      run(async (signal, generation) => {
                        const values = await getPasskeys(signal);
                        if (!signal.aborted && useAuthStore.getState().generation === generation) setKeys(values);
                      })
                    }
                  >
                    {t('auth_retry')}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <Dialog
        open={operation !== null}
        onOpenChange={(open) => {
          if (!open) close();
        }}
      >
        <DialogContent showCloseButton={!pending}>
          <DialogHeader>
            <DialogTitle>
              {t(
                reauth
                  ? 'auth_verify_identity'
                  : operation?.kind === 'add'
                    ? 'auth_add_passkey'
                    : operation?.kind === 'rename'
                      ? 'auth_rename'
                      : 'auth_delete_passkey',
              )}
            </DialogTitle>
            <DialogDescription>
              {reauth
                ? t('auth_reauth_description')
                : operation?.kind === 'delete'
                  ? t('auth_delete_description', { name: operation.name })
                  : t('auth_name_description')}
            </DialogDescription>
          </DialogHeader>
          {reauth ? (
            <div className="flex flex-col gap-4">
              <Button
                disabled={pending}
                onClick={() =>
                  run(async (signal, generation) =>
                    verified(await passkeyAuthentication('reauth', signal), signal, generation),
                  )
                }
              >
                <KeyRound data-icon="inline-start" />
                {t('auth_use_passkey')}
              </Button>
              <Button
                variant="ghost"
                disabled={pending}
                aria-expanded={passwordOpen}
                onClick={() => setPasswordOpen(!passwordOpen)}
              >
                {t('auth_use_password')}
              </Button>
              {passwordOpen && (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    const password = formText(new FormData(event.currentTarget), 'password');
                    void run(async (signal, generation) =>
                      verified(await passwordReauth(password, signal), signal, generation),
                    );
                  }}
                >
                  <FieldGroup>
                    <Field>
                      <FieldLabel htmlFor="reauth-password">{t('password')}</FieldLabel>
                      <Input
                        id="reauth-password"
                        name="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        disabled={pending}
                      />
                    </Field>
                    <Field>
                      <Button type="submit" disabled={pending}>
                        {t('auth_verify_continue')}
                      </Button>
                    </Field>
                  </FieldGroup>
                </form>
              )}
            </div>
          ) : operation?.kind === 'delete' ? (
            <Button variant="destructive" disabled={pending || unconfirmed} onClick={submitOperation}>
              {t('auth_delete_passkey')}
            </Button>
          ) : (
            <form
              id="passkey-name-form"
              onSubmit={(event) => {
                event.preventDefault();
                submitOperation();
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="passkey-name">{t('auth_passkey_name')}</FieldLabel>
                  <Input
                    id="passkey-name"
                    value={operation?.name ?? ''}
                    required
                    maxLength={64}
                    disabled={pending || unconfirmed}
                    onChange={(event) => {
                      const name = event.target.value;
                      setOperation((old) => old && { ...old, name });
                    }}
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={pending || unconfirmed || !operation?.name.trim()}>
                    {t(operation?.kind === 'add' ? 'auth_add_passkey' : 'auth_save')}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
          {unconfirmed && (
            <Button variant="outline" disabled={pending} onClick={() => run(checkResult)}>
              {t('auth_check_result')}
            </Button>
          )}
          {pending && <output>{t('auth_working')}</output>}
          {error && (
            <p role="alert">
              {t(error)} {requestId && <code>{requestId}</code>}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={close}>
              {t('cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
