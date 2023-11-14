/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2023-07-10 16:34:52
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2023-11-13 18:33:10
 * @FilePath: /tauri/Users/weijie.su/Documents/code/self/self-tools/web/packages/portal/rspack.config.ts
 */
import { defineConfig } from '@rspack/cli';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BannerPlugin } from '@rspack/core';
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
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    publicPath: 'https://sushao.top/',
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
    host: '0.0.0.0',
    allowedHosts: 'all',
    historyApiFallback: true,
    client: {
      webSocketURL: {
        port: 443,
        hostname: 'sushao.top',
        protocol: 'wss',
      },
    },
  },
  plugins: [
    ...(isDevelopment ? [new ReactRefreshPlugin()] : []),
    new HtmlPlugin.default({
      template: './index.html',
      chunks: ['main'],
    }),
    new BannerPlugin({ banner: 'portal' }),
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
