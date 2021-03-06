import { ApolloClient, createHttpLink, from, InMemoryCache } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { enqueueSnackbar } from 'notify';
import { setContext } from '@apollo/client/link/context';

const httpLink = createHttpLink({
  uri: String(import.meta.env.VITE_GRAPHQL_URL ?? 'http://bookmarks.sushao.top/graphql'),
  credentials: 'include',
});

/** 错误处理  */
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      enqueueSnackbar(message);
      console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}
source: ${extensions['source']}`);
    });
  }
  if (networkError) {
    enqueueSnackbar(`网络错误:${networkError.message}`);
    console.log(`[Network error]: ${networkError}`);
  }
});

const authLink = setContext((_, { headers }) => {
  const token = window.localStorage.getItem('auth');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...headers,
      authorization: token,
    },
  };
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
});
