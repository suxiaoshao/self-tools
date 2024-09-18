import { AnyAction, createSlice, Dispatch, PayloadAction, ThunkAction, ThunkDispatch } from '@reduxjs/toolkit';
import { enqueueSnackbar } from 'notify';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export interface AuthSliceType {
  value: string | null;
}

export const authSlice = createSlice({
  name: 'auth',
  initialState: {
    value: window.localStorage.getItem('auth'),
  } as AuthSliceType,
  reducers: {
    setAuth: (state, action: PayloadAction<string | null>) => {
      state.value = action.payload;
      if (action.payload === null) {
        window.localStorage.removeItem('auth');
      } else {
        window.localStorage.setItem('auth', action.payload);
      }
    },
    logout: (state) => {
      state.value = null;
      window.localStorage.removeItem('auth');
    },
  },
});

export type AppThunkAction<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;

export const { setAuth, logout } = authSlice.actions;

export interface LoginForm {
  username: string;
  password: string;
}

export const login =
  (data: LoginForm): AppThunkAction =>
  async (dispatch) => {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const request = new Request('https://auth.sushao.top/api/login', {
      mode: 'cors',
      credentials: 'include',
      method: 'POST',
      body: JSON.stringify(data),
      headers,
    });
    const response = await fetch(request);
    const auth = await response.json();
    if (auth.message) {
      enqueueSnackbar(auth.message, { variant: 'error' });
      return;
    }
    dispatch(setAuth(auth.data));
  };

// The function below is called a selector and allows us to select a value from
// the state. Selectors can also be defined inline where they're used instead of
// in the slice file. For example: `useSelector((state) => state.counter.value)`
export const selectAuth = (state: RootState) => state.auth.value;

export default authSlice.reducer;

export interface RootState {
  auth: AuthSliceType;
}
export type AppDispatch = ThunkDispatch<
  {
    auth: AuthSliceType;
  },
  undefined,
  AnyAction
> &
  Dispatch<AnyAction>;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
