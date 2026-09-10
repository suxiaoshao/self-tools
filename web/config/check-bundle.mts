import { readFileSync, readdirSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { measureBundle, type Budget, type ManifestChunk, type ModuleChunk } from './bundle-metrics.mts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const directory = resolve(process.argv[2] ?? resolve(root, 'web/packages/portal/dist'));
const json = <T,>(file: string): T => JSON.parse(readFileSync(file, 'utf8'));
const files = new Map<string, Uint8Array>();
function visit(path: string) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = resolve(path, entry.name);
    if (entry.isDirectory()) visit(file);
    else files.set(relative(directory, file), readFileSync(file));
  }
}
visit(directory);
const report = measureBundle(
  json<Record<string, ManifestChunk>>(resolve(directory, '.vite/manifest.json')),
  json<Record<string, ModuleChunk>>(resolve(directory, '.vite/modules.json')),
  files,
  json<Budget>(resolve(root, 'web/config/bundle-budget.json')),
);
console.log(JSON.stringify(report, null, 2));
if (report.failures.length) throw new Error(report.failures.join('\n'));
