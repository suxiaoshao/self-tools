import useTitle from '@bookmarks/hooks/useTitle';
import { useI18n } from 'i18n';

export default function Home() {
  const t = useI18n();
  useTitle(t('self_tools'));
  return <div className="size-full">home</div>;
}
