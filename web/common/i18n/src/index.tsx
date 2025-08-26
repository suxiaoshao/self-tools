/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-07 04:50:32
 * @FilePath: /self-tools/web/common/i18n/src/index.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
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

// eslint-disable-next-line no-named-as-default-member
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

export { default as I18nDrawerItem } from './I18nDrawerItem';

export { default as i18next } from 'i18next';

export { default as i18n } from 'i18next';
