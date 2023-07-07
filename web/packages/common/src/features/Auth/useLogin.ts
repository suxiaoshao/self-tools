import { useEffect } from 'react';
import { useNavigate, useLocation, createSearchParams } from 'react-router-dom';
import { selectAuth, useAppSelector } from './authSlice';

export default function useLogin() {
  const auth = useAppSelector(selectAuth);
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
