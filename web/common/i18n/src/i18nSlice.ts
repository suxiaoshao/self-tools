import { createSlice, EnhancedStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

export enum LangMode {
  custom = 'custom',
  system = 'system',
}

export enum CustomLang {
  en = 'en',
  zh = 'zh',
}

export type I18nSliceType = {
  langMode: LangMode;
  customLang: CustomLang;
  systemLang: string;
};
const getLang = (data: I18nSliceType) => {
  if (data.langMode === 'custom') {
    return data.customLang;
  }
  return data.systemLang;
};

function getInitData(): I18nSliceType {
  const langMode = window.localStorage.getItem('langMode') ?? 'system';
  const customLang = (window.localStorage.getItem('customLang') ?? 'en') as I18nSliceType['customLang'];
  window.localStorage.setItem('langMode', langMode);
  window.localStorage.setItem('customLang', customLang);
  return {
    langMode: langMode as I18nSliceType['langMode'],
    customLang,
    systemLang: navigator.language,
  };
}

export const i18nSlice = createSlice({
  name: 'i18n',
  initialState: getInitData(),
  reducers: {
    setLangSetting: (state, action: { payload: Pick<I18nSliceType, 'customLang' | 'langMode'> }) => {
      state.langMode = action.payload.langMode;
      state.customLang = action.payload.customLang;
      if (action.payload.langMode === 'custom') {
        window.localStorage.setItem('langMode', 'custom');
        window.localStorage.setItem('customLang', action.payload.customLang);
      }
      if (action.payload.langMode === 'system') {
        window.localStorage.setItem('langMode', 'system');
      }
    },
  },
});
export const { setLangSetting } = i18nSlice.actions;

export const selectLang = (state: RootState) => getLang(state.i18n);

type StoreType = EnhancedStore<{ i18n: I18nSliceType }>;

export default i18nSlice.reducer;
export type RootState = ReturnType<StoreType['getState']>;
export type AppDispatch = StoreType['dispatch'];
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
