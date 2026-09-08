/*
 * @Author: suxiaoshao suxiaoshao@gmail.com
 * @Date: 2024-01-06 01:30:13
 * @LastEditors: suxiaoshao 48886207+suxiaoshao@users.noreply.github.com
 * @LastEditTime: 2025-09-14 00:14:57
 * @FilePath: /self-tools/web/common/custom-graphql/src/index.tsx
 */
import { ApolloClient, InMemoryCache, CombinedGraphQLErrors } from '@apollo/client';
import { HttpLink } from '@apollo/client/link/http';
import {
  decodePublicError,
  decodeRequestId,
  fetchFailure,
  normalizeRequestFailure,
  publicHttpStatus,
  RequestError,
  type RequestFailure,
} from 'request-errors';

declare module '@apollo/client' {
  namespace ApolloClient {
    namespace DeclareDefaultOptions {
      interface Mutate {
        errorPolicy: 'none';
      }

      interface WatchQuery {
        errorPolicy: 'all';
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
export const authenticatedStateVersion = () => stateVersion;
export function clearAuthenticatedState(): void {
  stateVersion += 1;
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
        const signal = AbortSignal.any([
          controller.signal,
          AbortSignal.timeout(30_000),
          ...(init?.signal ? [init.signal] : []),
        ]);
        let response: Response;
        try {
          response = await fetch(input, { ...init, signal });
        } catch (error) {
          throw fetchFailure(error, signal);
        }
        const requestId = decodeRequestId(response.headers.get('x-request-id'));
        const protocol = () => new RequestError({ kind: 'protocol', requestId });
        let payload: unknown;
        try {
          payload = await response.clone().json();
        } catch (error) {
          if (signal.aborted) throw fetchFailure(error, signal);
          throw protocol();
        }
        if (signal.aborted || (generation !== undefined && boundary?.generation() !== generation))
          throw new RequestError({ kind: 'cancelled' });
        if (!response.ok) {
          const error =
            payload && typeof payload === 'object' && 'error' in payload ? decodePublicError(payload.error) : undefined;
          if (
            !error ||
            publicHttpStatus(error.code) !== response.status ||
            (requestId && error.requestId !== requestId)
          )
            throw protocol();
          if (error.code === 'UNAUTHENTICATED' && generation !== undefined && authBoundary === boundary)
            boundary?.unauthenticated(generation);
          throw new RequestError({ kind: 'public', error });
        }
        if (payload && typeof payload === 'object' && 'errors' in payload && Array.isArray(payload.errors)) {
          for (const entry of payload.errors) {
            const error =
              entry && typeof entry === 'object' && 'extensions' in entry
                ? decodePublicError(entry.extensions)
                : undefined;
            if (
              error?.code === 'UNAUTHENTICATED' &&
              (!requestId || requestId === error.requestId) &&
              generation !== undefined &&
              authBoundary === boundary
            ) {
              boundary?.unauthenticated(generation);
              throw new RequestError({ kind: 'public', error });
            }
          }
        }
        return response;
      } finally {
        requests.delete(controller);
      }
    },
  });

export interface GraphQLFailure {
  failure: RequestFailure;
  path?: readonly (string | number)[];
}
/** Safe local projections retain GraphQL paths for partial-query rendering. */
export function graphQLFailures(error: unknown): GraphQLFailure[] {
  if (CombinedGraphQLErrors.is(error))
    return error.errors.map((entry) => {
      const publicError = decodePublicError(entry.extensions);
      return { failure: publicError ? { kind: 'public', error: publicError } : { kind: 'protocol' }, path: entry.path };
    });
  return error ? [{ failure: normalizeRequestFailure(error) }] : [];
}

const defaultOptions = {
  watchQuery: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
  mutate: { errorPolicy: 'none' },
  query: {
    fetchPolicy: 'no-cache',
    errorPolicy: 'all',
  },
} as const;

export function getClient(url: string): ApolloClient {
  const client = new ApolloClient({
    link: getHttpLink(url),
    cache: new InMemoryCache(),
    defaultOptions,
    devtools: { enabled: process.env.NODE_ENV === 'development' },
  });
  clients.add(client);
  return client;
}

export * from './feedback';
