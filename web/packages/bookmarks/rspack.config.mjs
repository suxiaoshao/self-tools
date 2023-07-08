import { defineConfig } from '@rspack/cli';
import { resolve } from 'path';

const isDevelopment = process.env.NODE_ENV !== 'production';

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
    banner: 'Micro bookmarks',
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
  resolve: {
    alias: {
      '@bookmarks': resolve(process.cwd(), './src'),
    },
  },
});
export default config;
