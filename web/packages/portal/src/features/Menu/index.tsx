/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-14 02:59:37
 * @FilePath: /self-tools/web/packages/portal/src/features/Menu/index.tsx
 */
import { microConfigs } from '@portal/micro';
import MenuItem from './MenuItem';
export default function DrawerMenu() {
  return (
    <>
      {microConfigs.map((item) => (
        <MenuItem
          key={item.getActiveRule()}
          menu={{
            name: item.getName(),
            icon: item.getIcon(),
            path: {
              tag: 'menu',
              value: item.getMenu(),
            },
          }}
        />
      ))}
    </>
  );
}
