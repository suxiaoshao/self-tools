// @vitest-environment node
import { execFile } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { expect, it } from 'vitest';

const execFileAsync = promisify(execFile);

it('resolves the portal-owned React compiler independently of the caller directory', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'portal-compiler-'));
  const entry = join(directory, 'entry.tsx');
  writeFileSync(entry, 'export function Probe({ value }) { return <span>{value}</span>; }');
  // A fresh Node process avoids Vitest's module resolution and transform caches.
  const script = `
    import { build } from ${JSON.stringify(import.meta.resolve('vite'))};
    import portalConfig from ${JSON.stringify(new URL('./vite.config.ts', import.meta.url).href)};
    const result = await build({
      ...portalConfig({ command: 'build', mode: 'test' }),
      configFile: false,
      root: ${JSON.stringify(directory)},
      logLevel: 'silent',
      build: {
        write: false,
        minify: false,
        lib: { entry: ${JSON.stringify(entry)}, formats: ['es'] },
        rolldownOptions: { external: (id) => id.startsWith('react/') },
      },
    });
    for (const output of (Array.isArray(result) ? result : [result])) {
      for (const chunk of output.output) {
        if (chunk.type === 'chunk') process.stdout.write(chunk.code);
      }
    }
  `;
  try {
    const { stdout } = await execFileAsync('node', ['--input-type=module', '--eval', script], {
      cwd: directory,
    });
    expect(stdout).toContain('react/compiler-runtime');
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
