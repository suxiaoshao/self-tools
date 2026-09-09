import { fileURLToPath } from 'node:url';
import { checkWorkspaceBoundaries } from './workspace-boundaries.mts';

const failures = checkWorkspaceBoundaries(fileURLToPath(new URL('../../', import.meta.url)));
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Workspace dependency boundaries passed.');
}
