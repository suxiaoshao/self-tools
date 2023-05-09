import { Entry } from 'qiankun';
import { Enum } from 'types';

export interface MainAppConfig {
  apps: { name: string; configPath: string }[];
}

export interface AppConfig {
  name: string;
  menu: Menu[];
  activeRule: string;
  entry: Entry;
}

export type Menu = { name: string; path: Enum<'path', string> | Enum<'menu', Menu[]> };

export default {
  apps: [{ name: 'collections', configPath: 'https://collections.sushao.top/config.json' }],
} satisfies MainAppConfig;
