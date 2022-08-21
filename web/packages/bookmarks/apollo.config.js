module.exports = {
  client: {
    service: {
      name: 'graphql',
      localSchemaFile: './web/packages/bookmarks/schema.graphql',
    },
    excludes: ['./src/graphql.ts'],
    includes: ['./src/**/*.gql', '"./src/**/*.graphql"'],
  },
};
