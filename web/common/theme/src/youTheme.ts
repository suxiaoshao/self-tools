import { argbFromHex, themeFromSourceColor, Theme as YouTheme, hexFromArgb } from '@material/material-color-utilities';
import { createTheme, Theme as MuiTheme } from '@mui/material';
import { createContext } from 'react';

// Get the theme from a hex color
export const youTheme = themeFromSourceColor(argbFromHex('#9cd67e'));

export const YouThemeContext = createContext<YouTheme>(youTheme);

export function youThemeToMuiTheme(youTheme: YouTheme, mode: 'dark' | 'light' = 'light'): MuiTheme {
  const theme = youTheme.schemes[mode];
  return createTheme({
    palette: {
      mode,
      primary: {
        main: hexFromArgb(theme.primary),
        contrastText: hexFromArgb(theme.onPrimary),
      },
      secondary: {
        main: hexFromArgb(theme.secondary),
        contrastText: hexFromArgb(theme.onSecondary),
      },
      error: {
        main: hexFromArgb(theme.error),
        contrastText: hexFromArgb(theme.onError),
      },
      warning: {
        main: hexFromArgb(theme.tertiary),
        contrastText: hexFromArgb(theme.onTertiary),
      },
      info: {
        main: hexFromArgb(theme.tertiary),
        contrastText: hexFromArgb(theme.onTertiary),
      },
      background: {
        default: hexFromArgb(theme.background),
        paper: hexFromArgb(theme.surface),
      },
      text: {
        primary: hexFromArgb(theme.onBackground),
        secondary: hexFromArgb(theme.onSurface),
        disabled: hexFromArgb(theme.onSurfaceVariant),
      },
    },
  });
}
