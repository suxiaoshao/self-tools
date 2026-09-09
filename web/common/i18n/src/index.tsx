import i18n, { type Resource, changeLanguage } from 'i18next';
import { useEffect } from 'react';
import { initReactI18next } from 'react-i18next';
import { getLang, useI18nStore } from './i18nSlice';
import en from './locales/en.json';
import zh from './locales/zh.json';
import { useShallow } from 'zustand/react/shallow';

const resources = {
  en: {
    translation: en,
  },
  zh: {
    translation: zh,
  },
} satisfies Resource;

i18n.use(initReactI18next).init<typeof resources>({
  resources,
  lng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export interface I18nextProps {
  children: React.ReactNode;
}

export default function I18next({ children }: I18nextProps) {
  const lang = useI18nStore(useShallow((state) => getLang(state.value)));
  useEffect(() => {
    changeLanguage(lang);
  }, [lang]);

  return children;
}

export { type I18nKey, useI18n } from './useI18n';

export { useI18nStore, LangMode, CustomLang } from './i18nSlice';

export { default as i18n } from 'i18next';
