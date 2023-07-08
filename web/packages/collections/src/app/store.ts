import { AnyAction, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { themeSlice } from './features/themeSlice';
import { i18nSlice } from './features/i18nSlice';

const store = configureStore({
  reducer: {
    i18n: i18nSlice.reducer,
    theme: themeSlice.reducer,
  },
});
export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export type AppThunkAction<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;
