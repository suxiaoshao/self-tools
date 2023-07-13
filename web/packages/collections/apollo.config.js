// eslint-disable-next-line @typescript-eslint/no-var-requires
const { resolve } = require('path');
module.exports = {
  client: {
    service: {
      name: 'collections-graphql',
      localSchemaFile: resolve(__dirname, './schema.graphql'),
    },
    excludes: ['./src/graphql.ts'],
    includes: ['./src/**/*.gql', '"./src/**/*.graphql"'],
  },
};
