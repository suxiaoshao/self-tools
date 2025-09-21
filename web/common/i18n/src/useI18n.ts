import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type en from './locales/en.json';
import type { TOptionsBase } from 'i18next';
import type { $Dictionary } from 'i18next/typescript/helpers';
export type I18nKey = keyof typeof en;

// oxlint-disable-next-line no-redundant-type-constituents
export function useI18n(): (key: I18nKey, options?: TOptionsBase & $Dictionary) => string {
  const trans = useTranslation();
  return useMemo(() => trans.t, [trans]);
}
