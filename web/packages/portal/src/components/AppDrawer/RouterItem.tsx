import type React from 'react';
import { type To, useLocation, Link } from 'react-router-dom';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSubButton, SidebarMenuSubItem } from '../ui/sidebar';

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
  const selected = matchPaths.some((value) => {
    if (typeof value === 'string') {
      return value === pathname;
    }
    return value.test(pathname);
  });
  if (subItem) {
    return (
      <SidebarMenuSubItem {...props}>
        <SidebarMenuSubButton asChild isActive={selected}>
          <Link to={toPath}>
            {icon}
            <span>{text}</span>
            {children}
          </Link>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    );
  }
  return (
    <SidebarMenuItem {...props}>
      <SidebarMenuButton isActive={selected} asChild>
        <Link to={toPath}>
          {icon}
          <span>{text}</span>
          {children}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
