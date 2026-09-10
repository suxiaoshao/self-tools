import { type ReactNode, useEffect } from 'react';
import { ThemeProvider, useTheme } from 'next-themes';
import { useColorStore } from './themeSlice';

function ThemeMetadata() {
  const color = useColorStore((state) => state.color);
  const { theme, setTheme } = useTheme();
  useEffect(() => {
    if (theme && !['light', 'dark', 'system'].includes(theme)) setTheme('system');
  }, [theme, setTheme]);
  return (
    <>
      <meta name="theme-color" content={color} />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    </>
  );
}

export function CustomTheme({ children }: { children?: ReactNode }) {
  return (
    <ThemeProvider attribute="class" storageKey="colorSetting" defaultTheme="system">
      <ThemeMetadata />
      {children}
    </ThemeProvider>
  );
}
