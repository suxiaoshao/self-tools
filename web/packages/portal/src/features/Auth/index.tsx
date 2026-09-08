import { useState } from 'react';
import { Navigate, useSearchParams } from 'react-router';
import { KeyRound } from 'lucide-react';
import { useI18n } from 'i18n';
import { useAuthStore } from './authSlice';
import { passwordLogin, passkeyAuthentication } from './service';
import { useAuthAction, formText } from './useAuthAction';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@portal/components/ui/card';
import { Button } from '@portal/components/ui/button';
import { Input } from '@portal/components/ui/input';
import { FieldGroup, Field, FieldLabel } from '@portal/components/ui/field';
import { safeFrom } from './redirect';
export { default as useLogin } from './useLogin';
export { default as AuthDrawerItem } from './AuthDrawerItem';
export default function Login() {
  const t = useI18n();
  const status = useAuthStore((s) => s.status);
  const [search] = useSearchParams();
  const [passwordOpen, setPasswordOpen] = useState(false);
  const action = useAuthAction();
  if (status === 'authenticated') return <Navigate replace to={safeFrom(search.get('from'))} />;
  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <title>{t('login')}</title>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('login')}</CardTitle>
          <CardDescription>{t('auth_login_description')}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Button
            disabled={action.pending}
            onClick={() =>
              action.run(async (signal, generation) => {
                const session = await passkeyAuthentication('login', signal);
                if (!signal.aborted) useAuthStore.getState().accept(session, generation);
              })
            }
          >
            <KeyRound data-icon="inline-start" />
            {t('auth_use_passkey')}
          </Button>
          <Button
            variant="ghost"
            disabled={action.pending}
            aria-expanded={passwordOpen}
            aria-controls="password-login"
            onClick={() => setPasswordOpen(!passwordOpen)}
          >
            {t('auth_use_password')}
          </Button>
          {passwordOpen && (
            <form
              id="password-login"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                void action.run(async (signal, generation) => {
                  const session = await passwordLogin(formText(form, 'username'), formText(form, 'password'), signal);
                  if (!signal.aborted) useAuthStore.getState().accept(session, generation);
                });
              }}
            >
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="username">{t('username')}</FieldLabel>
                  <Input id="username" name="username" autoComplete="username" required disabled={action.pending} />
                </Field>
                <Field>
                  <FieldLabel htmlFor="password">{t('password')}</FieldLabel>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    disabled={action.pending}
                  />
                </Field>
                <Field>
                  <Button type="submit" disabled={action.pending}>
                    {t('login')}
                  </Button>
                </Field>
              </FieldGroup>
            </form>
          )}
          {action.pending && <output>{t('auth_working')}</output>}
          {action.error && <p role="alert">{t(action.error)}</p>}
          {action.pending && (
            <Button variant="outline" onClick={action.cancel}>
              {t('cancel')}
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
