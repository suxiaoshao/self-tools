import { MicroAppStateActions, ObjectType, RegistrableApp, initGlobalState, registerMicroApps } from 'qiankun';
import { loadConfig } from './fetchConfig';
import store from '../app/store';
import { MenuItem, setMenu } from '../features/Menu/menuSlice';
import { selectMuiTheme } from 'theme/src/themeSlice';
import { youThemeToMuiTheme } from 'theme/src/youTheme';
export async function init() {
  const config = await loadConfig();
  const apps = config.map<RegistrableApp<ObjectType>>((app) => ({
    name: app.name,
    entry: app.entry,
    activeRule: app.activeRule,
    container: '#micro',
    props: { state: getMicroState() },
  }));
  registerMicroApps(apps);
  const menu = config.map<MenuItem>((app) => ({
    menu: { name: app.name, path: { tag: 'menu', value: app.menu } },
    parentsPath: app.activeRule,
  }));
  store.dispatch(setMenu(menu));
}
export const actions: MicroAppStateActions = initGlobalState(getMicroState());
store.subscribe(() => {
  actions.setGlobalState(getMicroState());
});

export type MicroTheme = ReturnType<typeof youThemeToMuiTheme>;

export interface MicroState {
  theme: MicroTheme;
}

function getMicroState(): MicroState {
  const state = store.getState();
  return {
    theme: selectMuiTheme(state),
  };
}
