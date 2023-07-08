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
    banner: 'portal',
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
  resolve: {
    alias: {
      '@portal': resolve(process.cwd(), './src'),
    },
  },
});
export default config;
