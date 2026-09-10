import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { parseSync, Visitor } from 'oxc-parser';

interface Manifest {
  name: string;
  exports?: Record<string, string>;
  imports?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
}

interface Workspace {
  directory: string;
  manifest: Manifest;
  application: boolean;
}

const commonDependencies: Record<string, readonly string[]> = {
  'runtime-config': [],
  ui: [],
  hooks: [],
  i18n: [],
  time: [],
  types: [],
  'request-errors': [],
  'custom-graphql': ['request-errors', 'i18n'],
  'custom-table': ['ui', 'hooks', 'i18n', 'time'],
  details: ['ui', 'hooks', 'i18n', 'time'],
  edit: ['ui', 'hooks', 'i18n', 'time'],
  markdown: ['ui', 'hooks', 'i18n', 'time'],
  'collection-tree': ['ui', 'hooks', 'i18n', 'time'],
};

const inside = (parent: string, child: string) => child === parent || child.startsWith(parent + sep);
const packageName = (specifier: string) =>
  specifier
    .split('/')
    .slice(0, specifier.startsWith('@') ? 2 : 1)
    .join('/');
const readJson = <T,>(file: string): T => JSON.parse(readFileSync(file, 'utf8'));

function files(directory: string): string[] {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if (['node_modules', 'dist'].includes(entry.name)) return [];
    const file = resolve(directory, entry.name);
    return entry.isDirectory() ? files(file) : /\.[cm]?[jt]sx?$/.test(entry.name) ? [file] : [];
  });
}

function resolveSource(file: string): string | undefined {
  const candidates = [file, ...['.ts', '.tsx', '.js', '.jsx', '.json'].map((extension) => file + extension)];
  if (['.js', '.jsx', '.mjs'].includes(extname(file))) candidates.push(file.replace(/\.[^.]+$/, '.ts'));
  for (const candidate of [...candidates, resolve(file, 'index.ts'), resolve(file, 'index.tsx')]) {
    if (existsSync(candidate) && statSync(candidate).isFile()) return candidate;
  }
}

/** Includes type imports and re-exports: they still create ownership dependencies. */
export function moduleSpecifiers(file: string, source: string): string[] {
  const parsed = parseSync(file, source);
  if (parsed.errors.length) throw new Error(parsed.errors.map((error) => error.message).join('; '));
  const specifiers = new Set<string>();
  const visitor = new Visitor({
    ImportDeclaration: (node) => specifiers.add(node.source.value),
    ExportAllDeclaration: (node) => specifiers.add(node.source.value),
    ExportNamedDeclaration: (node) => {
      if (node.source) specifiers.add(node.source.value);
    },
    TSImportType: (node) => specifiers.add(node.source.value),
    ImportExpression: (node) => {
      if (node.source.type === 'Literal' && typeof node.source.value === 'string') {
        specifiers.add(node.source.value);
      } else {
        throw new Error('Use a literal import source so the workspace boundary can be checked');
      }
    },
  });
  visitor.visit(parsed.program);
  return [...specifiers];
}

function layer(workspace: Workspace, file: string) {
  const [kind, owner] = relative(resolve(workspace.directory, 'src'), file).split(sep);
  return { kind, owner };
}

