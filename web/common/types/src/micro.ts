import { ThemeOptions } from '@mui/material';

export interface MicroState {
  theme: MicroTheme;
  lang: string;
}

export type MicroTheme = Pick<ThemeOptions, 'palette'>;
