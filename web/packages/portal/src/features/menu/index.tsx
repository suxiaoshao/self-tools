import { microConfigs } from '@portal/micro/index';
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
          subItem={false}
        />
      ))}
    </>
  );
}
