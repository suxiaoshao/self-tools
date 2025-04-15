/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-02-26 05:17:45
 * @FilePath: /self-tools/web/packages/portal/src/features/Auth/index.tsx
 */
import { Avatar, Box, Button, Container, TextField, Typography } from '@mui/material';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { LockOutlined } from '@mui/icons-material';
import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { type LoginForm, useAuthStore } from './authSlice';
import { useI18n } from 'i18n';
import { useShallow } from 'zustand/react/shallow';

export { default as useLogin } from './useLogin';

export default function Login() {
  const { register, handleSubmit } = useForm<LoginForm>();
  const { login, auth } = useAuthStore(
    useShallow(({ login, value }) => ({
      login,
      auth: value,
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
  const onClickWebauthn = useCallback(async () => {
    const data = await navigator.credentials.create({
      publicKey: {
        challenge: stringToUint8Array('123'),
        rp: {
          name: 'collections.sushao.top',
        },
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7,
          },
        ],
        user: {
          displayName: 'Admin', // todo i18n
          name: 'admin', // todo i18n
          id: stringToUint8Array('admin'),
        },
        timeout: 60000,
      },
    });
    console.log(data);
  }, []);
  const onClickWebauthn2 = useCallback(async () => {
    console.log(222);
    const data = await navigator.credentials.get({
      publicKey: {
        challenge: stringToUint8Array('123'),
        rpId: 'collections.sushao.top',
        allowCredentials: [
          {
            type: 'public-key',
            id: stringToUint8Array('admin'),
          },
        ],
        timeout: 60000,
      },
    });
    console.log(data);
  }, []);
  return (
    <Box
      sx={{
        width: '100vw',
        height: '100vh',
        position: 'fixed',
        left: 0,
        background: (theme) => theme.palette.background.default,
      }}
    >
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlined />
          </Avatar>
          <Typography component="h1" variant="h5">
            {t('login')}
          </Typography>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label={t('username')}
              autoComplete="username"
              {...register('username', { required: true })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label={t('password')}
              type="password"
              id="password"
              autoComplete="current-password"
              {...register('password', { required: true })}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3 }} color="secondary">
              {t('login')}
            </Button>
            <Button fullWidth variant="contained" sx={{ mt: 3 }} onClick={onClickWebauthn}>
              {t('login_with_webauthn')}
            </Button>
            <Button fullWidth variant="contained" sx={{ mt: 3 }} onClick={onClickWebauthn2}>
              {t('login_with_webauthn')}
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export { default as AuthDrawerItem } from './AuthDrawerItem';

function stringToUint8Array(str: string) {
  const arr = [];
  for (let i = 0, j = str.length; i < j; ++i) {
    arr.push(str.charCodeAt(i));
  }

  const tmpUint8Array = new Uint8Array(arr);
  return tmpUint8Array;
}
