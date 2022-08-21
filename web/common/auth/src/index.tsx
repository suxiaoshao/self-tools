import { Avatar, Box, Button, Container, TextField, Typography } from '@mui/material';
import { SubmitHandler, useForm } from 'react-hook-form';
import { LockOutlined } from '@mui/icons-material';
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { login, LoginForm, selectAuth, useAppDispatch, useAppSelector } from './authSlice';

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
