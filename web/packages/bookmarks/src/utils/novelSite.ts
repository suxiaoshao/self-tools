import { NovelSite } from '@bookmarks/graphql';
import { match } from 'ts-pattern';
import type { I18nKey } from 'web/common/i18n/src';

export function getLabelKeyBySite(novelSite: NovelSite): I18nKey {
  return match(novelSite)
    .with(NovelSite.Jjwxc, () => 'jjwxc' as const)
    .with(NovelSite.Qidian, () => 'qidian' as const)
    .exhaustive();
}
