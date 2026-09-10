import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Plugin } from 'vite';
import { languages } from './languages.ts';

const require = createRequire(import.meta.url);
const prismRoot = dirname(require.resolve('prismjs/package.json'));
const { version } = JSON.parse(readFileSync(resolve(prismRoot, 'package.json'), 'utf8')) as { version: string };
const { languages: metadata } = JSON.parse(readFileSync(resolve(prismRoot, 'components.json'), 'utf8')) as {
  languages: Record<string, { require?: string | string[]; alias?: string | string[] }>;
};
const selected = new Set<string>();
function include(language: string) {
  if (selected.has(language)) return;
  selected.add(language);
  for (const dependency of [metadata[language]?.require ?? []].flat()) include(dependency);
}
languages.forEach(include);
const aliases = Object.fromEntries(
  [...selected].flatMap((language) =>
    [language, ...[metadata[language]?.alias ?? []].flat()].map((alias) => [alias, language]),
  ),
);
const prefix = `/assets/prism-${version}/`;
const assets = new Map(
  [...selected].map((language) => [
    `${prefix}prism-${language}.min.js`,
    readFileSync(resolve(prismRoot, `components/prism-${language}.min.js`)),
  ]),
);

export function prismAssets(): Plugin {
  return {
    name: 'local-prism-grammars',
    config() {
      return { define: { __PRISM_PATH__: JSON.stringify(prefix), __PRISM_ALIASES__: JSON.stringify(aliases) } };
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const body = assets.get((request.url ?? '').split('?')[0]);
        if (!body) return next();
        response.setHeader('Content-Type', 'text/javascript');
        response.end(body);
      });
    },
    generateBundle() {
      for (const [path, source] of assets) this.emitFile({ type: 'asset', fileName: path.slice(1), source });
    },
  };
}
