import { loadConfig } from './fetchConfig';
import store from '../app/store';
import { MenuItem, setMenu } from '../features/Menu/menuSlice';
import { youThemeToMuiTheme } from '../features/Theme/utils/youTheme';
import Garfish, { interfaces } from 'garfish';
export async function init() {
  const config = await loadConfig();
  const apps = config.map<interfaces.AppInfo>((app) => ({
    name: app.name,
    entry: app.entry,
    activeWhen: app.activeRule,
  }));
  Garfish.run({
    apps,
    basename: '/',
    domGetter: () => document.getElementById('micro') as HTMLElement,
    sandbox: false,
  });
  const menu = config.map<MenuItem>((app) => ({
    menu: { name: app.name, path: { tag: 'menu', value: app.menu } },
    parentsPath: app.activeRule,
  }));
  store.dispatch(setMenu(menu));
}

export type MicroTheme = ReturnType<typeof youThemeToMuiTheme>;

export interface MicroState {
  theme: MicroTheme;
  lang: string;
}
