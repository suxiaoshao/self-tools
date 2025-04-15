import { useEffect } from 'react';
import { useNavigate, useLocation, createSearchParams } from 'react-router-dom';
import { useAuthStore } from './authSlice';
import { useShallow } from 'zustand/react/shallow';

export default function useLogin() {
  const auth = useAuthStore(useShallow((state) => state.value));
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
