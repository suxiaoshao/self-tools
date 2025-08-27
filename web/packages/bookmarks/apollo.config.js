/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao 48886207+suxiaoshao@users.noreply.github.com
 * @LastEditTime: 2025-08-27 20:28:05
 * @FilePath: /self-tools/web/packages/bookmarks/apollo.config.js
 */
/* eslint-disable prefer-node-protocol */
const { resolve } = require('path');
module.exports = {
  client: {
    service: {
      name: 'bookmarks-graphql',
      localSchemaFile: resolve(__dirname, './schema.graphql'),
    },
    excludes: [],
    includes: ['./src/**/*.ts', './src/**/*.tsx'],
  },
};
