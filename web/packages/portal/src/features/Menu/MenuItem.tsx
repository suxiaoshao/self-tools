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
import { match } from 'ts-pattern';

export interface MenuItemProps extends ListItemButtonProps {
  menu: Menu;
}

export default function MenuItem({ menu, ...props }: MenuItemProps) {
  const [open, setOpen] = useState(false);
  const handleClick = () => {
    setOpen((value) => !value);
  };
  const t = useI18n();
  return match(menu)
    .with({ path: { tag: 'menu' } }, ({ path: { value } }) => (
      <>
        <ListItemButton {...props} onClick={handleClick}>
          <ListItemIcon>
            <Avatar sx={{ bgcolor: 'transparent' }}>{menu.icon}</Avatar>
          </ListItemIcon>
          <ListItemText primary={t(menu.name as I18nKey)} />
          {match(open)
            .with(true, () => <ExpandLess />)
            .with(false, () => <ExpandMore />)
            .otherwise(() => null)}
        </ListItemButton>
        <Collapse in={open} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {value.map((item) => (
              <MenuItem sx={{ pl: 4 }} menu={item} key={item.name} />
            ))}
          </List>
        </Collapse>
      </>
    ))
    .with({ path: { tag: 'path' } }, ({ path: { value } }) => {
      const path = value.path;
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
    })
    .otherwise(() => null);
}
