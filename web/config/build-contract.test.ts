import { describe, expect, it } from 'vitest';
import { measureBundle, type Budget } from './bundle-metrics.mts';
import { generatedDifferences } from './generated-files.mts';

const budget: Budget = {
  initialJsGzip: 10000,
  initialCssGzip: 10000,
  routeJsGzip: 10000,
  editorJsGzip: 10000,
  workerGzip: 10000,
  grammarGzip: 10000,
  totalGzip: 10000,
};
const manifest = {
  'index.html': { file: 'assets/main.js', isEntry: true, imports: ['shared', 'other'], css: ['assets/main.css'] },
  other: { file: 'assets/other.js', imports: ['shared'], css: ['assets/main.css'] },
  shared: { file: 'assets/shared.js', imports: ['other'] },
  lazy: { file: 'assets/editor.js' },
};
const modules = Object.fromEntries(
  ['main', 'other', 'shared', 'editor'].map((name) => [
    `assets/${name}.js`,
    { imports: [], dynamicImports: [], modules: [name] },
  ]),
);
const files = new Map(Object.values(manifest).map((entry) => [entry.file, new TextEncoder().encode(entry.file)]));
files.set('assets/main.css', new TextEncoder().encode('body {}'));

describe('production build contracts', () => {
  it('counts the static graph once despite diamonds and cycles, excludes dynamic-only assets', () => {
    const initial = measureBundle(manifest, modules, files, budget).initial;
    expect(initial.js.raw).toBe(['assets/main.js', 'assets/other.js', 'assets/shared.js'].join('').length);
    expect(initial.css.raw).toBe('body {}'.length);
    expect(measureBundle(manifest, modules, files, budget).failures).toEqual([]);
  });
  it('fails closed for missing manifest edges, outputs, module reports, and budgets', () => {
    expect(() =>
      measureBundle(
        { ...manifest, 'index.html': { ...manifest['index.html'], imports: ['missing'] } },
        modules,
        files,
        budget,
      ),
    ).toThrow('Missing manifest import');
    expect(() => measureBundle(manifest, modules, new Map(), budget)).toThrow('Missing build output');
    expect(() => measureBundle(manifest, {}, files, budget)).toThrow('Missing module report');
    expect(measureBundle(manifest, modules, files, { ...budget, initialJsGzip: 1 }).failures).toContainEqual(
      expect.stringContaining('Initial JS'),
    );
  });
  it('rejects heavy dependencies hidden in a shared initial chunk', () => {
    const report = {
      ...modules,
      'assets/shared.js': {
        imports: [],
        dynamicImports: [],
        modules: [
          'node_modules/monaco-editor/esm/editor.js',
          'web/packages/bookmarks/src/features/novel/list/index.tsx',
        ],
      },
    };
    expect(measureBundle(manifest, report, files, budget).failures).toHaveLength(2);
  });
  it('detects changed, added and removed generated files, including untracked additions', () => {
    const actual = new Map([
      ['same.ts', 'same'],
      ['changed.ts', 'old'],
      ['extra.ts', 'extra'],
    ]);
    const expected = new Map([
      ['same.ts', 'same'],
      ['changed.ts', 'new'],
      ['new.ts', 'new'],
    ]);
    expect(generatedDifferences(actual, expected)).toEqual(['changed.ts', 'extra.ts', 'new.ts']);
  });
});
