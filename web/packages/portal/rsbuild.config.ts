/*
 * @Author: suxiaoshao suxiaoshao@gamil.com
 * @Date: 2023-12-18 22:35:51
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-03-26 16:18:28
 */
import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { RsdoctorRspackPlugin } from '@rsdoctor/rspack-plugin';
import { pluginLightningcss } from '@rsbuild/plugin-lightningcss';
import { codeInspectorPlugin } from 'code-inspector-plugin';

export default defineConfig({
  plugins: [pluginReact(), pluginLightningcss()],
  server: {
    port: 3000,
  },
  output: {
    assetPrefix: 'https://sushao.top',
  },
  dev: {
    client: {
      port: '443',
    },
    assetPrefix: 'https://sushao.top',
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
      if (process.env.RSDOCTOR) {
        chain.plugin('rsdoctor').use(new RsdoctorRspackPlugin());
      }
      if (process.env.NODE_ENV === 'development') {
        chain.plugin('code-inspector').use(codeInspectorPlugin({ bundler: 'rspack' }));
      }
    },
  },
  moduleFederation: {
    options: {
      name: 'portal',
    },
  },
});
