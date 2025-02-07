import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type en from './locales/en.json';
export type I18nKey = keyof typeof en;

export function useI18n(): (key: I18nKey) => string {
  const trans = useTranslation();
  return useMemo(() => trans.t, [trans]);
}
