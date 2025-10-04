import { type ReactNode, useEffect, useMemo } from 'react';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css';
import setYouThemeToCssVars from './utils/cssVar';
import { colorSchemaMatch, selectActiveYouTheme, selectColorMode, selectMuiTheme, useThemeStore } from './themeSlice';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/react/shallow';

export interface CustomThemeProps {
  children?: ReactNode;
}

export function CustomTheme({ children }: CustomThemeProps) {
  const { setSystemColorScheme, ...state } = useThemeStore(
    useShallow(({ setSystemColorScheme, color, colorSetting, systemColorScheme }) => ({
      color,
      colorSetting,
      systemColorScheme,
      setSystemColorScheme,
      colorMode: selectColorMode({ colorSetting, systemColorScheme }),
    })),
  );

  useEffect(() => {
    setYouThemeToCssVars(selectActiveYouTheme(state));
  }, [state]);
  useEffect(() => {
    const sign = new AbortController();
    colorSchemaMatch.addEventListener(
      'change',
      (e) => {
        const colorScheme = match(e.matches)
          .with(true, () => 'dark' as const)
          .otherwise(() => 'light' as const);
        setSystemColorScheme(colorScheme);
      },
      { signal: sign.signal },
    );
    return () => {
      sign.abort();
    };
  }, [setSystemColorScheme]);
  return useMemo(
    () => (
      <ThemeProvider theme={createTheme(selectMuiTheme(state))}>
        <meta name="theme-color" content={state.color} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="color-scheme" content={state.colorMode} />
        <CssBaseline />
        {children}
      </ThemeProvider>
    ),
    [children, state],
  );
}

export { default as ThemeDrawerItem } from './components/ThemeDrawerItem';
