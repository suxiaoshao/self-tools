import { create } from 'zustand';
import { argbFromHex, themeFromSourceColor } from '@material/material-color-utilities';
import { youThemeToMuiTheme } from './utils/youTheme';
import { match } from 'ts-pattern';

export enum ColorSetting {
  dark = 'dark',
  light = 'light',
  system = 'system',
}

export interface ThemeSliceType {
  color: string;
  colorSetting: ColorSetting;
  systemColorScheme: 'light' | 'dark';
}

const getColorScheme = (
  colorSetting: ThemeSliceType['colorSetting'],
  systemColorScheme: ThemeSliceType['systemColorScheme'],
) => {
  if (colorSetting === 'system') {
    return systemColorScheme;
  }
  return colorSetting;
};

export const colorSchemaMatch = window.matchMedia('(prefers-color-scheme: dark)');

function getInitDate(): ThemeSliceType {
  const color = window.localStorage.getItem('color') ?? '#9cd67e';
  const colorSetting = (window.localStorage.getItem('colorSetting') ?? 'system') as ThemeSliceType['colorSetting'];
  const systemColorScheme = match(colorSchemaMatch.matches)
    .with(true, () => 'dark' as const)
    .otherwise(() => 'light' as const);
  window.localStorage.setItem('color', color);
  window.localStorage.setItem('colorSetting', colorSetting);
  return {
    color,
    colorSetting,
    systemColorScheme,
  };
}

export const useThemeStore = create<
  ThemeSliceType & {
    setSystemColorScheme: (scheme: ThemeSliceType['systemColorScheme']) => void;
    updateColor: (color: string, colorSetting: ColorSetting) => void;
  }
>((set) => ({
  ...getInitDate(),
  setSystemColorScheme: (scheme) => {
    set({ systemColorScheme: scheme });
  },
  updateColor: (color, colorSetting) => {
    window.localStorage.setItem('color', color);
    window.localStorage.setItem('colorSetting', colorSetting);
    set({ color, colorSetting });
  },
}));

export const selectColorMode = (state: Pick<ThemeSliceType, 'colorSetting' | 'systemColorScheme'>) =>
  getColorScheme(state.colorSetting, state.systemColorScheme);

export const selectActiveYouTheme = (state: ThemeSliceType) => {
  const colorScheme = selectColorMode(state);
  return themeFromSourceColor(argbFromHex(state.color)).schemes[colorScheme];
};

export const selectMuiTheme = (state: ThemeSliceType) => {
  const colorScheme = selectColorMode(state);
  const youTheme = selectActiveYouTheme(state);
  return youThemeToMuiTheme(youTheme, colorScheme);
};
