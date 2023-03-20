import i18n, { Resource } from 'i18next';
import { useEffect, useMemo } from 'react';
import { initReactI18next, useTranslation } from 'react-i18next';
import { selectLang, useAppSelector } from './i18nSlice';
import en from './locales/en.json';
import zh from './locales/zh.json';

const resources = {
  en: {
    translation: en,
  },
  zh: {
    translation: zh,
  },
} satisfies Resource;

i18n.use(initReactI18next).init({
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
  const lang = useAppSelector(selectLang);
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

  return <>{children}</>;
}

export { default as i18nReducer } from './i18nSlice';

export function useI18n(): (key: keyof typeof en) => string {
  const trans = useTranslation();
  return useMemo(() => trans.t, [trans]);
}

export { default as I18nDrawerItem } from './I18nDrawerItem';

export { default as i18next } from 'i18next';
