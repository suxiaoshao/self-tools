/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao suxiaoshao@gmail.com
 * @LastEditTime: 2024-01-07 05:21:31
 * @FilePath: /self-tools/web/packages/collections/apollo.config.js
 */

/* eslint-disable */
const { resolve } = require('path');
module.exports = {
  client: {
    service: {
      name: 'collections-graphql',
      localSchemaFile: resolve(__dirname, './schema.graphql'),
    },
    excludes: ['./src/graphql.ts'],
    includes: ['./src/**/*.ts', './src/**/*.tsx'],
  },
};
