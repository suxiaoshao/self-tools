import useTitle from '@bookmarks/hooks/useTitle';
import { Box } from '@mui/material';
import { useI18n } from 'i18n';

export default function Home() {
  const t = useI18n();
  useTitle(t('self_tools'));
  return <Box sx={{ width: '100%', height: '100%' }}>home</Box>;
}
