import { ObjectType, RegistrableApp, registerMicroApps } from 'qiankun';
import { loadConfig } from './fetchConfig';
import store from '../app/store';
import { MenuItem, setMenu } from '../features/Menu/menuSlice';
export async function init() {
  const config = await loadConfig();
  const apps = config.map<RegistrableApp<ObjectType>>((app) => ({
    name: app.name,
    entry: app.entry,
    activeRule: app.activeRule,
    container: '#micro',
  }));
  registerMicroApps(apps);
  const menu = config.map<MenuItem>((app) => ({
    menu: { name: app.name, path: { tag: 'menu', value: app.menu } },
    parentsPath: app.activeRule,
  }));
  store.dispatch(setMenu(menu));
}
