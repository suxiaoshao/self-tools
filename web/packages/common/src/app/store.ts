import { AnyAction, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { authReducer } from 'auth';
import { themeReducer } from 'theme';
import { i18nReducer } from 'i18n';

const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
    i18n: i18nReducer,
  },
});
export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export type AppThunkAction<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;
