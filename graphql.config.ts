const config = {
  projects: {
    bookmarks: {
      schema: './web/packages/bookmarks/schema.graphql',
      documents: './web/packages/bookmarks/src/**/*.{ts,tsx}',
      extensions: {
        endpoints: {
          'GraphQL schema': {
            url: 'https://bookmarks.sushao.top/graphql',
            headers: {
              Authorization: process.env.AUTH_TOKEN_ENV ?? '',
              'user-agent': 'JS GraphQL',
            },
            introspect: false,
          },
        },
      },
    },
    collections: {
      schema: './web/packages/collections/schema.graphql',
      documents: './web/packages/collections/src/**/*.{ts,tsx}',
      extensions: {
        endpoints: {
          'GraphQL schema': {
            url: 'https://collections.sushao.top/graphql',
            headers: {
              Authorization: process.env.AUTH_TOKEN_ENV ?? '',
              'user-agent': 'JS GraphQL',
            },
            introspect: false,
          },
        },
      },
    },
  },
};

export default config;
