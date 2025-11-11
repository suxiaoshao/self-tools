/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao 48886207+suxiaoshao@users.noreply.github.com
 * @LastEditTime: 2025-09-14 00:14:57
 * @FilePath: /self-tools/web/common/custom-graphql/src/index.tsx
 */
import { ApolloClient, InMemoryCache, ApolloLink, CombinedGraphQLErrors, CombinedProtocolErrors } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { toast } from 'sonner';

const getHttpLink = (url: string) =>
  new HttpLink({
    uri: String(url),
    credentials: 'include',
  });

/** 错误处理  */
const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, locations, path, extensions }) => {
      toast(message);
      // oxlint-disable-next-line no-console
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path} source: ${extensions?.['source']}`,
      );
    });
  } else if (CombinedProtocolErrors.is(error)) {
    error.errors.forEach(({ message, extensions }) => {
      toast(message);
      // eslint-disable-next-line no-console
      console.log(`[Protocol error]: Message: ${message}, Extensions: ${JSON.stringify(extensions)}`);
    });
  } else {
    toast(`网络错误:${error.message}`);
    // eslint-disable-next-line no-console
    console.log(`[Network error]: ${error}`);
  }
});

const authLink = new SetContextLink((prevContext) => {
  const token = window.localStorage.getItem('auth');
  // return the headers to the context so httpLink can read them
  return {
    headers: {
      ...prevContext.headers,
      authorization: token,
    },
  };
});

const defaultOptions: ApolloClient.DefaultOptions = {
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
    link: ApolloLink.from([errorLink, authLink, getHttpLink(url)]),
    cache: new InMemoryCache(),
    defaultOptions,
    devtools: {
      enabled: process.env.NODE_ENV === 'development',
    },
  });
