import { readdir } from 'node:fs/promises';
import { relative, resolve, sep } from 'node:path';
import { PROOF_HOST } from './current-host-contract.mjs';

export function publishedFoundryPath(relativePath) {
  if (typeof relativePath !== 'string' || !relativePath ||
    relativePath.includes('\\') || relativePath.split('/').some(x => !x || x === '.' || x === '..')) {
    throw new Error('Unsafe generated Foundry path: ' + relativePath);
  }
  if (relativePath === 'index.html') return 'foundry/index.html';
  if (relativePath === 'deployment.json') return 'foundry/deployment.json';
  return relativePath;
}
export async function enumerateFoundry(root) {
  const foundryRoot = resolve(root, 'dist/foundry');
  const files = [];
  async function walk(folder) {
    const children = await readdir(folder, { withFileTypes:true });
    for (const child of children) {
      const path = resolve(folder, child.name);
      if (child.isDirectory()) await walk(path);
      else if (child.isFile()) {
        const rel = relative(foundryRoot, path).split(sep).join('/');
        const publishedPath = publishedFoundryPath(rel);
        files.push({ generatedPath: 'dist/foundry/' + rel, publishedPath,
          url: PROOF_HOST + '/' + publishedPath });
      } else throw new Error('Non-regular Foundry artifact refused: ' + path);
    }
  }
  await walk(foundryRoot);
  const names = files.map(x => x.publishedPath);
  if (new Set(names).size !== names.length) throw new Error('Generated Foundry maps two assets to one Pages destination');
  files.sort((a,b) => a.publishedPath.localeCompare(b.publishedPath));
  return files;
}
export function checkWholeFoundryParity(assets, declared) {
  const problems = [];
  const actual = (assets || []).map(x => x.publishedPath).sort();
  const wanted = (declared || []).map(x => x.publishedPath).sort();
  if (!actual.length || actual.length !== wanted.length ||
      JSON.stringify(actual) !== JSON.stringify(wanted) ||
      new Set(actual).size !== actual.length) {
    problems.push('complete exact-set Foundry artifact manifest mismatch');
  }
  for (const asset of assets || []) {
    if (asset.liveStatus !== 200) problems.push('missing live asset ' + asset.publishedPath);
    if (!asset.localSha256 || asset.localSha256 !== asset.pagesSha256 ||
        asset.pagesSha256 !== asset.liveSha256) {
      problems.push('local/Pages/live byte mismatch ' + asset.publishedPath);
    }
  }
  return problems;
}
