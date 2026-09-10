import type { ServerOptions } from 'vite';

export function devServer(env: Record<string, string | undefined>): ServerOptions {
  const rawPort = env.WEB_DEV_PORT ?? '3000';
  const port = Number(rawPort);
  if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('WEB_DEV_PORT must be a TCP port (1–65535)');
  const server: ServerOptions = { host: '0.0.0.0', port, strictPort: true };
  if (env.WEB_DEV_ORIGIN) {
    const origin = new URL(env.WEB_DEV_ORIGIN);
    if (
      !['http:', 'https:'].includes(origin.protocol) ||
      origin.username ||
      origin.password ||
      origin.pathname !== '/' ||
      origin.search ||
      origin.hash
    )
      throw new Error('WEB_DEV_ORIGIN must be an HTTP(S) origin without credentials, path, query or fragment');
    server.origin = origin.origin;
    server.allowedHosts = [origin.hostname];
    server.hmr = {
      host: origin.hostname,
      protocol: origin.protocol === 'https:' ? 'wss' : 'ws',
      clientPort: Number(origin.port || (origin.protocol === 'https:' ? 443 : 80)),
      port,
    };
  }
  return server;
}
