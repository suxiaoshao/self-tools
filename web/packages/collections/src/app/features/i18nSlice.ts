import { PayloadAction, createSlice } from '@reduxjs/toolkit';
import { RootState } from '../store';

export type I18nSliceType = {
  value?: string;
};

function getInitData(): I18nSliceType {
  return {
    value: undefined,
  };
}

export const i18nSlice = createSlice({
  name: 'i18n',
  initialState: getInitData(),
  reducers: {
    setLang: (state, action: PayloadAction<string>) => {
      state.value = action.payload;
    },
  },
});
export const { setLang } = i18nSlice.actions;

export const SelectLang = (state: RootState) => state.i18n.value;
