import { Logout } from '@mui/icons-material';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { useAuthStore } from './authSlice';
import { useI18n } from 'i18n';
import { useShallow } from 'zustand/react/shallow';

export default function AuthDrawerItem() {
  const logout = useAuthStore(useShallow(({ logout }) => logout));
  const t = useI18n();
  return (
    <ListItemButton onClick={() => logout()}>
      <ListItemIcon>
        <Logout />
      </ListItemIcon>
      <ListItemText>{t('logout')}</ListItemText>
    </ListItemButton>
  );
}
