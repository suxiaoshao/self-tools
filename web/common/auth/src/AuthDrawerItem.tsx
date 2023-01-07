import { Logout } from '@mui/icons-material';
import { ListItemButton, ListItemIcon, ListItemText } from '@mui/material';
import { logout, useAppDispatch } from './authSlice';

export default function AuthDrawerItem() {
  const dispatch = useAppDispatch();
  return (
    <ListItemButton onClick={() => dispatch(logout())}>
      <ListItemIcon>
        <Logout />
      </ListItemIcon>
      <ListItemText>登出</ListItemText>
    </ListItemButton>
  );
}
