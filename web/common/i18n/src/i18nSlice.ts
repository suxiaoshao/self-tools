import { create } from 'zustand';

export enum LangMode {
  custom = 'custom',
  system = 'system',
}

export enum CustomLang {
  en = 'en',
  zh = 'zh',
}

interface I18nType {
  langMode: LangMode;
  customLang: CustomLang;
  systemLang: string;
}

interface I18nSliceType {
  value: I18nType;
  setLangSetting: (settings: Pick<I18nType, 'customLang' | 'langMode'>) => void;
}

export const getLang = (data: I18nType) => {
  if (data.langMode === 'custom') {
    return data.customLang;
  }
  return data.systemLang;
};

function getInitData(): I18nType {
  const langMode = window.localStorage.getItem('langMode') ?? 'system';
  const customLang = (window.localStorage.getItem('customLang') ?? 'en') as I18nType['customLang'];
  window.localStorage.setItem('langMode', langMode);
  window.localStorage.setItem('customLang', customLang);
  return {
    langMode: langMode as I18nType['langMode'],
    customLang,
    systemLang: navigator.language,
  };
}

export const useI18nStore = create<I18nSliceType>((set, get) => ({
  value: getInitData(),
  setLangSetting(settings: Pick<I18nType, 'customLang' | 'langMode'>) {
    const newState = {
      ...get().value,
      langMode: settings.langMode,
      customLang: settings.customLang,
    };
    if (settings.langMode === 'custom') {
      window.localStorage.setItem('langMode', 'custom');
      window.localStorage.setItem('customLang', settings.customLang);
    }
    if (settings.langMode === 'system') {
      window.localStorage.setItem('langMode', 'system');
    }
    set({ value: newState });
  },
}));
