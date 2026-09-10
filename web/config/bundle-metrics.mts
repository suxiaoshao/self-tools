import { gzipSync } from 'node:zlib';

export interface ManifestChunk {
  file: string;
  isEntry?: boolean;
  imports?: string[];
  css?: string[];
}
export interface ModuleChunk {
  imports: string[];
  dynamicImports: string[];
  modules: string[];
}
export interface Budget {
  initialJsGzip: number;
  initialCssGzip: number;
  routeJsGzip: number;
  editorJsGzip: number;
  workerGzip: number;
  grammarGzip: number;
  totalGzip: number;
}

/** Vite imports are manifest keys, not output filenames. */
function staticClosure(manifest: Record<string, ManifestChunk>, roots: string[]) {
  const seen = new Set<string>();
  const js = new Set<string>();
  const css = new Set<string>();
  function visit(key: string) {
    if (seen.has(key)) return;
    const chunk = manifest[key];
    if (!chunk) throw new Error(`Missing manifest import: ${key}`);
    seen.add(key);
    js.add(chunk.file);
    chunk.css?.forEach((file) => css.add(file));
    chunk.imports?.forEach(visit);
  }
  roots.forEach(visit);
  return { js, css };
}

const forbidden =
  /(?:monaco-editor|prismjs\/components\/prism-|\?worker|web\/packages\/(?:bookmarks|collections)\/src\/(?:App\.tsx|pages\/|features\/[^/]+\/(?!index\.tsx?$)))/;
export function measureBundle(
  manifest: Record<string, ManifestChunk>,
  modules: Record<string, ModuleChunk>,
  files: Map<string, Uint8Array>,
  budget: Budget,
) {
  const entries = Object.entries(manifest)
    .filter(([, value]) => value.isEntry)
    .map(([key]) => key);
  if (!entries.length) throw new Error('No HTML entry in Vite manifest');
  const initial = staticClosure(manifest, entries);
  const sizes = new Map(
    [...files].map(([path, content]) => [path, { raw: content.byteLength, gzip: gzipSync(content).byteLength }]),
  );
  function sum(paths: Iterable<string>) {
    let raw = 0,
      gzip = 0;
    for (const path of paths) {
      const size = sizes.get(path);
      if (!size) throw new Error(`Missing build output: ${path}`);
      raw += size.raw;
      gzip += size.gzip;
    }
    return { raw, gzip };
  }
  const failures: string[] = [];
  function check(name: string, value: number, limit: number) {
    if (value > limit) failures.push(`${name}: ${value} > ${limit} gzip bytes`);
  }
  const js = sum(initial.js),
    css = sum(initial.css);
  check('Initial JS', js.gzip, budget.initialJsGzip);
  check('Initial CSS', css.gzip, budget.initialCssGzip);
  for (const file of initial.js) {
    if (!modules[file]) throw new Error(`Missing module report for ${file}`);
    for (const id of modules[file].modules)
      if (forbidden.test(id)) failures.push(`Initial dependency forbidden: ${id}`);
  }
  const chunks = Object.entries(manifest)
    .filter(([, chunk]) => /\.[cm]?js$/.test(chunk.file))
    .map(([key, chunk]) => {
      const closure = staticClosure(manifest, [key]);
      const size = sum([...closure.js].filter((file) => !initial.js.has(file)));
      const ids = modules[chunk.file]?.modules ?? [];
      const editor = ids.some((id) => id.includes('web/common/edit/src/MonacoEditor.tsx'));
      const route = ids.some((id) =>
        /web\/packages\/(?:bookmarks|collections)\/src\/(?:App\.tsx|pages\/|features\/[^/]+\/(?:list|details|fetch|view))/.test(
          id,
        ),
      );
      if (editor || route) check(key, size.gzip, editor ? budget.editorJsGzip : budget.routeJsGzip);
      return { key, file: chunk.file, ...size, kind: editor ? 'editor' : route ? 'route' : 'chunk' };
    });
  const workers = [...sizes]
    .filter(([path]) => /worker[^/]*\.js$/.test(path))
    .map(([file, size]) => {
      check(file, size.gzip, budget.workerGzip);
      return { file, ...size };
    });
  const grammars = [...sizes]
    .filter(([path]) => /assets\/prism-[^/]+\//.test(path))
    .map(([file, size]) => {
      check(file, size.gzip, budget.grammarGzip);
      return { file, ...size };
    });
  const total = sum([...files.keys()].filter((path) => !path.startsWith('.vite/')));
  check('Total assets', total.gzip, budget.totalGzip);
  return { initial: { js, css }, chunks, workers, grammars, total, failures };
}
