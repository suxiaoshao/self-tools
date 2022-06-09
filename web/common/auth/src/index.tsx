import { Avatar, Box, Button, Container, TextField, Typography } from '@mui/material';
import { SubmitHandler, useForm } from 'react-hook-form';
import { LockOutlined } from '@mui/icons-material';
import { atom, useAtom } from 'jotai';
import { useEffect } from 'react';
import { createSearchParams, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

const innerAuthAtom = atom<string | null>(window.localStorage.getItem('auth'));
export const authAtom = atom(
  (get) => get(innerAuthAtom),
  async (_get, set, data: LoginForm) => {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const request = new Request('http://auth.sushao.top/api/login', {
      mode: 'cors',
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });
    const response = await fetch(request);
    const auth = await response.json();
    window.localStorage.setItem('auth', auth.data);
    return set(innerAuthAtom, auth.data);
  },
);
interface LoginForm {
  username: string;
  password: string;
}

export function useLogin() {
  const [auth] = useAtom(authAtom);
  const navigate = useNavigate();
  const { pathname, search, hash } = useLocation();

  useEffect(() => {
    if (auth === null) {
      const url = pathname + search + hash;
      if (pathname !== '/login') {
        navigate({ pathname: '/login', search: createSearchParams({ from: url }).toString() });
      }
    }
  }, [auth, hash, navigate, pathname, search]);
}

export default function Login() {
  const { register, handleSubmit } = useForm<LoginForm>();
  const [auth, setAuth] = useAtom(authAtom);
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
    setAuth(data);
  };
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
            登录
          </Typography>
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="用户名"
              autoComplete="username"
              autoFocus
              {...register('username', { required: true })}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="密码"
              type="password"
              id="password"
              autoComplete="current-password"
              {...register('password', { required: true })}
            />
            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              登录
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
