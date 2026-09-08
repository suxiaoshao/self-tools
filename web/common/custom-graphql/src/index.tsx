/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao 48886207+suxiaoshao@users.noreply.github.com
 * @LastEditTime: 2025-09-14 00:14:57
 * @FilePath: /self-tools/web/common/custom-graphql/src/index.tsx
 */
import { ApolloClient, InMemoryCache, ApolloLink, CombinedGraphQLErrors, CombinedProtocolErrors } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import { ErrorLink } from '@apollo/client/link/error';
import { toast } from 'sonner';

declare module '@apollo/client' {
  namespace ApolloClient {
    namespace DeclareDefaultOptions {
      interface WatchQuery {
        errorPolicy: 'ignore';
      }

      interface Query {
        errorPolicy: 'all';
      }
    }
  }
}

type AuthBoundary = { generation: () => number; unauthenticated: (requestGeneration: number) => void };
let authBoundary: AuthBoundary | undefined;
const clients = new Set<ApolloClient>();
const requests = new Set<AbortController>();
export function registerAuthBoundary(boundary: AuthBoundary): () => void {
  authBoundary = boundary;
  return () => {
    if (authBoundary === boundary) authBoundary = undefined;
  };
}
let stateVersion = 0;
const resetAuthenticated = new Set<() => void>();
export const authenticatedStateVersion = () => stateVersion;
export function registerAuthenticatedReset(reset: () => void): () => void {
  resetAuthenticated.add(reset);
  return () => {
    resetAuthenticated.delete(reset);
  };
}
export function clearAuthenticatedState(): void {
  stateVersion += 1;
  for (const reset of resetAuthenticated) reset();
  for (const controller of requests) controller.abort();
  requests.clear();
  for (const client of clients) void client.clearStore().catch(() => undefined);
}
const getHttpLink = (url: string) =>
  new HttpLink({
    uri: url,
    credentials: 'same-origin',
    headers: { 'X-Self-Tools-Request': '1' },
    fetch: async (input, init) => {
      const boundary = authBoundary;
      const generation = boundary?.generation();
      const controller = new AbortController();
      requests.add(controller);
      try {
        const signal = init?.signal ? AbortSignal.any([init.signal, controller.signal]) : controller.signal;
        const response = await fetch(input, { ...init, signal });
        if (response.status === 401 && generation !== undefined && authBoundary === boundary)
          boundary?.unauthenticated(generation);
        return response;
      } finally {
        requests.delete(controller);
      }
    },
  });

/** 错误处理  */
const errorLink = new ErrorLink(({ error }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, locations, path, extensions }) => {
      toast(message);
      let source = '';
      if (typeof extensions?.['source'] === 'string') {
        source = extensions['source'];
      } else {
        source = JSON.stringify(extensions?.['source'] ?? null);
      }
      console.log(
        `[GraphQL error]: Message: ${message}, Location: ${JSON.stringify(locations)}, Path: ${JSON.stringify(path)} source: ${source}`,
      );
    });
  } else if (CombinedProtocolErrors.is(error)) {
    error.errors.forEach(({ message, extensions }) => {
      toast(message);
      console.log(`[Protocol error]: Message: ${message}, Extensions: ${JSON.stringify(extensions)}`);
    });
  } else if (error.name !== 'AbortError') {
    toast(`网络错误:${error.message}`);
    console.log(`[Network error]: ${error.message}`);
  }
});

const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'ignore',
  },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
} as const;

export function getClient(url: string): ApolloClient {
  const client = new ApolloClient({
    link: ApolloLink.from([errorLink, getHttpLink(url)]),
    cache: new InMemoryCache(),
    defaultOptions,
    devtools: { enabled: process.env.NODE_ENV === 'development' },
  });
  clients.add(client);
  return client;
}
