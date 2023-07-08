import { useAppSelector } from '../../app/hooks';
import { selectMenu } from './menuSlice';
import MenuItem from './MenuItem';

export default function DrawerMenu() {
  const menu = useAppSelector(selectMenu);
  return (
    <>
      {menu.map((item) => (
        <MenuItem key={item.parentsPath} menu={item.menu} parentsPath={item.parentsPath} />
      ))}
    </>
  );
}
