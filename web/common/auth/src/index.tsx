import { Avatar, Box, Button, Container, TextField, Typography } from '@mui/material';
import { SubmitHandler, useForm } from 'react-hook-form';
import { LockOutlined } from '@mui/icons-material';
import { useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login, LoginForm, selectAuth, useAppDispatch, useAppSelector } from './authSlice';
import { useI18n } from 'i18n';

export { default as authReducer, login, logout } from './authSlice';

export { default as useLogin } from './useLogin';

export default function Login() {
  const { register, handleSubmit } = useForm<LoginForm>();
  const auth = useAppSelector(selectAuth);
  const dispatch = useAppDispatch();
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
  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    dispatch(login(data));
  };
  const t = useI18n();
  const onClickWebauthn = useCallback(async () => {
    const data = await navigator.credentials.create({
      publicKey: {
        challenge: stringToUint8Array('123'),
        rp: {
          name: 'self tool', // todo i18n
        },
        pubKeyCredParams: [
          {
            type: 'public-key',
            alg: -7,
          },
          {
            type: 'public-key',
            alg: -8,
          },
          {
            type: 'public-key',
            alg: -36,
          },
          {
            type: 'public-key',
            alg: -37,
          },
          {
            type: 'public-key',
            alg: -38,
          },
          {
            type: 'public-key',
            alg: -39,
          },
          {
            type: 'public-key',
            alg: -257,
          },
          {
            type: 'public-key',
            alg: -258,
          },
          {
            type: 'public-key',
            alg: -259,
          },
        ],
        user: {
          displayName: 'Admin', // todo i18n
          name: 'admin', // todo i18n
          id: stringToUint8Array(''),
        },
        timeout: 60000,
      },
    });
    console.log(data);
  }, []);
  return (
    <Box sx={{ width: '100%', height: '100%' }}>
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
              autoFocus
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
