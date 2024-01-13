/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-14 02:35:05
 * @FilePath: /self-tools/web/packages/portal/src/features/Menu/MenuItem.tsx
 */
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import RouterItem from '../../components/AppDrawer/RouterItem';
import { useState } from 'react';
import { Avatar, Collapse, List, ListItemButton, ListItemButtonProps, ListItemIcon, ListItemText } from '@mui/material';
import { I18nKey, useI18n } from 'i18n';
import { Menu } from 'types';

export interface MenuItemProps extends ListItemButtonProps {
  menu: Menu;
}

export default function MenuItem({ menu, ...props }: MenuItemProps) {
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
                <MenuItem sx={{ pl: 4 }} menu={item} key={item.name} />
              ))}
            </List>
          </Collapse>
        </>
      );
    case 'path':
      const path = menu.path.value.path;
      return (
        <RouterItem
          key={path}
          {...props}
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
