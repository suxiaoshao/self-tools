import { cpSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { generatedDifferences, generatedFiles } from './generated-files.mts';

const root = fileURLToPath(new URL('../../', import.meta.url));
function run(command: string, args: string[], cwd: string, output: string) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: 'inherit',
    env: { ...process.env, GRAPHQL_OUTPUT_DIR: output },
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status})`);
}
function generate(directory: string, output: string) {
  run(resolve(directory, 'node_modules/.bin/graphql-codegen'), ['--config', 'codegen.ts'], directory, output + '/');
  run(
    resolve(root, 'node_modules/.bin/oxfmt'),
    ['--config', resolve(root, '.oxfmtrc.json'), output],
    directory,
    output,
  );
}
if (process.argv.includes('--check')) {
  for (const name of ['bookmarks', 'collections']) {
    const directory = resolve(root, 'web/packages', name);
    const output = mkdtempSync(join(tmpdir(), `self-tools-${name}-codegen-`));
    try {
      generate(directory, output);
      const differences = generatedDifferences(generatedFiles(resolve(directory, 'src/gql')), generatedFiles(output));
      if (differences.length)
        throw new Error(
          `${name}: generated files differ: ${differences.join(', ')}. Run pnpm --filter ${name} generate.`,
        );
    } finally {
      rmSync(output, { recursive: true, force: true });
    }
  }
} else {
  const directory = process.cwd();
  if (!['bookmarks', 'collections'].some((name) => directory === resolve(root, 'web/packages', name)))
    throw new Error('Run generate from a GraphQL package');
  const output = mkdtempSync(join(tmpdir(), 'self-tools-codegen-'));
  try {
    generate(directory, output);
    const destination = resolve(directory, 'src/gql');
    mkdirSync(destination, { recursive: true });
    const expected = generatedFiles(output);
    const obsolete = [...generatedFiles(destination).keys()].filter((file) => !expected.has(file));
    cpSync(output, destination, { recursive: true });
    for (const file of obsolete) rmSync(resolve(destination, file));
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
}
