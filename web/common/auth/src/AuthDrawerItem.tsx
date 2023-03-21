import { Logout } from '@mui/icons-material';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { logout, useAppDispatch } from './authSlice';
import { useI18n } from 'i18n';

export default function AuthDrawerItem() {
  const dispatch = useAppDispatch();
  const t = useI18n();
  return (
    <ListItemButton onClick={() => dispatch(logout())}>
      <ListItemIcon>
        <Logout />
      </ListItemIcon>
      <ListItemText>{t('logout')}</ListItemText>
    </ListItemButton>
  );
}
