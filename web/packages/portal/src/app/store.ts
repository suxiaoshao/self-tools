import { AnyAction, configureStore, ThunkAction } from '@reduxjs/toolkit';
import { authReducer } from '@portal/features/Auth';
import { themeReducer } from '@portal/features/Theme';

const store = configureStore({
  reducer: {
    auth: authReducer,
    theme: themeReducer,
  },
});
export default store;

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
// Inferred type: {posts: PostsState, comments: CommentsState, users: UsersState}
export type AppDispatch = typeof store.dispatch;

export type AppThunkAction<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;
