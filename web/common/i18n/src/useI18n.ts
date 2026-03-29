import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type en from './locales/en.json';
import type { TOptionsBase } from 'i18next';
export type I18nKey = keyof typeof en;

// oxlint-disable-next-line no-redundant-type-constituents
export function useI18n(): (key: I18nKey, options?: TOptionsBase & Record<string, unknown>) => string {
  const trans = useTranslation();
  const t = trans.t as unknown as (key: string, options?: TOptionsBase & Record<string, unknown>) => string;

  return useMemo(() => (key: I18nKey, options?: TOptionsBase & Record<string, unknown>) => t(key, options), [t]);
}
