import { ApolloClient, createHttpLink, DefaultOptions, from, InMemoryCache } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { enqueueSnackbar } from 'notify';
import { setContext } from '@apollo/client/link/context';

const getHttpLink = (url: string) =>
  createHttpLink({
    uri: String(url),
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

const defaultOptions: DefaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
};

export const getClient = (url: string) =>
  new ApolloClient({
    link: from([errorLink, authLink, getHttpLink(url)]),
    cache: new InMemoryCache(),
    defaultOptions,
  });
