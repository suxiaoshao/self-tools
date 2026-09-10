import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type PluginOption } from 'vite';
import { devServer } from './dev-server.config';
import { bundleReport } from './bundle-report.config';
import { prismAssets } from 'markdown/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { analyzer } from 'vite-bundle-analyzer';
import { codeInspectorPlugin } from 'code-inspector-plugin';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const isAnalyze = Boolean(process.env.RSDOCTOR);

export default defineConfig(({ command, mode }) => {
  const server = command === 'serve' ? devServer({ ...loadEnv(mode, rootDir, 'WEB_DEV_'), ...process.env }) : undefined;

  const plugins: PluginOption[] = [
    tailwindcss(),
    prismAssets(),
    bundleReport(),
    analyzer({
      enabled: isAnalyze,
      analyzerMode: 'static',
      fileName: 'reports/vite-bundle-analyzer',
      openAnalyzer: false,
      summary: true,
    }),
  ];

  if (command === 'serve' && mode !== 'test') {
    plugins.push(codeInspectorPlugin({ bundler: 'vite' }));
  }

  plugins.push(
    react(),
    babel({
      // The root test runner must resolve compiler plugins from their owning package.
      cwd: rootDir,
      include: /\.[jt]sx?$/,
      presets: [reactCompilerPreset()],
    }),
  );

  const config = {
    base: '/',
    build: { manifest: true },
    plugins,
    resolve: {
      tsconfigPaths: true,
    },
    server,
    preview: {
      host: '0.0.0.0',
      port: 3000,
      strictPort: true,
    },
    test: {
      environment: 'jsdom',
      globals: false,
      setupFiles: [resolve(rootDir, '../../config/test/testSetup.ts')],
    },
  };

  return config;
});
