/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2023-07-10 16:34:52
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2023-11-13 18:49:44
 * @FilePath: /tauri/Users/weijie.su/Documents/code/self/self-tools/web/packages/bookmarks/rspack.config.mjs
 */
import { defineConfig } from '@rspack/cli';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { BannerPlugin, CopyRspackPlugin } from '@rspack/core';
import ReactRefreshPlugin from '@rspack/plugin-react-refresh';
import HtmlPlugin from '@rspack/plugin-html';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);

const isDevelopment = process.env.NODE_ENV !== 'production';

const config = defineConfig({
  entry: {
    main: './src/main.tsx',
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
    port: 3002,
    host: '0.0.0.0',
    allowedHosts: 'all',
    historyApiFallback: true,
    client: {
      webSocketURL: {
        port: 443,
        hostname: 'bookmarks.sushao.top',
        protocol: 'wss',
      },
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
  output: {
    // 开发环境设置 true 将会导致热更新失效
    clean: isDevelopment ? false : true,
    filename: '[name].[contenthash].js',
    chunkFilename: '[name].[contenthash].js',
    // 需要配置成 umd 规范
    libraryTarget: 'umd',
    // 修改不规范的代码格式，避免逃逸沙箱
    globalObject: 'window',
    publicPath: 'https://bookmarks.sushao.top/',
  },
  plugins: [
    ...(isDevelopment ? [new ReactRefreshPlugin()] : []),
    new HtmlPlugin.default({
      template: './index.html',
      chunks: ['main'],
    }),
    new BannerPlugin({ banner: 'Micro bookmarks' }),
    new CopyRspackPlugin({ patterns: [{ from: './public', to: './' }] }),
    new MonacoWebpackPlugin(),
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
