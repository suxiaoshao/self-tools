import { loadConfig } from './fetchConfig';
import store from '../app/store';
import { MenuItem, setMenu } from '../features/Menu/menuSlice';
import Garfish, { interfaces } from 'garfish';
import { selectLang } from 'i18n/src/i18nSlice';
import { selectMuiTheme } from '@portal/features/Theme/themeSlice';
import { MicroState } from 'types';
export async function init() {
  // load config
  const config = await loadConfig();

  // init garfish
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
    props: getMicroState(),
  });

  // init menu
  const menu = config.map<MenuItem>((app) => ({
    menu: { name: app.name, path: { tag: 'menu', value: app.menu }, icon: app.icon },
    parentsPath: app.activeRule,
    icon: app.icon,
  }));
  store.dispatch(setMenu(menu));
  store.subscribe(() => {
    Garfish.channel.emit('propsChange', getMicroState());
  });
}

function getMicroState(): MicroState {
  const state = store.getState();
  return {
    theme: selectMuiTheme(state),
    lang: selectLang(state),
  };
}
