module.exports = {
  client: {
    service: {
      url: 'http://bookmarks.sushao.top/graphql',
      name: 'graphql',
      headers: {
        Authorization:
          'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJuYW1lIjoic3VzaGFvIiwicGFzc3dvcmQiOiJzdXNoYW8xMjMiLCJleHAiOjEwMDAwMDAwMDAwfQ.Ba4OIXTVHqLC5o5ignGj6t_qG-UKb-7vDgXHN7g10hw',
      },
    },
    excludes: ['./src/graphql/types.ts'],
    includes: ['./src/**/*.gql', '"./src/**/*.graphql"'],
  },
};
