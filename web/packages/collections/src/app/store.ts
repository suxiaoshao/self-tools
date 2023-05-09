import { AnyAction, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { i18nReducer } from 'i18n';
import { themeSlice } from './features/themeSlice';

const store = configureStore({
  reducer: {
    i18n: i18nReducer,
    theme: themeSlice.reducer,
  },
});
export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export type AppThunkAction<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;
