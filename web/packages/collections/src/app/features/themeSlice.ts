import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { MicroTheme } from 'common';
import { RootState } from '../store';

export type ThemeSliceType = {
  value?: MicroTheme | undefined;
};

function getInitData(): ThemeSliceType {
  return {
    value: undefined,
  };
}

export const themeSlice = createSlice({
  name: 'i18n',
  initialState: getInitData(),
  reducers: {
    setTheme: (state, action: PayloadAction<MicroTheme>) => {
      state.value = action.payload;
    },
  },
});
export const { setTheme } = themeSlice.actions;

export const SelectTheme = (state: RootState) => state.theme.value;
