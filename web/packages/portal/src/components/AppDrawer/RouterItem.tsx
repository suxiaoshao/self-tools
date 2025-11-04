import type React from 'react';
import { type To, useLocation, useNavigate } from 'react-router-dom';
import { SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';

export interface RouterItem extends React.ComponentProps<'li'> {
  matchPaths: (string | RegExp)[];
  toPath: To;
  text: React.ReactNode;
  icon: React.ReactNode;
  children?: React.ReactNode;
  subItem: boolean;
}
export default function RouterItem({ matchPaths, toPath, text, icon, children, subItem, ...props }: RouterItem) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const selected = matchPaths.some((value) => {
    if (typeof value === 'string') {
      return value === pathname;
    }
    return value.test(pathname);
  });
  if (subItem) {
    return (
      <SidebarMenuItem {...props}>
        <SidebarMenuButton
          isActive={selected}
          onClick={() => {
            navigate(toPath);
          }}
        >
          {icon}
          <span>{text}</span>
          {children}
        </SidebarMenuButton>
      </SidebarMenuItem>
    );
  }
  return (
    <SidebarMenuItem {...props}>
      <SidebarMenuButton
        isActive={selected}
        onClick={() => {
          navigate(toPath);
        }}
      >
        {icon}
        <span>{text}</span>
        {children}
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
