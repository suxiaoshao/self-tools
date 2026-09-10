const config = {
  projects: {
    bookmarks: {
      schema: './web/packages/bookmarks/schema.graphql',
      documents: './web/packages/bookmarks/src/**/*.graphql',
    },
    collections: {
      schema: './web/packages/collections/schema.graphql',
      documents: './web/packages/collections/src/**/*.graphql',
    },
  },
};

export default config;
