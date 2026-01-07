/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-26 05:17:45
 * @FilePath: /self-tools/web/packages/portal/src/features/Auth/index.tsx
 */
import { type SubmitHandler, useForm } from 'react-hook-form';
import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { type LoginForm, useAuthStore } from './authSlice';
import { useI18n } from 'i18n';
import { useShallow } from 'zustand/react/shallow';
import { finishAuthentication, finishRegister, responseThen, startAuthentication, startRegister } from './service';
import useTitle from '@bookmarks/hooks/useTitle';
import { Card, CardContent, CardHeader, CardTitle } from '@portal/components/ui/card';
import { Input } from '@portal/components/ui/input';
import { FieldGroup, FieldLabel, Field } from '@portal/components/ui/field';
import { Button } from '@portal/components/ui/button';
import { toast } from 'sonner';

export { default as useLogin } from './useLogin';

export default function Login() {
  const { register, handleSubmit, getValues } = useForm<LoginForm>();
  const { login, auth, setAuth } = useAuthStore(
    useShallow(({ login, value, setAuth }) => ({
      login,
      auth: value,
      setAuth,
    })),
  );
  /** 跳转 */
  const navigate = useNavigate();
  const [urlSearch] = useSearchParams();
  useEffect(() => {
    if (auth !== null) {
      const from = urlSearch.get('from');
      if (from === null) {
        navigate('/');
      } else {
        navigate(from);
      }
    }
  }, [auth, navigate, urlSearch]);
  const onSubmit: SubmitHandler<LoginForm> = (data) => {
    login(data);
  };
  const t = useI18n();
  useTitle(t('login'));
  const onClickWebauthn = useCallback(
    async (data: LoginForm) => {
      const callenge = await startRegister(data);
      responseThen(callenge, async (value) => {
        const res = await navigator.credentials.create(value);
        if (res) {
          const auth = await finishRegister(res);
          responseThen(auth, setAuth);
          await navigator.credentials.store(res);
        } else {
          toast.error('webauthn error');
        }
      });
    },
    [setAuth],
  );
  const onClickWebauthn2 = useCallback(async () => {
    const username = getValues('username');
    const options = await startAuthentication({ username });
    responseThen(options, async (value) => {
      const data = await navigator.credentials.get(value);
      if (data) {
        const auth = await finishAuthentication(data);
        responseThen(auth, setAuth);
      } else {
        toast.error('webauthn error');
      }
    });
  }, [getValues, setAuth]);
  return (
    <div className="size-full fixed left-0 flex items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t('login')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <FieldGroup>
              <Field>
                <FieldLabel>{t('username')}</FieldLabel>
                <Input required id="username" autoComplete="username" {...register('username', { required: true })} />
              </Field>
              <Field>
                <FieldLabel>{t('password')}</FieldLabel>
                <Input
                  required
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password', { required: true })}
                />
              </Field>
            </FieldGroup>

            <FieldGroup className="gap-4 mt-4">
              <Field>
                <Button type="submit">{t('login')}</Button>
              </Field>
              <Field>
                <Button variant="secondary" onClick={handleSubmit(onClickWebauthn)}>
                  {t('login_and_register_webauthn')}
                </Button>
              </Field>
              <Field>
                <Button variant="secondary" onClick={onClickWebauthn2}>
                  {t('login_with_webauthn')}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export { default as AuthDrawerItem } from './AuthDrawerItem';
