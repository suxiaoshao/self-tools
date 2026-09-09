// @vitest-environment node
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { checkWorkspaceBoundaries, moduleSpecifiers } from './workspace-boundaries.mts';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'workspace-boundaries-'));
  roots.push(root);
  const put = (path: string, value: object | string) => {
    const file = join(root, path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, typeof value === 'string' ? value : JSON.stringify(value));
  };
  put('package.json', { name: 'root' });
  put('tsconfig.json', { compilerOptions: { paths: { '@bookmarks/*': ['./web/packages/bookmarks/src/*'] } } });
  for (const [group, name] of [
    ['common', 'ui'],
    ['common', 'hooks'],
    ['packages', 'bookmarks'],
    ['packages', 'portal'],
  ]) {
    put(`web/${group}/${name}/package.json`, {
      name,
      exports: { '.': './src/index.ts' },
      dependencies: { ui: 'workspace:*', hooks: 'workspace:*', bookmarks: 'workspace:*' },
    });
    put(`web/${group}/${name}/src/index.ts`, 'export const value = 1;');
    put(`web/${group}/${name}/src/private.ts`, 'export const value = 1;');
  }
  return { root, put, check: () => checkWorkspaceBoundaries(root) };
}

describe('workspace ownership', () => {
  it('reads type imports, type queries, re-exports and literal dynamic imports without matching comments', () => {
    expect(
      moduleSpecifiers(
        'sample.ts',
        `
      // import 'fake';
      import type { X } from 'types-a';
      export type { Y } from 'types-b';
      export * from 'public-c';
      type Z = import('types-d').Z;
      const page = import('dynamic-e');
      const text = "import 'also-fake'";
    `,
      ),
    ).toEqual(['types-a', 'types-b', 'public-c', 'types-d', 'dynamic-e']);
    expect(() => moduleSpecifiers('sample.ts', 'const page = import(name)')).toThrow('literal import source');
  });

  it('allows portal composition and declared public package imports', () => {
    const f = fixture();
    f.put('web/packages/portal/src/index.ts', "import 'bookmarks'; import 'ui';");
    f.put('web/packages/bookmarks/src/index.ts', "import 'ui';");
    expect(f.check()).toEqual([]);
  });

  it.each([
    "import type { value } from '@bookmarks/private';",
    "export { value } from '../../../packages/bookmarks/src/private';",
    "const other = import('@bookmarks/private');",
    "type Other = import('../../../packages/bookmarks/src/private').value;",
  ])('rejects reverse application imports, including source path bypasses: %s', (source) => {
    const f = fixture();
    f.put('web/common/ui/src/index.ts', source);
    expect(f.check()).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Cross-workspace import must use package exports'),
        expect.stringContaining('Only portal may compose application packages'),
      ]),
    );
  });

  it('rejects unpublished subpaths and undeclared workspace dependencies', () => {
    const f = fixture();
    f.put('web/packages/bookmarks/package.json', { name: 'bookmarks', exports: { '.': './src/index.ts' } });
    f.put('web/packages/bookmarks/src/index.ts', "import 'ui/private';");
    expect(f.check()).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Undeclared dependency: ui'),
        expect.stringContaining('Not a public package export: ui/private'),
      ]),
    );
  });

  it('restricts peer features and layer direction while allowing page composition through public entries', () => {
    const f = fixture();
    f.put('web/packages/bookmarks/src/features/novel/index.ts', 'export const value = 1;');
    f.put('web/packages/bookmarks/src/features/novel/private.ts', 'export const value = 1;');
    f.put('web/packages/bookmarks/src/features/collection/index.ts', "import '../novel';");
    f.put('web/packages/bookmarks/src/pages/library.ts', "import '../features/novel/private';");
    f.put('web/packages/bookmarks/src/entities/collection/index.ts', "import '../../features/novel';");
    expect(f.check()).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Peer features must be composed by a page'),
        expect.stringContaining('Use the features/novel public entry'),
        expect.stringContaining('Entity must not depend on features'),
      ]),
    );
    f.put('web/packages/bookmarks/src/features/collection/index.ts', 'export const value = 1;');
    f.put('web/packages/bookmarks/src/entities/collection/index.ts', 'export const value = 1;');
    f.put(
      'web/packages/bookmarks/src/pages/library.ts',
      "import '../features/novel'; import '../entities/collection';",
    );
    expect(f.check()).toEqual([]);
  });

  it('does not exempt primitive folders, and detects common package cycles', () => {
    const f = fixture();
    f.put('web/common/ui/src/components/button.tsx', "export { value } from 'hooks';");
    f.put('web/common/ui/src/index.ts', "export { value } from './components/button';");
    f.put('web/common/hooks/src/index.ts', "export { value } from 'ui';");
    expect(f.check()).toContain('Workspace dependency cycle: hooks -> ui -> hooks');
  });

  it('rejects a reverse common layer even without a cycle', () => {
    const f = fixture();
    f.put('web/common/ui/src/index.ts', "import 'hooks';");
    expect(f.check()).toEqual([expect.stringContaining('outside its layer')]);
  });

  it('resolves package-local imports without exporting private implementation', () => {
    const f = fixture();
    f.put('web/common/ui/package.json', {
      name: 'ui',
      exports: { '.': './src/index.ts' },
      imports: { '#local/*': './src/*.ts' },
    });
    f.put('web/common/ui/src/index.ts', "export { value } from '#local/private';");
    expect(f.check()).toEqual([]);
  });
});
