import { useI18n } from 'i18n';
import { PageToolbar } from 'ui/page-toolbar';

export default function Home() {
  const t = useI18n();

  return (
    <div className="flex min-h-0 size-full flex-col">
      <title>{t('self_tools')}</title>
      <PageToolbar>
        <h1 className="font-medium">{t('home')}</h1>
      </PageToolbar>
    </div>
  );
}
