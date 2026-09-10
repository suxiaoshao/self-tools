import { describe, expect, it } from 'vitest';
import { devServer } from '../packages/portal/dev-server.config';

describe('development origin', () => {
  it('derives the public HMR connection from a single origin, keeping the listener local', () => {
    expect(devServer({ WEB_DEV_PORT: '3100', WEB_DEV_ORIGIN: 'https://staging.example:8443' })).toMatchObject({
      port: 3100,
      strictPort: true,
      origin: 'https://staging.example:8443',
      allowedHosts: ['staging.example'],
      hmr: { host: 'staging.example', clientPort: 8443, protocol: 'wss', port: 3100 },
    });
    expect(devServer({})).toEqual({ host: '0.0.0.0', port: 3000, strictPort: true });
  });
  it('rejects values outside the dev origin and port contract', () => {
    for (const origin of [
      'https://user:secret@example.com',
      'https://example.com/path',
      'https://example.com/?token=x',
      'https://example.com/#x',
      'file:///tmp',
    ])
      expect(() => devServer({ WEB_DEV_ORIGIN: origin })).toThrow('WEB_DEV_ORIGIN');
    for (const port of ['0', '65536', '3.5', 'NaN', ''])
      expect(() => devServer({ WEB_DEV_PORT: port })).toThrow('WEB_DEV_PORT');
  });
});
