import type { NovelStatus } from '@bookmarks/gql/graphql';
import type { I18nKey } from 'i18n';
import { match } from 'ts-pattern';

export function getLabelKeyByNovelStatus(status: NovelStatus): I18nKey {
  return match(status)
    .with('COMPLETED', () => 'completed' as const)
    .with('ONGOING', () => 'ongoing' as const)
    .with('PAUSED', () => 'paused' as const)
    .exhaustive();
}
