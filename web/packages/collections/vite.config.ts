import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    checker({
      typescript: true,
      eslint: { lintCommand: 'eslint --config ../../../.eslintrc.js --ext .jsx --ext .js --ext .ts --ext .tsx .' },
    }),
  ],
  resolve: {
    alias: {
      '@collections': '/src',
    },
  },
});
