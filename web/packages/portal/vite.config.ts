import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { analyzer } from 'vite-bundle-analyzer';
import { codeInspectorPlugin } from 'code-inspector-plugin';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const isAnalyze = Boolean(process.env.RSDOCTOR);

export default defineConfig(({ command }) => {
  let base = '/';

  if (command === 'build') {
    base = 'https://sushao.top/';
  }

  const plugins = [
    tailwindcss({
      base: resolve(rootDir, '../../..'),
    }),
    analyzer({
      enabled: isAnalyze,
      analyzerMode: 'static',
      fileName: 'reports/vite-bundle-analyzer',
      openAnalyzer: false,
      summary: true,
    }),
  ];

  if (command === 'serve') {
    plugins.push(codeInspectorPlugin({ bundler: 'vite' }));
  }

  plugins.push(
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  );

  return {
    base,
    plugins,
    resolve: {
      alias: {
        '@portal': resolve(rootDir, './src'),
        '@bookmarks': resolve(rootDir, '../bookmarks/src'),
        '@collections': resolve(rootDir, '../collections/src'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
      origin: 'https://sushao.top',
      hmr: {
        host: 'sushao.top',
        clientPort: 443,
        port: 3000,
        protocol: 'wss',
      },
    },
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
    },
  };
});
