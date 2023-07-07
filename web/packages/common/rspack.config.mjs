import { defineConfig } from '@rspack/cli';
import { resolve } from 'path';

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
  },
  output: {
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
      '@common': resolve(process.cwd(), './src'),
    },
  },
});
export default config;
