import { useEffect, useState } from 'react';
import { KeyRound, Plus } from 'lucide-react';
import { useI18n } from 'i18n';
import { useAuthStore } from './authSlice';
import {
  AuthError,
  authRequest,
  getSession,
  passkeyAuthentication,
  registerPasskey,
  type PasskeyView,
  type SessionView,
} from './service';
import { useAuthAction, formText } from './useAuthAction';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@portal/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@portal/components/ui/dialog';
import { Button } from '@portal/components/ui/button';
import { Input } from '@portal/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@portal/components/ui/field';
import { Empty, EmptyHeader, EmptyTitle, EmptyDescription } from '@portal/components/ui/empty';
type Operation = { kind: 'add'; name: string } | { kind: 'rename' | 'delete'; id: string; name: string };
export default function Security() {
  const t = useI18n();
  const [keys, setKeys] = useState<PasskeyView[] | null>(null);
  const [operation, setOperation] = useState<Operation | null>(null);
  const [reauth, setReauth] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { run, pending, error, setError, cancel } = useAuthAction();
  useEffect(() => {
    void run(async (signal, generation) => {
      const values = await authRequest<PasskeyView[]>('passkeys', signal);
      if (!signal.aborted && useAuthStore.getState().generation === generation) setKeys(values);
    });
  }, [run]);
  async function execute(op: Operation, signal: AbortSignal, generation: number) {
    try {
      if (op.kind === 'add') await registerPasskey(op.name.trim(), signal);
      else if (op.kind === 'rename') await authRequest(`passkeys/${op.id}`, signal, { name: op.name.trim() }, 'PATCH');
      else await authRequest(`passkeys/${op.id}`, signal, {}, 'DELETE');
    } catch (error) {
      if (error instanceof AuthError && error.code === 'REAUTH_REQUIRED') {
        setReauth(true);
        return;
      }
      throw error;
    }
    if (signal.aborted || useAuthStore.getState().generation !== generation) return;
    setOperation(null);
    setReauth(false);
    // Deleting a credential can revoke this browser's session as well.
    if (op.kind === 'delete') {
      const session = await getSession(signal);
      if (!session) {
        useAuthStore.getState().invalidate(generation);
        return;
      }
      useAuthStore.getState().refresh(session, generation);
    }
    const values = await authRequest<PasskeyView[]>('passkeys', signal);
    if (!signal.aborted && useAuthStore.getState().generation === generation) setKeys(values);
  }
  function submitOperation() {
    if (!operation) return;
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
    setError(null);
  };
  const open = (operation: Operation) => {
    setOperation(operation);
    setReauth(false);
    setError(null);
  };
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <title>{t('auth_security')}</title>
      <Card>
        <CardHeader>
          <CardTitle>{t('auth_security')}</CardTitle>
          <CardDescription>{t('auth_security_description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-medium">{t('auth_passkeys')}</h2>
            <Button disabled={pending || keys === null} onClick={() => open({ kind: 'add', name: '' })}>
              <Plus data-icon="inline-start" />
              {t('auth_add_passkey')}
            </Button>
          </div>
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
              <p role="alert">{t(error)}</p>
              <Button
                variant="outline"
                disabled={pending}
                onClick={() =>
                  run(async (signal, generation) => {
                    const values = await authRequest<PasskeyView[]>('passkeys', signal);
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
                      verified(
                        await authRequest<SessionView>('reauth/password', signal, { password }),
                        signal,
                        generation,
                      ),
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
            <Button variant="destructive" disabled={pending} onClick={submitOperation}>
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
                    disabled={pending}
                    onChange={(event) => {
                      const name = event.target.value;
                      setOperation((old) => old && { ...old, name });
                    }}
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={pending || !operation?.name.trim()}>
                    {t(operation?.kind === 'add' ? 'auth_add_passkey' : 'auth_save')}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
          {pending && <output>{t('auth_working')}</output>}
          {error && <p role="alert">{t(error)}</p>}
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
