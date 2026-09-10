import { endpoints } from 'runtime-config';
import { getClient } from 'custom-graphql';

export const apolloClient = getClient(endpoints.bookmarksGraphql);
