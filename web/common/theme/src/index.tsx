import React, { useEffect } from 'react';
import { CssBaseline, ThemeProvider, useMediaQuery } from '@mui/material';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css';
import { youTheme, YouThemeContext, youThemeToMuiTheme } from './youTheme';
import setYouThemeToCssVars from './cssVar';

export interface CustomThemeProps {
  children?: React.ReactNode;
}

export function CustomTheme({ children }: CustomThemeProps): JSX.Element {
  const isDark = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = React.useMemo(() => {
    const newTheme = youThemeToMuiTheme(youTheme, isDark ? 'dark' : 'light');
    return newTheme;
  }, [isDark]);
  useEffect(() => {
    setYouThemeToCssVars(youTheme.schemes[isDark ? 'dark' : 'light']);
  }, [isDark]);
  return (
    <YouThemeContext.Provider value={youTheme}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </YouThemeContext.Provider>
  );
}

export { YouThemeContext } from './youTheme';

export { hexFromArgb } from '@material/material-color-utilities';
