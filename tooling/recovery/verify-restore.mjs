import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const validators = [
  'validate-foundation.mjs',
  'validate-spec-architecture.mjs',
  'validate-schemas.mjs',
  'validate-component-preview-contract.mjs',
  'validate-studio-contract.mjs',
  'validate-studio-theme-package.mjs',
  'validate-studio-runtime.mjs',
  'validate-migration.mjs',
  'validate-core-tokens.mjs',
  'validate-core-components.mjs',
  'validate-flavors.mjs',
  'validate-theme-resolution.mjs',
  'validate-hardline-theme.mjs',
  'validate-soft-theme.mjs',
  'validate-rivet-theme.mjs',
  'validate-mono-theme.mjs',
  'validate-pulse-theme.mjs',
  'validate-theme-status-contrast.mjs',
  'validate-reduced-motion.mjs'
];

function execute(label, command, args) {
  process.stdout.write('\n[RESTORE-QUALITY] ' + label + '\n');
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error('Local restore quality failed: ' + label);
}

for (const filename of validators) {
  execute(filename, process.execPath, ['tooling/validators/' + filename]);
}
const builds = [
  'tooling/foundry/build.mjs',
  'tooling/foundry/assemble-component-previews.mjs',
  'tooling/foundry/assemble-soft-dark.mjs',
  'tooling/foundry/assemble-rivet-dark.mjs',
  'tooling/foundry/assemble-mono-dark.mjs',
  'tooling/foundry/assemble-pulse-dark.mjs',
  'tooling/studio/build.mjs'
];
for (const filename of builds) execute(filename, process.execPath, [filename]);
console.log('\n[RESTORE-QUALITY] PASS: 19 local validators and both generated builds.');
console.log('[RESTORE-QUALITY] NOT COVERED: historical public-proof/live-evidence binding or browser tests.');
console.log('[RESTORE-QUALITY] Run full browser and Studio suites before manual publication; Actions must stay disabled.');
