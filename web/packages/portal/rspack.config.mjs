/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2023-07-10 16:34:52
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-14 03:11:02
 * @FilePath: /tauri/Users/weijie.su/Documents/code/self/self-tools/web/packages/portal/rspack.config.ts
 */
import { defineConfig } from '@rspack/cli';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import HtmlPlugin from '@rspack/plugin-html';
export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

const isDevelopment = process.env.NODE_ENV !== 'production';

const config = defineConfig({
  entry: {
    main: './src/main.tsx',
  },
  output: {
    clean: isDevelopment ? false : true,
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset',
      },
      {
        test: /\.tsx?$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            sourceMap: true,
            jsc: {
              parser: {
                syntax: 'typescript',
                tsx: true,
              },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: isDevelopment,
                  refresh: isDevelopment,
                },
              },
            },
          },
        },
      },
    ],
  },
  devServer: {
    port: 3000,
    allowedHosts: 'all',
    historyApiFallback: true,
  },
  plugins: [
    ...(isDevelopment ? [new ReactRefreshPlugin()] : []),
    new HtmlPlugin.default({
      template: './index.html',
      chunks: ['main'],
    }),
  ],
  resolve: {
    tsConfig: {
      configFile: resolve(__dirname, '../../../tsconfig.json'),
      references: 'auto',
    },
  },
  experiments: {
    rspackFuture: {
      newResolver: true,
      disableTransformByDefault: true,
    },
  },
});
export default config;
