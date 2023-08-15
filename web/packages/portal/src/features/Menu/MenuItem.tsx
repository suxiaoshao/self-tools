import { ExpandLess, ExpandMore } from '@mui/icons-material';
import RouterItem from '../../components/AppDrawer/RouterItem';
import { Menu } from '../../micro/config';
import { useState } from 'react';
import { Avatar, Collapse, List, ListItemButton, ListItemButtonProps, ListItemIcon, ListItemText } from '@mui/material';
import { I18nKey, useI18n } from 'i18n';

export interface MenuItemProps extends ListItemButtonProps {
  menu: Menu;
  parentsPath?: string;
}

export default function MenuItem({ menu, parentsPath, ...props }: MenuItemProps) {
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    setOpen((value) => !value);
  };
  const t = useI18n();

  switch (menu.path.tag) {
    case 'menu':
      return (
        <>
          <ListItemButton {...props} onClick={handleClick}>
            <ListItemIcon>
              <Avatar sx={{ bgcolor: 'transparent' }}>{menu.icon}</Avatar>
            </ListItemIcon>
            <ListItemText primary={t(menu.name as I18nKey)} />
            {open ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {menu.path.value.map((item) => (
                <MenuItem sx={{ pl: 4 }} menu={item} key={item.name} parentsPath={parentsPath} />
              ))}
            </List>
          </Collapse>
        </>
      );
    case 'path':
      const path = parentsPath ? `${parentsPath}${menu.path.value}` : menu.path.value;
      return (
        <RouterItem
          {...props}
          key={path}
          icon={
            <ListItemIcon>
              <Avatar sx={{ bgcolor: 'transparent' }}>{menu.icon}</Avatar>
            </ListItemIcon>
          }
          matchPaths={[path]}
          text={t(menu.name as I18nKey)}
          toPath={path}
        ></RouterItem>
      );
    default:
      return null;
  }
}
