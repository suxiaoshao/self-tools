import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@portal': path.resolve(rootDir, 'web/packages/portal/src'),
      '@bookmarks': path.resolve(rootDir, 'web/packages/bookmarks/src'),
      '@collections': path.resolve(rootDir, 'web/packages/collections/src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./web/config/test/testSetup.ts'],
  },
});