/** Checks resolved local paths as well as package exports, independently of lint ignore patterns. */
export function checkWorkspaceBoundaries(root: string): string[] {
  const workspaces: Workspace[] = ['common', 'packages'].flatMap((group) => {
    const parent = resolve(root, 'web', group);
    if (!existsSync(parent)) return [];
    return readdirSync(parent).flatMap((name) => {
      const directory = resolve(parent, name);
      const manifestFile = resolve(directory, 'package.json');
      return existsSync(manifestFile)
        ? [{ directory, manifest: readJson<Manifest>(manifestFile), application: group === 'packages' }]
        : [];
    });
  });
  const byName = new Map(workspaces.map((workspace) => [workspace.manifest.name, workspace]));
  const rootManifest = readJson<Manifest>(resolve(root, 'package.json'));
  const paths =
    readJson<{ compilerOptions: { paths?: Record<string, string[]> } }>(resolve(root, 'tsconfig.json')).compilerOptions
      .paths ?? {};
  const issues: string[] = [];
  const graph = new Map(workspaces.map(({ manifest }) => [manifest.name, new Set<string>()]));
  for (const workspace of workspaces) {
    for (const file of files(workspace.directory)) {
      const report = (message: string) => issues.push(`${relative(root, file)}: ${message}`);
      let specifiers: string[];
      try {
        specifiers = moduleSpecifiers(file, readFileSync(file, 'utf8'));
      } catch (error) {
        report(String(error));
        continue;
      }
      const tooling = /(?:\.test\.|\.config\.|\/codegen\.)/.test(file);
      const declared = {
        ...workspace.manifest.dependencies,
        ...workspace.manifest.peerDependencies,
        ...(tooling ? { ...rootManifest.devDependencies, ...workspace.manifest.devDependencies } : {}),
      };
      for (const rawSpecifier of specifiers) {
        const specifier = rawSpecifier.split('?')[0]!;
        if (specifier.startsWith('node:')) continue;
        let target: string | undefined;
        let viaPackage = false;
        if (specifier.startsWith('.')) {
          target = resolveSource(resolve(dirname(file), specifier));
        } else if (specifier.startsWith('#')) {
          const entry = Object.entries(workspace.manifest.imports ?? {}).find(([pattern]) =>
            pattern.includes('*') ? specifier.startsWith(pattern.split('*')[0]!) : specifier === pattern,
          );
          if (entry) {
            const [pattern, value] = entry;
            const replacement = pattern.includes('*') ? specifier.slice(pattern.indexOf('*')) : '';
            target = resolveSource(resolve(workspace.directory, value.replace('*', replacement)));
          }
        } else {
          const alias = Object.entries(paths).find(([pattern]) =>
            pattern.endsWith('*') ? specifier.startsWith(pattern.slice(0, -1)) : specifier === pattern,
          );
          if (alias) {
            const [pattern, targets] = alias;
            const replacement = pattern.endsWith('*') ? specifier.slice(pattern.length - 1) : '';
            target = resolveSource(resolve(root, targets[0]!.replace('*', replacement)));
          } else {
            const dependencyName = packageName(specifier);
            const dependency = byName.get(dependencyName);
            if (dependencyName !== workspace.manifest.name && !(dependencyName in declared)) {
              report(`Undeclared dependency: ${dependencyName} (${rawSpecifier})`);
            }
            if (!dependency) continue;
            viaPackage = true;
            const subpath = specifier === dependencyName ? '.' : '.' + specifier.slice(dependencyName.length);
            const pattern = Object.entries(dependency.manifest.exports ?? {}).find(
              ([key]) => key.endsWith('*') && subpath.startsWith(key.slice(0, -1)),
            );
            const exported =
              dependency.manifest.exports?.[subpath] ??
              (pattern && !subpath.split('/').includes('..')
                ? pattern[1].replace('*', subpath.slice(pattern[0].length - 1))
                : undefined);
            if (typeof exported !== 'string') {
              report(`Not a public package export: ${rawSpecifier}`);
              continue;
            }
            target = resolveSource(resolve(dependency.directory, exported));
          }
        }
        if (!target) {
          report(`Unresolved workspace source: ${rawSpecifier}`);
          continue;
        }
        const owner = workspaces.find((candidate) => inside(candidate.directory, target));
        if (!owner) {
          if (!tooling) report(`Runtime source outside its workspace: ${rawSpecifier}`);
          continue;
        }
        if (owner !== workspace) {
          graph.get(workspace.manifest.name)!.add(owner.manifest.name);
          if (
            !workspace.application &&
            !owner.application &&
            !commonDependencies[workspace.manifest.name]?.includes(owner.manifest.name)
          ) {
            report(`Common package dependency is outside its layer: ${rawSpecifier}`);
          }
          if (!viaPackage) report(`Cross-workspace import must use package exports: ${rawSpecifier}`);
          if (owner.application && workspace.manifest.name !== 'portal') {
            report(`Only portal may compose application packages: ${rawSpecifier}`);
          }
        } else if (workspace.application) {
          const from = layer(workspace, file);
          const to = layer(workspace, target);
          if (from.kind === 'entities' && ['features', 'pages'].includes(to.kind)) {
            report(`Entity must not depend on ${to.kind}: ${rawSpecifier}`);
          }
          if (from.kind === 'features' && to.kind === 'pages')
            report(`Feature must not depend on pages: ${rawSpecifier}`);
          if (from.kind === 'features' && to.kind === 'features' && from.owner !== to.owner) {
            report(`Peer features must be composed by a page: ${rawSpecifier}`);
          }
          if (
            ['features', 'entities'].includes(to.kind) &&
            (from.kind !== to.kind || from.owner !== to.owner) &&
            !/^index\.[jt]sx?$/.test(relative(resolve(owner.directory, 'src', to.kind, to.owner!), target))
          ) {
            report(`Use the ${to.kind}/${to.owner} public entry: ${rawSpecifier}`);
          }
        }
      }
    }
  }
  const visited = new Set<string>();
  function visit(name: string, ancestors: string[]) {
    if (ancestors.includes(name)) {
      issues.push(`Workspace dependency cycle: ${[...ancestors, name].join(' -> ')}`);
      return;
    }
    if (visited.has(name)) return;
    visited.add(name);
    for (const dependency of graph.get(name) ?? []) visit(dependency, [...ancestors, name]);
  }
  for (const name of graph.keys()) visit(name, []);
  return issues;
}
