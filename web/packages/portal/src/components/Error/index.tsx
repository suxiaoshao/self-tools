import { useI18n } from 'i18n';
import { Link } from 'react-router';
import { buttonVariants } from 'ui/components/button';
import { FolderCode } from 'lucide-react';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from 'ui/components/empty';

export default function NotFound() {
  const t = useI18n();
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FolderCode />
        </EmptyMedia>
        <EmptyTitle>{t('not_found_title')}</EmptyTitle>
        <EmptyDescription>{t('not_found_description')}</EmptyDescription>
      </EmptyHeader>
      <Link className={buttonVariants()} to="/">
        {t('back_home')}
      </Link>
    </Empty>
  );
}
