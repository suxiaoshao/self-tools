import { type ReactNode, useEffect, useEffectEvent, useMemo } from 'react';
import './index.css';
import { colorSchemaMatch, selectColorMode, useThemeStore } from './themeSlice';
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
  const handleColorSchemaChange = useEffectEvent((e: MediaQueryListEvent) => {
    const colorScheme = match(e.matches)
      .with(true, () => 'dark' as const)
      .otherwise(() => 'light' as const);
    setSystemColorScheme(colorScheme);
  });
  useEffect(() => {
    const sign = new AbortController();
    colorSchemaMatch.addEventListener('change', handleColorSchemaChange, { signal: sign.signal });
    return () => {
      sign.abort();
    };
  }, []);
  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove('light', 'dark');

    root.classList.add(state.colorMode);
  }, [state.colorMode]);
  return useMemo(
    () => (
      <>
        <meta name="theme-color" content={state.color} />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="color-scheme" content={state.colorMode} />
        {children}
      </>
    ),
    [children, state],
  );
}

export { default as ThemeDrawerItem } from './components/ThemeDrawerItem';
