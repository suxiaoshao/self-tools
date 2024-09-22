import React, { useEffect, useMemo } from 'react';
import { createTheme, CssBaseline, ThemeProvider } from '@mui/material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css';
import setYouThemeToCssVars from './utils/cssVar';
import { colorSchemaMatch, selectActiveYouTheme, selectMuiTheme, useThemeStore } from './themeSlice';
import { match } from 'ts-pattern';
import { useShallow } from 'zustand/react/shallow';

export interface CustomThemeProps {
  children?: React.ReactNode;
}

export function CustomTheme({ children }: CustomThemeProps): JSX.Element {
  const { setSystemColorScheme, ...state } = useThemeStore(
    useShallow(({ setSystemColorScheme, color, colorSetting, systemColorScheme }) => ({
      color,
      colorSetting,
      systemColorScheme,
      setSystemColorScheme,
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
        <CssBaseline />
        {children}
      </ThemeProvider>
    ),
    [children, state],
  );
}

export { hexFromArgb } from '@material/material-color-utilities';

export { selectActiveYouTheme } from './themeSlice';

export { default as ThemeDrawerItem } from './components/ThemeDrawerItem';
