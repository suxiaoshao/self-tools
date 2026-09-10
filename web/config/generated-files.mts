import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';

export function generatedFiles(directory: string): Map<string, string> {
  const result = new Map<string, string>();
  function visit(path: string) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const file = join(path, entry.name);
      if (entry.isDirectory()) visit(file);
      else result.set(relative(directory, file), readFileSync(file, 'utf8'));
    }
  }
  visit(directory);
  return result;
}
export function generatedDifferences(actual: Map<string, string>, expected: Map<string, string>): string[] {
  return [...new Set([...actual.keys(), ...expected.keys()])]
    .filter((file) => actual.get(file) !== expected.get(file))
    .sort();
}
