import { NovelSite } from '@bookmarks/gql/graphql';
import { match } from 'ts-pattern';
import type { I18nKey } from 'i18n';

export function getLabelKeyBySite(novelSite: NovelSite): I18nKey {
  return match(novelSite)
    .with(NovelSite.Jjwxc, () => 'jjwxc' as const)
    .with(NovelSite.Qidian, () => 'qidian' as const)
    .exhaustive();
}
