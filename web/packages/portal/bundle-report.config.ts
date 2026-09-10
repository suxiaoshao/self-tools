import { relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';

const workspaceRoot = fileURLToPath(new URL('../../../', import.meta.url));
export function bundleReport(): Plugin {
  return {
    name: 'bundle-module-report',
    generateBundle(_options, bundle) {
      const chunks = Object.fromEntries(
        Object.values(bundle)
          .filter((output) => output.type === 'chunk')
          .map((chunk) => [
            chunk.fileName,
            {
              imports: chunk.imports,
              dynamicImports: chunk.dynamicImports,
              modules: Object.keys(chunk.modules).map((id) =>
                id.startsWith(workspaceRoot) ? relative(workspaceRoot, id) : id.replaceAll(workspaceRoot, ''),
              ),
            },
          ]),
      );
      this.emitFile({ type: 'asset', fileName: '.vite/modules.json', source: JSON.stringify(chunks, null, 2) });
    },
  };
}
