import type React from 'react';
import { ListItemButton, type ListItemButtonProps, ListItemIcon, ListItemText } from '@mui/material';
import { type To, useLocation, useNavigate } from 'react-router-dom';

export interface RouterItem extends ListItemButtonProps {
  matchPaths: (string | RegExp)[];
  toPath: To;
  text: React.ReactNode;
  icon: React.ReactNode;
  children?: React.ReactNode;
}
export default function RouterItem({ matchPaths, toPath, text, icon, children, ...props }: RouterItem) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  return (
    <ListItemButton
      {...props}
      selected={matchPaths.some((value) => {
        if (typeof value === 'string') {
          return value === pathname;
        }
        return value.test(pathname);
      })}
      onClick={() => {
        navigate(toPath);
      }}
    >
      <ListItemIcon>{icon}</ListItemIcon>
      <ListItemText primary={text} />
      {children}
    </ListItemButton>
  );
}
