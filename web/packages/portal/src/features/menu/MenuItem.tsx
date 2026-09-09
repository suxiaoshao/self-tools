import RouterListItem from '../../components/AppDrawer/RouterItem';
import { type I18nKey, useI18n } from 'i18n';
import type { Menu } from 'types';
import { match } from 'ts-pattern';
import { SidebarMenuButton, SidebarMenuItem, SidebarMenuSub } from 'ui/components/sidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui/components/collapsible';
import { ChevronRight } from 'lucide-react';

interface MenuItemProps extends React.ComponentProps<'li'> {
  menu: Menu;
  subItem: boolean;
}

export default function MenuItem({ menu, subItem, ...props }: MenuItemProps) {
  const t = useI18n();
  return match(menu)
    .with({ path: { tag: 'menu' } }, ({ path: { value } }) => (
      <Collapsible defaultOpen className="group/collapsible">
        <SidebarMenuItem {...props}>
          <CollapsibleTrigger render={<SidebarMenuButton />}>
            {menu.icon}
            <span>{t(menu.name as I18nKey)}</span>
            <ChevronRight className="transition-transform ml-auto group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarMenuItem>
        <CollapsibleContent>
          <SidebarMenuSub>
            {value.map((item) => (
              <MenuItem subItem menu={item} key={item.name} />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    ))
    .with({ path: { tag: 'path' } }, ({ path: { value } }) => {
      const path = value.path;
      return (
        <RouterListItem
          subItem={subItem}
          key={path}
          {...props}
          icon={menu.icon}
          matchPaths={[path]}
          text={t(menu.name as I18nKey)}
          toPath={path}
        />
      );
    })
    .otherwise(() => null);
}
