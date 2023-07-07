import { defineConfig } from '@rspack/cli';
import { resolve } from 'path';

const packageName = 'collections';

const config = defineConfig({
  entry: {
    main: './src/main.tsx',
  },
  builtins: {
    html: [
      {
        template: './index.html',
      },
    ],
    copy: { patterns: [{ from: './public', to: './' }] },
  },
  output: {
    library: `${packageName}-[name]`,
    libraryTarget: 'umd',
    jsonpFunction: `webpackJsonp_${packageName}`,
    publicPath: 'https://collections.sushao.top/',
  },
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset',
      },
    ],
  },
  devServer: {
    port: 3001,
    host: '0.0.0.0',
    allowedHosts: 'all',
    historyApiFallback: true,
    client: {
      webSocketURL: {
        port: 443,
        hostname: 'collections.sushao.top',
        protocol: 'wss',
      },
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
  plugins: [],
  resolve: {
    alias: {
      '@collections': resolve(process.cwd(), './src'),
    },
  },
});
export default config;
