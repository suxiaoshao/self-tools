import { NovelStatus } from '@bookmarks/graphql';
import type { I18nKey } from 'i18n';
import { match } from 'ts-pattern';

export function getLabelKeyByNovelStatus(status: NovelStatus): I18nKey {
  return match(status)
    .with(NovelStatus.Completed, () => 'completed' as const)
    .with(NovelStatus.Ongoing, () => 'ongoing' as const)
    .with(NovelStatus.Paused, () => 'paused' as const)
    .exhaustive();
}
