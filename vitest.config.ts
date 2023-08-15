import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./web/config/test/testSetup.ts'],
    coverage: {
      reporter: ['text'],
      provider: 'v8',
    },
  },
});
