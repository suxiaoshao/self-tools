/*
 * @Author: suxiaoshao suxiaoshao@gamil.com
 * @Date: 2023-12-18 22:35:51
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-26 14:18:47
 */
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
// @ts-ignore
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';
import { resolve } from 'path';
export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 3000,
  },
  source: {
    entry: {
      index: './src/main.tsx',
    },
    alias: {
      '@portal': './src',
      '@bookmarks': '../bookmarks/src',
      '@collections': '../collections/src',
    },
  },
  tools: {
    bundlerChain: (chain) => {
      chain.plugin('monaco').use(MonacoWebpackPlugin);
    },
  },
});
