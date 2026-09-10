/** Public same-origin gateway paths; deployment hosts belong to the gateway. */
export const endpoints = Object.freeze({
  auth: '/api/auth/',
  bookmarksGraphql: '/api/bookmarks/graphql',
  collectionsGraphql: '/api/collections/graphql',
  imageProxy: '/fetch-content',
} as const);
