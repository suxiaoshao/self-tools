import { defineConfig } from '@rspack/cli';

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
  module: {
    rules: [
      {
        test: /\.svg$/,
        type: 'asset',
      },
      {
        test: /\.worker$/,
        use: { loader: 'worker-loader' },
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
      },
    },
  },
  plugins: [],
});
export default config;
