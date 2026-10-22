import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[core-components] ${message}`); };
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));

const registryPath = resolve(root, 'packages/core/component-registry.json');
const registry = await readJson(registryPath);
const tokens = await readJson(resolve(root, 'spec/core/token-contracts.json'));
const tokenIds = new Set(tokens.contracts.map((entry) => entry.id));

if (registry.schema !== 'neosmartui/component-registry@1') fail('unexpected registry schema');
if (registry.domain !== 'core') fail('Core registry domain must be core');
if (!Array.isArray(registry.components)) fail('Core registry components must be an array');
const maturityCounts = registry.components.reduce((counts, entry) => {
  counts[entry.maturity] = (counts[entry.maturity] ?? 0) + 1;
  return counts;
}, {});
if (registry.components.length !== 50) fail('DescriptionList implementation cohort must contain exactly 50 honest registry entries');
if (maturityCounts['public-proof'] !== 50) fail('Current-host v2 cohort must admit exactly 50 public-proof Core components');
if ((maturityCounts.implemented ?? 0) !== 0) fail('v2 current-host cohort must not leave implemented-but-unproven Core components');
if ((maturityCounts['contract-only'] ?? 0) !== 0) fail('DescriptionList implementation cohort must contain no remaining contract-only Core entries');

const ids = new Set();
for (const entry of registry.components) {
  if (!/^core\.[a-z][a-z0-9-]*$/.test(entry.id)) fail(`invalid Core component id ${entry.id}`);
  if (ids.has(entry.id)) fail(`duplicate component id ${entry.id}`);
  ids.add(entry.id);
  const contractPath = resolve(dirname(registryPath), entry.contract);
  await access(contractPath);
  const contract = await readJson(contractPath);
  if (contract.schema !== 'neosmartui/component@1') fail(`${entry.id} has wrong component schema`);
  if (contract.id !== entry.id || contract.domain !== 'core' || contract.layer !== 'component') fail(`${entry.id} identity mismatch`);
  if (/(commerce|saas|cart|product|checkout|plan|seat)/.test(JSON.stringify({id: contract.id, intent: contract.intent}))) fail(`${entry.id} leaked business-domain semantics into Core`);
  if (!Array.isArray(contract.dependencies)) fail(`${entry.id} dependencies must be an array`);
  for (const dependency of contract.dependencies) if (!tokenIds.has(dependency)) fail(`${entry.id} references unknown token ${dependency}`);
  for (const support of ['keyboard', 'touch', 'rtl', 'reducedMotion', 'forcedColors']) if (contract.supports[support] !== true) fail(`${entry.id} must declare ${support} support`);

  if (entry.maturity === 'contract-only') {
    if (entry.evidence.implementation !== null || entry.evidence.publicProof !== null) fail(`${entry.id} contract-only evidence must remain null`);
  } else {
    if (!entry.evidence.implementation) fail(`${entry.id} implementation claim lacks evidence`);
    await access(resolve(root, entry.evidence.implementation));
    if (entry.maturity === 'implemented' && entry.evidence.publicProof !== null) fail(`${entry.id} implemented maturity must not claim public proof`);
    if (entry.maturity === 'public-proof' && !entry.evidence.publicProof) fail(`${entry.id} public-proof claim lacks evidence`);
  }
}

const a2Contracts = {
  'core.label': ['rest', 'disabled'],
  'core.button-group': ['rest'],
  'core.input-group': ['rest', 'focus-within', 'invalid', 'disabled'],
  'core.number-field': ['rest', 'hover', 'focus-visible', 'pressed', 'empty', 'filled', 'invalid', 'read-only', 'disabled'],
  'core.toggle': ['rest', 'hover', 'focus-visible', 'pressed', 'off', 'on', 'disabled'],
  'core.toggle-group': ['rest', 'none-selected', 'selected', 'disabled'],
  'core.slider': ['rest', 'hover', 'focus-visible', 'pressed', 'disabled'],
  'core.progress': ['rest', 'determinate', 'indeterminate', 'complete'],
  'core.spinner': ['active'],
  'core.separator': ['rest']
};
const provenA2 = new Map([
  ['core.label', 'packages/adapters/web/components/label.css'],
  ['core.progress', 'packages/adapters/web/components/progress.css'],
  ['core.spinner', 'packages/adapters/web/components/spinner.css'],
  ['core.separator', 'packages/adapters/web/components/separator.css']
]);
const groupedControls = new Map([
  ['core.button-group', 'packages/adapters/web/components/button-group.css'],
  ['core.input-group', 'packages/adapters/web/components/input-group.css']
]);
const toggleControls = new Map([
  ['core.toggle', 'packages/adapters/web/components/toggle.mjs'],
  ['core.toggle-group', 'packages/adapters/web/components/toggle-group.mjs']
]);
const valueControls = new Map([
  ['core.number-field', 'packages/adapters/web/components/number-field.mjs'],
  ['core.slider', 'packages/adapters/web/components/slider.mjs']
]);
for (const [id, expectedStates] of Object.entries(a2Contracts)) {
  const entry = registry.components.find((candidate) => candidate.id === id);
  if (!entry) fail(`${id} must remain registered`);
  const slug = id.split('.')[1];
  const contract = await readJson(resolve(root, `packages/core/components/${slug}.json`));
  if (contract.states.join('|') !== expectedStates.join('|')) fail(`${id} state contract drifted`);
  const docs = await readFile(resolve(root, `packages/core/components/${slug}.md`), 'utf8');

  if (provenA2.has(id)) {
    if (entry.maturity !== 'public-proof') fail(`${id} must remain public-proof after the first Core proof promotion`);
    if (entry.evidence.implementation !== provenA2.get(id) || entry.evidence.publicProof !== `evidence/public/${id}.json`) fail(`${id} public-proof evidence boundary is invalid`);
    await access(resolve(root, entry.evidence.implementation));
    await access(resolve(root, entry.evidence.publicProof));
    for (const marker of ['## Semantic boundary', 'Maturity is `public-proof`']) if (!docs.includes(marker)) fail(`${slug}.md missing public-proof marker: ${marker}`);
  } else if (groupedControls.has(id)) {
    if (entry.maturity !== 'public-proof') fail(`${id} must be public-proof after the grouped-controls proof promotion`);
    if (entry.evidence.implementation !== groupedControls.get(id) || entry.evidence.publicProof !== `evidence/public/${id}.json`) fail(`${id} public-proof evidence boundary is invalid`);
    await access(resolve(root, entry.evidence.implementation));
    await access(resolve(root, entry.evidence.publicProof));
    for (const marker of ['## Semantic boundary', 'Maturity is `public-proof`']) if (!docs.includes(marker)) fail(`${slug}.md missing public-proof marker: ${marker}`);
  } else if (toggleControls.has(id)) {
    if (entry.maturity !== 'public-proof') fail(`${id} must be public-proof after the toggle-controls proof promotion`);
    if (entry.evidence.implementation !== toggleControls.get(id) || entry.evidence.publicProof !== `evidence/public/${id}.json`) fail(`${id} public-proof evidence boundary is invalid`);
    await access(resolve(root, entry.evidence.implementation));
    await access(resolve(root, entry.evidence.publicProof));
    for (const marker of ['## Semantic boundary', '## Canonical Web implementation', 'Maturity is `public-proof`']) if (!docs.includes(marker)) fail(`${slug}.md missing public-proof marker: ${marker}`);
  } else if (valueControls.has(id)) {
    if (entry.maturity !== 'public-proof') fail(`${id} must be public-proof after the value-controls proof promotion`);
    if (entry.evidence.implementation !== valueControls.get(id) || entry.evidence.publicProof !== `evidence/public/${id}.json`) fail(`${id} public-proof evidence boundary is invalid`);
    await access(resolve(root, entry.evidence.implementation));
    await access(resolve(root, entry.evidence.publicProof));
    for (const marker of ['## Semantic boundary', '## Canonical Web implementation', 'Maturity is `public-proof`']) if (!docs.includes(marker)) fail(`${slug}.md missing public-proof marker: ${marker}`);
  } else {
    fail(`unexpected A2 component partition entry ${id}`);
  }
}


const expansionBContracts = {
  'core.multi-select': ["rest","hover","focus-visible","pressed","closed","open","none-selected","selected","highlighted","invalid","disabled"],
  'core.input-otp': ["rest","hover","focus-visible","empty","partial","complete","invalid","disabled"],
  'core.file-upload': ["rest","hover","focus-visible","pressed","drag-active","empty","selected","invalid","disabled"],
  'core.color-picker': ["rest","hover","focus-visible","pressed","selected","invalid","disabled"],
  'core.date-picker': ["rest","hover","focus-visible","pressed","closed","open","empty","selected","range-partial","range-selected","invalid","disabled"],
  'core.time-picker': ["rest","hover","focus-visible","empty","filled","invalid","read-only","disabled"],
  'core.calendar': ["rest","hover","focus-visible","pressed","current","selected","range-start","range-middle","range-end","unavailable","disabled"]
};
const nativeValueInputs = new Map([
  ['core.color-picker', 'packages/adapters/web/components/color-picker.mjs'],
  ['core.time-picker', 'packages/adapters/web/components/time-picker.mjs']
]);
const inputOtpImplementation = 'packages/adapters/web/components/input-otp.mjs';
const multiSelectImplementation = 'packages/adapters/web/components/multi-select.mjs';
const fileUploadImplementation = 'packages/adapters/web/components/file-upload.mjs';
const calendarImplementation = 'packages/adapters/web/components/calendar.mjs';
const datePickerImplementation = 'packages/adapters/web/components/date-picker.mjs';
const expectedContractOnlyExpansionBIds = Object.keys(expansionBContracts).filter((id) => !nativeValueInputs.has(id) && id !== 'core.input-otp' && id !== 'core.multi-select' && id !== 'core.file-upload' && id !== 'core.calendar' && id !== 'core.date-picker').sort();
if (expectedContractOnlyExpansionBIds.length !== 0) fail(`Expansion B proof completion drifted: ${expectedContractOnlyExpansionBIds.join(',')}`);
const actualContractOnlyIds = registry.components.filter((entry) => entry.maturity === 'contract-only').map((entry) => entry.id).sort();
if (actualContractOnlyIds.length !== 0) fail(`DescriptionList implementation cohort must have no contract-only Core entries: ${actualContractOnlyIds.join(',')}`);
for (const [id, expectedStates] of Object.entries(expansionBContracts)) {
  const entry = registry.components.find((candidate) => candidate.id === id);
  if (!entry) fail(`${id} must remain registered`);
  const slug = id.slice('core.'.length);
  const contract = await readJson(resolve(root, `packages/core/components/${slug}.json`));
  if (contract.states.join('|') !== expectedStates.join('|')) fail(`${id} state contract drifted`);
  const docs = await readFile(resolve(root, `packages/core/components/${slug}.md`), 'utf8');
  if (nativeValueInputs.has(id)) {
    if (entry.maturity !== 'public-proof') fail(`${id} must be public-proof after the native value-input proof promotion`);
    if (entry.evidence.implementation !== nativeValueInputs.get(id) || entry.evidence.publicProof !== `evidence/public/${id}.json`) fail(`${id} public-proof evidence boundary is invalid`);
    await access(resolve(root, entry.evidence.implementation));
    await access(resolve(root, entry.evidence.publicProof));
    for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', '## Canonical Web implementation', 'Maturity is `public-proof`']) {
      if (!docs.includes(marker)) fail(`${slug}.md missing public-proof Expansion B marker: ${marker}`);
    }
  } else if (id === 'core.multi-select') {
    if (entry.maturity !== 'public-proof') fail('core.multi-select must be public-proof after the dedicated MultiSelect proof promotion');
    if (entry.evidence.implementation !== multiSelectImplementation || entry.evidence.publicProof !== 'evidence/public/core.multi-select.json') fail('core.multi-select public-proof evidence boundary is invalid');
    await access(resolve(root, entry.evidence.implementation));
    await access(resolve(root, entry.evidence.publicProof));
    for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', '## Canonical Web implementation', 'Maturity is `public-proof`', 'Proof-only promotion does not redeploy Pages']) {
      if (!docs.includes(marker)) fail(`multi-select.md missing public-proof Expansion B marker: ${marker}`);
    }
  } else if (id === 'core.file-upload') {
    if (entry.maturity !== 'public-proof') fail('core.file-upload must be public-proof after the dedicated FileUpload proof promotion');
    if (entry.evidence.implementation !== fileUploadImplementation || entry.evidence.publicProof !== 'evidence/public/core.file-upload.json') fail('core.file-upload public-proof evidence boundary is invalid');
    await access(resolve(root, entry.evidence.implementation));
    await access(resolve(root, entry.evidence.publicProof));
    for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', '## Canonical Web implementation', 'Maturity is `public-proof`', 'Proof-only promotion does not redeploy Pages']) {
      if (!docs.includes(marker)) fail(`file-upload.md missing public-proof Expansion B marker: ${marker}`);
    }
  } else if (id === 'core.calendar') {
    if (entry.maturity !== 'public-proof') fail('core.calendar must be public-proof after the dedicated Calendar proof promotion');
    if (entry.evidence.implementation !== calendarImplementation || entry.evidence.publicProof !== 'evidence/public/core.calendar.json') fail('core.calendar public-proof evidence boundary is invalid');
    await access(resolve(root, entry.evidence.implementation));
    await access(resolve(root, entry.evidence.publicProof));
    for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', '## Canonical Web implementation', 'Maturity is `public-proof`', 'Proof-only promotion does not redeploy Pages']) {
      if (!docs.includes(marker)) fail(`calendar.md missing public-proof Expansion B marker: ${marker}`);
    }
  } else if (id === 'core.date-picker') {
    if (entry.maturity !== 'public-proof') fail('core.date-picker must be public-proof after the dedicated DatePicker proof promotion');
    if (entry.evidence.implementation !== datePickerImplementation || entry.evidence.publicProof !== 'evidence/public/core.date-picker.json') fail('core.date-picker public-proof evidence boundary is invalid');
    await access(resolve(root, entry.evidence.implementation));
    await access(resolve(root, entry.evidence.publicProof));
    for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', '## Canonical Web implementation', 'Maturity is `public-proof`', 'Proof-only promotion does not redeploy Pages']) {
      if (!docs.includes(marker)) fail(`date-picker.md missing public-proof Expansion B marker: ${marker}`);
    }
  } else if (id === 'core.input-otp') {
    if (entry.maturity !== 'public-proof') fail('core.input-otp must be public-proof after the dedicated InputOTP proof promotion');
    if (entry.evidence.implementation !== inputOtpImplementation || entry.evidence.publicProof !== 'evidence/public/core.input-otp.json') fail('core.input-otp public-proof evidence boundary is invalid');
    await access(resolve(root, entry.evidence.implementation));
    await access(resolve(root, entry.evidence.publicProof));
    for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', '## Canonical Web implementation', 'Maturity is `public-proof`', 'Proof-only promotion does not redeploy Pages']) {
      if (!docs.includes(marker)) fail(`input-otp.md missing public-proof Expansion B marker: ${marker}`);
    }
  } else {
    if (entry.maturity !== 'contract-only') fail(`${id} must remain contract-only in this implementation cohort`);
    if (entry.evidence.implementation !== null || entry.evidence.publicProof !== null) fail(`${id} contract-only evidence must remain null`);
    for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', 'Maturity is `contract-only`']) {
      if (!docs.includes(marker)) fail(`${slug}.md missing Expansion B contract marker: ${marker}`);
    }
  }
}

const dialogEntry = registry.components.find((entry) => entry.id === 'core.dialog');
if (!dialogEntry || dialogEntry.maturity !== 'public-proof') fail('core.dialog must be public-proof after the dedicated Dialog proof promotion');
if (dialogEntry.evidence.implementation !== 'packages/adapters/web/components/dialog.mjs' || dialogEntry.evidence.publicProof !== 'evidence/public/core.dialog.json') fail('core.dialog public-proof evidence boundary is invalid');
await access(resolve(root, dialogEntry.evidence.implementation));
await access(resolve(root, dialogEntry.evidence.publicProof));
const dialogContract = await readJson(resolve(root, 'packages/core/components/dialog.json'));
if (dialogContract.states.join('|') !== 'closed|open') fail('core.dialog semantic state contract must remain exactly closed/open');
const dialogDocs = await readFile(resolve(root, 'packages/core/components/dialog.md'), 'utf8');
for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', '## Canonical Web implementation', 'Maturity is `public-proof`', 'Proof-only promotion does not redeploy Pages', 'real native `<dialog>`', '`showModal()`', 'modal presentation, focus containment while open, dismissal coordination and focus restoration', '`FocusTrap` MUST NOT become a public Core component ID', 'Tab and Shift+Tab remain contained within the open modal', 'Escape dismisses an ordinary dismissible Dialog', 'return focus to the invoking element', 'animation phases are implementation timing, not additional component states']) {
  if (!dialogDocs.includes(marker)) fail(`dialog.md missing public-proof Expansion C marker: ${marker}`);
}
const dialogCss = await readFile(resolve(root, 'packages/adapters/web/components/dialog.css'), 'utf8');
for (const marker of ['.ns-dialog','::backdrop','transform: none','var(--ns-depth-rest-x)','var(--ns-motion-standard-duration)','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!dialogCss.includes(marker)) fail(`dialog.css missing implementation marker: ${marker}`);
for (const forbidden of ['transform: translate(', 'var(--ns-press-hover-', 'var(--ns-press-active-']) if (dialogCss.includes(forbidden)) fail(`core.dialog modal surface must not borrow Button pressure travel: ${forbidden}`);
const dialogAdapter = await readFile(resolve(root, 'packages/adapters/web/components/dialog.mjs'), 'utf8');
for (const marker of ['export function syncDialogState','export function setDialogOpen','export function bindDialog','showModal()',"matches(':modal')",'aria-modal','aria-labelledby','aria-describedby','[autofocus]','focusableSelector','restoreInvoker',"addEventListener('cancel'","addEventListener('close'"]) if (!dialogAdapter.includes(marker)) fail(`dialog.mjs missing implementation marker: ${marker}`);
for (const forbidden of ['role="alertdialog"', "event.key === 'Tab'", 'fetch(', 'XMLHttpRequest', 'WebSocket', 'requestSubmit(', 'form.submit(', 'aria-live', 'role="alert"']) if (dialogAdapter.includes(forbidden)) fail(`core.dialog must preserve native modality and exclude AlertDialog/network/form semantics: ${forbidden}`);
const alertDialogEntry = registry.components.find((entry) => entry.id === 'core.alert-dialog');
if (!alertDialogEntry || alertDialogEntry.maturity !== 'public-proof') fail('core.alert-dialog must be public-proof after the dedicated AlertDialog proof promotion');
if (alertDialogEntry.evidence.implementation !== 'packages/adapters/web/components/alert-dialog.mjs' || alertDialogEntry.evidence.publicProof !== 'evidence/public/core.alert-dialog.json') fail('core.alert-dialog public-proof evidence boundary is invalid');
await access(resolve(root, alertDialogEntry.evidence.implementation));
await access(resolve(root, alertDialogEntry.evidence.publicProof));
const alertDialogContract = await readJson(resolve(root, 'packages/core/components/alert-dialog.json'));
if (alertDialogContract.states.join('|') !== 'closed|open') fail('core.alert-dialog semantic state contract must remain exactly closed/open');
const alertDialogDocs = await readFile(resolve(root, 'packages/core/components/alert-dialog.md'), 'utf8');
for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', '## Canonical Web implementation', 'Maturity is `public-proof`', 'Proof-only promotion does not redeploy Pages', 'native `<dialog role="alertdialog">`', '`showModal()`', 'does not add `tabindex`', 'least-destructive or cancel action is preferred', 'Escape dismisses an ordinary dismissible AlertDialog', 'return focus to the invoking element', 'Urgency, severity, confirmation outcome, destructive intent, and animation phases are not separate component states']) {
  if (!alertDialogDocs.includes(marker)) fail(`alert-dialog.md missing public-proof Expansion C marker: ${marker}`);
}
const alertDialogCss = await readFile(resolve(root, 'packages/adapters/web/components/alert-dialog.css'), 'utf8');
for (const marker of ['.ns-alert-dialog__message','.ns-alert-dialog__actions','data-alert-dialog-destructive','var(--ns-color-content-secondary)','var(--ns-space-surface-block)']) if (!alertDialogCss.includes(marker)) fail(`alert-dialog.css missing implementation marker: ${marker}`);
for (const forbidden of ['transform: translate(', 'var(--ns-press-hover-', 'var(--ns-press-active-', 'var(--ns-motion-press-duration)', 'var(--ns-motion-release-duration)']) if (alertDialogCss.includes(forbidden)) fail(`core.alert-dialog modal surface styling must not own pressure motion: ${forbidden}`);
const alertDialogAdapter = await readFile(resolve(root, 'packages/adapters/web/components/alert-dialog.mjs'), 'utf8');
for (const marker of ['export function syncAlertDialogState','export function setAlertDialogOpen','export function bindAlertDialog','showModal()',"matches(':modal')",'alertdialog','aria-modal','aria-labelledby','aria-describedby','data-alert-dialog-response','data-alert-dialog-destructive','data-alert-dialog-least-destructive',"hasAttribute('tabindex')",'restoreInvoker',"addEventListener('cancel'","addEventListener('close'"]) if (!alertDialogAdapter.includes(marker)) fail(`alert-dialog.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["event.key === 'Tab'", 'fetch(', 'XMLHttpRequest', 'WebSocket', 'requestSubmit(', 'form.submit(', 'aria-live', 'role="alert"']) if (alertDialogAdapter.includes(forbidden)) fail(`core.alert-dialog must preserve native modality and exclude business/network/form/live-region semantics: ${forbidden}`);
const drawerEntry = registry.components.find((entry) => entry.id === 'core.drawer');
if (!drawerEntry || drawerEntry.maturity !== 'public-proof') fail('core.drawer must be public-proof after the dedicated Drawer proof promotion');
if (drawerEntry.evidence.implementation !== 'packages/adapters/web/components/drawer.mjs' || drawerEntry.evidence.publicProof !== 'evidence/public/core.drawer.json') fail('core.drawer public-proof evidence boundary is invalid');
await access(resolve(root, drawerEntry.evidence.implementation));
await access(resolve(root, drawerEntry.evidence.publicProof));
const drawerContract = await readJson(resolve(root, 'packages/core/components/drawer.json'));
if (drawerContract.states.join('|') !== 'closed|open') fail('core.drawer semantic state contract must remain exactly closed|open');
const drawerDocs = await readFile(resolve(root, 'packages/core/components/drawer.md'), 'utf8');
for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', '## Canonical Web implementation', 'Maturity is `public-proof`', 'Proof-only promotion does not redeploy Pages', 'already-deployed 38-Core / 55-token singleton cohort', 'native `<dialog>`', '`showModal()`', 'logical `data-drawer-placement` values', 'small movement do not become dismissal authority', 'Sheet remains merged into Drawer', 'FocusTrap remains internal overlay infrastructure']) {
  if (!drawerDocs.includes(marker)) fail(`drawer.md missing public-proof Expansion C marker: ${marker}`);
}
const drawerCss = await readFile(resolve(root, 'packages/adapters/web/components/drawer.css'), 'utf8');
for (const marker of ['.ns-drawer','::backdrop','data-drawer-placement="inline-start"','data-drawer-placement="inline-end"','data-drawer-placement="block-start"','data-drawer-placement="block-end"','transform: translate(var(--ns-drawer-closed-x), var(--ns-drawer-closed-y))','var(--ns-motion-standard-duration)','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!drawerCss.includes(marker)) fail(`drawer.css missing implementation marker: ${marker}`);
for (const forbidden of ['var(--ns-press-hover-', 'var(--ns-press-active-', 'var(--ns-motion-press-duration)', 'var(--ns-motion-release-duration)']) if (drawerCss.includes(forbidden)) fail(`core.drawer surface must not borrow Button pressure motion: ${forbidden}`);
const drawerAdapter = await readFile(resolve(root, 'packages/adapters/web/components/drawer.mjs'), 'utf8');
for (const marker of ['export function syncDrawerState','export function setDrawerPlacement','export function setDrawerOpen','export function bindDrawer','showModal()', "matches(':modal')", 'aria-modal', 'aria-labelledby', 'aria-describedby', 'data-drawer-placement', 'inline-start', 'inline-end', 'block-start', 'block-end', 'gestureDistance', 'threshold', 'restoreInvoker', "addEventListener('cancel'", "addEventListener('close'", "addEventListener('pointerdown'", "addEventListener('pointerup'"]) if (!drawerAdapter.includes(marker)) fail(`drawer.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["event.key === 'Tab'", 'fetch(', 'XMLHttpRequest', 'WebSocket', 'requestSubmit(', 'form.submit(', 'location.href', 'history.pushState', 'history.replaceState']) if (drawerAdapter.includes(forbidden)) fail(`core.drawer must preserve native modality and exclude business/network/form/navigation authority: ${forbidden}`);
const popoverEntry = registry.components.find((entry) => entry.id === 'core.popover');
if (!popoverEntry || popoverEntry.maturity !== 'public-proof') fail('core.popover must be public-proof after the dedicated Popover proof promotion');
if (popoverEntry.evidence.implementation !== 'packages/adapters/web/components/popover.mjs' || popoverEntry.evidence.publicProof !== 'evidence/public/core.popover.json') fail('core.popover public-proof evidence boundary is invalid');
await access(resolve(root, popoverEntry.evidence.implementation));
await access(resolve(root, popoverEntry.evidence.publicProof));
const popoverContract = await readJson(resolve(root, 'packages/core/components/popover.json'));
if (popoverContract.states.join('|') !== 'closed|open') fail('core.popover semantic state contract must remain exactly closed|open');
const popoverDocs = await readFile(resolve(root, 'packages/core/components/popover.md'), 'utf8');
for (const marker of ['## Semantic boundary', '## Accessibility and input law', '## Token boundary', '## Canonical Web implementation', 'Maturity is `public-proof`', 'Proof-only promotion does not redeploy Pages', 'already-deployed 39-Core / 55-token singleton cohort', 'platform Popover API', 'auto popover surface', '`popovertarget`', 'native light-dismiss and Escape behavior', 'installs no Tab loop', 'focus is restored only when dismissal would otherwise strand focus']) {
  if (!popoverDocs.includes(marker)) fail(`popover.md missing public-proof Expansion C marker: ${marker}`);
}
const popoverCss = await readFile(resolve(root, 'packages/adapters/web/components/popover.css'), 'utf8');
for (const marker of ['.ns-popover', ':popover-open', 'var(--ns-depth-rest-x)', 'var(--ns-motion-standard-duration)', 'transition-behavior: allow-discrete', '@starting-style', '@media (prefers-reduced-motion: reduce)', '@media (forced-colors: active)']) if (!popoverCss.includes(marker)) fail(`popover.css missing implementation marker: ${marker}`);
for (const forbidden of ['var(--ns-press-hover-', 'var(--ns-press-active-', 'var(--ns-motion-press-duration)', 'var(--ns-motion-release-duration)']) if (popoverCss.includes(forbidden)) fail(`core.popover surface must not borrow Button pressure motion: ${forbidden}`);
const popoverAdapter = await readFile(resolve(root, 'packages/adapters/web/components/popover.mjs'), 'utf8');
for (const marker of ['export function positionPopover', 'export function syncPopoverState', 'export function setPopoverPlacement', 'export function setPopoverOpen', 'export function bindPopover', 'showPopover()', 'hidePopover()', "matches(':popover-open')", 'popovertarget', 'aria-controls', 'aria-expanded', 'data-popover-side', 'data-popover-align', "addEventListener('beforetoggle'", "addEventListener('toggle'", 'restoreInvoker']) if (!popoverAdapter.includes(marker)) fail(`popover.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["event.key === 'Tab'", "addEventListener('keydown'", "setAttribute('aria-modal'", "setAttribute('role'", 'fetch(', 'XMLHttpRequest', 'WebSocket', 'requestSubmit(', 'form.submit(', 'location.href', 'history.pushState', 'history.replaceState']) if (popoverAdapter.includes(forbidden)) fail(`core.popover must preserve non-modal document traversal and exclude modal/menu/business/network/form/navigation authority: ${forbidden}`);

const hoverCardEntry = registry.components.find((entry) => entry.id === 'core.hover-card');
if (!hoverCardEntry || hoverCardEntry.maturity !== 'public-proof') fail('core.hover-card must be public-proof after the dedicated HoverCard proof promotion');
if (hoverCardEntry.evidence.implementation !== 'packages/adapters/web/components/hover-card.mjs' || hoverCardEntry.evidence.publicProof !== 'evidence/public/core.hover-card.json') fail('core.hover-card public-proof evidence boundary is invalid');
await access(resolve(root, hoverCardEntry.evidence.publicProof));
await access(resolve(root, hoverCardEntry.evidence.implementation));
const hoverCardContract = await readJson(resolve(root, 'packages/core/components/hover-card.json'));
if (hoverCardContract.states.join('|') !== 'closed|open|dismissed') fail('core.hover-card semantic state contract must remain exactly closed|open|dismissed');
const expectedHoverCardDependencies = [
  'color.surface.panel','color.content.primary','color.content.secondary','color.border.strong',
  'space.surface.inline','space.surface.block','border.surface.width','radius.surface',
  'depth.rest.x','depth.rest.y','motion.standard.duration','motion.standard.easing',
  'font.family.body','font.size.body','font.size.label','font.weight.regular','font.weight.emphasis'
];
if (hoverCardContract.dependencies.join('|') !== expectedHoverCardDependencies.join('|')) fail('core.hover-card contract dependency boundary drifted');
for (const forbiddenToken of ['color.action.primary.surface','color.action.primary.content','color.focus.ring','size.control.minimum','depth.hover.x','depth.hover.y','depth.active.x','depth.active.y','press.hover.x','press.hover.y','press.active.x','press.active.y','motion.press.duration','motion.release.duration','opacity.disabled']) {
  if (hoverCardContract.dependencies.includes(forbiddenToken)) fail(`core.hover-card read-only preview must not borrow action/control/press token ${forbiddenToken}`);
}
const hoverCardDocs = await readFile(resolve(root, 'packages/core/components/hover-card.md'), 'utf8');
for (const marker of [
  'structured non-interactive preview primitive',
  '## Semantic boundary',
  'HoverCard is not Tooltip',
  'HoverCard is not Popover',
  'MUST NOT contain buttons, links, inputs, menus, dismiss controls',
  'Canonical semantic states are exactly `closed`, `open`, and `dismissed`',
  'Pointer users must be able to move from the trigger onto the HoverCard without immediate collapse',
  'Escape closes an open HoverCard without moving focus',
  'Ordinary Tab and Shift+Tab traversal remain document traversal',
  'MUST NOT hijack click, tap, long-press, context-menu, text-selection, or native activation',
  '## Canonical Web implementation',
  '`aria-details`',
  'Touch pointer entry is ignored',
  'Maturity is `public-proof`',
  'Proof-only promotion does not redeploy Pages',
  'already-deployed 40-Core / 55-token singleton cohort'
]) if (!hoverCardDocs.includes(marker)) fail(`hover-card.md missing implemented Expansion C marker: ${marker}`);

const hoverCardCss = await readFile(resolve(root, 'packages/adapters/web/components/hover-card.css'), 'utf8');
for (const marker of [
  '.ns-hover-card',
  '[data-state="open"]',
  'var(--ns-depth-rest-x)',
  'var(--ns-motion-standard-duration)',
  'transition-property: opacity',
  '@media (prefers-reduced-motion: reduce)',
  'transition-duration: 1ms !important;',
  '@media (forced-colors: active)'
]) if (!hoverCardCss.includes(marker)) fail(`hover-card.css missing implementation marker: ${marker}`);
for (const forbidden of ['var(--ns-press-hover-', 'var(--ns-press-active-', 'var(--ns-motion-press-duration)', 'var(--ns-motion-release-duration)']) if (hoverCardCss.includes(forbidden)) fail(`core.hover-card surface must not borrow Button pressure motion: ${forbidden}`);

const hoverCardAdapter = await readFile(resolve(root, 'packages/adapters/web/components/hover-card.mjs'), 'utf8');
for (const marker of [
  'export function positionHoverCard',
  'export function syncHoverCardState',
  'export function setHoverCardPlacement',
  'export function bindHoverCard',
  'aria-details',
  'HoverCard content must remain non-interactive',
  "['closed', 'open', 'dismissed']",
  'openDelay',
  'closeDelay',
  "event.pointerType === 'touch'",
  "addEventListener('pointerenter'",
  "addEventListener('pointerleave'",
  "addEventListener('focus'",
  "addEventListener('blur'",
  "event.key !== 'Escape'",
  'data-hover-card-side',
  'data-hover-card-align'
]) if (!hoverCardAdapter.includes(marker)) fail(`hover-card.mjs missing implementation marker: ${marker}`);
for (const forbidden of [
  "addEventListener('click'",
  'touchstart',
  'touchend',
  'contextmenu',
  'longpress',
  "event.key === 'Tab'",
  "setAttribute('role'",
  "setAttribute('tabindex'",
  'preventDefault(',
  'stopPropagation(',
  'fetch(',
  'XMLHttpRequest',
  'WebSocket',
  'requestSubmit(',
  'form.submit(',
  'location.href',
  'history.pushState',
  'history.replaceState'
]) if (hoverCardAdapter.includes(forbidden)) fail(`core.hover-card must preserve read-only hover/focus preview authority without activation/business/navigation synthesis: ${forbidden}`);

const dropdownMenuEntry = registry.components.find((entry) => entry.id === 'core.dropdown-menu');
if (!dropdownMenuEntry || dropdownMenuEntry.maturity !== 'public-proof') fail('core.dropdown-menu must be public-proof after the dedicated DropdownMenu proof promotion');
if (dropdownMenuEntry.evidence.implementation !== 'packages/adapters/web/components/dropdown-menu.mjs' || dropdownMenuEntry.evidence.publicProof !== 'evidence/public/core.dropdown-menu.json') fail('core.dropdown-menu public-proof evidence boundary is invalid');
await access(resolve(root, dropdownMenuEntry.evidence.implementation));
await access(resolve(root, dropdownMenuEntry.evidence.publicProof));
const dropdownMenuContract = await readJson(resolve(root, 'packages/core/components/dropdown-menu.json'));
if (dropdownMenuContract.states.join('|') !== 'closed|open|hover|focus-visible|pressed|checked|disabled') fail('core.dropdown-menu state contract must remain exactly closed|open|hover|focus-visible|pressed|checked|disabled');
const expectedDropdownMenuDependencies = [
  'color.surface.panel','color.surface.interactive','color.content.primary','color.content.secondary',
  'color.border.strong','color.action.primary.surface','color.action.primary.content','color.focus.ring',
  'space.control.inline','space.control.block','space.surface.inline','space.surface.block',
  'border.surface.width','radius.control','radius.surface','size.control.minimum',
  'depth.rest.x','depth.rest.y','depth.hover.x','depth.hover.y','depth.active.x','depth.active.y',
  'press.hover.x','press.hover.y','press.active.x','press.active.y',
  'motion.press.duration','motion.press.easing','motion.release.duration','motion.release.easing',
  'motion.standard.duration','motion.standard.easing','focus.ring.width','focus.ring.offset',
  'opacity.disabled','font.family.body','font.size.body','font.size.label','font.weight.regular','font.weight.emphasis'
];
if (dropdownMenuContract.dependencies.join('|') !== expectedDropdownMenuDependencies.join('|')) fail('core.dropdown-menu contract dependency boundary drifted');
const dropdownMenuDocs = await readFile(resolve(root, 'packages/core/components/dropdown-menu.md'), 'utf8');
for (const marker of [
  'generic menu-button primitive',
  '## Semantic boundary',
  'aria-haspopup="menu"',
  'role="menu"',
  'menuitemcheckbox',
  'menuitemradio',
  'DropdownMenu is not generic Popover',
  'DropdownMenu is not ContextMenu',
  'DropdownMenu is not Menubar',
  'DropdownMenu is not NavigationMenu',
  'Nested submenu orchestration and Left/Right submenu traversal are not part of this slice',
  'The canonical contract states are exactly `closed`, `open`, `hover`, `focus-visible`, `pressed`, `checked`, and `disabled`',
  '`ArrowDown` opens the menu',
  '`ArrowUp` opens the menu',
  'Printable-character typeahead',
  '`Escape` closes the menu and restores focus to the trigger',
  '`Tab` or `Shift+Tab` closes the menu without preventing the browser',
  'Disabled menu items remain discoverable',
  'right-click, `contextmenu`, long-press, `Shift+F10`',
  '## Canonical Web implementation',
  'native `hidden` attribute',
  'ns-dropdown-menu-activate',
  '41-Core / 55-token',
  'Maturity is `public-proof`',
  'Proof-only promotion does not redeploy Pages',
  'already-deployed 41-Core / 55-token singleton cohort'
]) if (!dropdownMenuDocs.includes(marker)) fail(`dropdown-menu.md missing implemented Expansion C marker: ${marker}`);

const dropdownMenuCss = await readFile(resolve(root, 'packages/adapters/web/components/dropdown-menu.css'), 'utf8');
for (const marker of [
  '.ns-dropdown-menu__menu',
  '.ns-dropdown-menu--preview-static .ns-dropdown-menu__menu',
  '.ns-dropdown-menu__item',
  '[aria-checked="true"]',
  '[aria-disabled="true"]',
  'var(--ns-depth-rest-x)',
  'var(--ns-press-hover-x)',
  'var(--ns-press-active-x)',
  'transition-duration: var(--ns-motion-standard-duration)',
  '@media (prefers-reduced-motion: reduce)',
  'transition-duration: 1ms !important;',
  '@media (forced-colors: active)'
]) if (!dropdownMenuCss.includes(marker)) fail(`dropdown-menu.css missing implementation marker: ${marker}`);

const dropdownMenuAdapter = await readFile(resolve(root, 'packages/adapters/web/components/dropdown-menu.mjs'), 'utf8');
for (const marker of [
  "from './menu-items.mjs'",
  'createMenuItemEngine',
  "owner: 'core.dropdown-menu'",
  "eventName: 'ns-dropdown-menu-activate'",
  "radioGroupDataKey: 'dropdownMenuRadioGroup'",
  'export function positionDropdownMenu',
  'export function syncDropdownMenuState',
  'export function setDropdownMenuPlacement',
  'export function setDropdownMenuOpen',
  'export function bindDropdownMenu',
  'aria-haspopup',
  'role="menu"',
  "event.key === 'ArrowDown'",
  "event.key === 'ArrowUp'",
  "event.key === 'Home'",
  "event.key === 'End'",
  "event.key === 'Escape'",
  "event.key === 'Tab'",
  "event.key === 'Enter'",
  'event.key.length === 1',
  'menuItemSelector',
  'view.setTimeout',
  'returnFocus: true'
]) if (!dropdownMenuAdapter.includes(marker)) fail(`dropdown-menu.mjs missing implementation/shared-engine marker: ${marker}`);
for (const forbidden of [
  "addEventListener('contextmenu'",
  "event.key === 'ContextMenu'",
  "event.key === 'F10'",
  'longpress',
  "setAttribute('aria-modal'",
  "setAttribute('role'",
  'role="listbox"',
  'role="option"',
  'fetch(',
  'XMLHttpRequest',
  'WebSocket',
  'requestSubmit(',
  'form.submit(',
  'location.href',
  'history.pushState',
  'history.replaceState'
]) if (dropdownMenuAdapter.includes(forbidden)) fail(`core.dropdown-menu must exclude ContextMenu/modal/value/business/network/form/navigation authority: ${forbidden}`);
let unusedControllerExists = true;
try {
  await access(resolve(root, 'packages/core/previews/dropdown-menu/controller.mjs'));
} catch (error) {
  if (error?.code === 'ENOENT') unusedControllerExists = false;
  else throw error;
}
if (unusedControllerExists) fail('core.dropdown-menu fixture/native preview must not ship an unused controller');

const menuItemsAdapter = await readFile(resolve(root, 'packages/adapters/web/components/menu-items.mjs'), 'utf8');
for (const marker of [
  'export const menuItemSelector',
  'export function createMenuItemEngine',
  'tabindex="-1"',
  'aria-haspopup',
  'menuitemcheckbox',
  'menuitemradio',
  'aria-checked',
  'aria-disabled',
  'typeaheadTimer',
  'view.setTimeout',
  'CustomEvent(eventName',
  'onPlain',
  'contexts.delete(root)'
]) if (!menuItemsAdapter.includes(marker)) fail(`menu-items.mjs missing shared menu-item invariant: ${marker}`);
for (const forbidden of [
  "addEventListener('contextmenu'",
  "event.key === 'ContextMenu'",
  "event.key === 'F10'",
  'longPress',
  'getBoundingClientRect',
  'aria-expanded',
  'aria-controls',
  'fetch(',
  'XMLHttpRequest',
  'WebSocket',
  'requestSubmit(',
  'form.submit(',
  'location.href',
  'history.pushState',
  'history.replaceState'
]) if (menuItemsAdapter.includes(forbidden)) fail(`shared menu-items.mjs must remain invocation/placement/business-authority free: ${forbidden}`);

const contextMenuEntry = registry.components.find((entry) => entry.id === 'core.context-menu');
if (!contextMenuEntry || contextMenuEntry.maturity !== 'public-proof') fail('core.context-menu must be public-proof after the dedicated ContextMenu proof promotion');
if (contextMenuEntry.evidence.implementation !== 'packages/adapters/web/components/context-menu.mjs' || contextMenuEntry.evidence.publicProof !== 'evidence/public/core.context-menu.json') fail('core.context-menu public-proof evidence boundary is invalid');
await access(resolve(root, contextMenuEntry.evidence.implementation));
await access(resolve(root, contextMenuEntry.evidence.publicProof));
const contextMenuContract = await readJson(resolve(root, 'packages/core/components/context-menu.json'));
if (contextMenuContract.states.join('|') !== 'closed|open|hover|focus-visible|pressed|checked|disabled') fail('core.context-menu state contract must remain exactly closed|open|hover|focus-visible|pressed|checked|disabled');
const expectedContextMenuDependencies = [
  'color.surface.panel','color.surface.interactive','color.content.primary','color.content.secondary',
  'color.border.strong','color.action.primary.surface','color.action.primary.content','color.focus.ring',
  'space.control.inline','space.control.block','space.surface.inline','space.surface.block',
  'border.surface.width','radius.control','radius.surface','size.control.minimum',
  'depth.rest.x','depth.rest.y','depth.hover.x','depth.hover.y','depth.active.x','depth.active.y',
  'press.hover.x','press.hover.y','press.active.x','press.active.y',
  'motion.press.duration','motion.press.easing','motion.release.duration','motion.release.easing',
  'motion.standard.duration','motion.standard.easing','focus.ring.width','focus.ring.offset',
  'opacity.disabled','font.family.body','font.size.body','font.size.label','font.weight.regular','font.weight.emphasis'
];
if (contextMenuContract.dependencies.join('|') !== expectedContextMenuDependencies.join('|')) fail('core.context-menu contract dependency boundary drifted');
const contextMenuDocs = await readFile(resolve(root, 'packages/core/components/context-menu.md'), 'utf8');
for (const marker of [
  'context-invoked menu primitive',
  '## Semantic boundary',
  'role="menu"',
  'menuitemcheckbox',
  'menuitemradio',
  'ContextMenu is not DropdownMenu',
  'ContextMenu is not generic Popover',
  'ContextMenu is not Menubar',
  'ContextMenu is not NavigationMenu',
  'Shift+F10',
  'platform `ContextMenu` key',
  'platform-generated `contextmenu` event',
  'MUST NOT manufacture `tabindex`',
  'Touch long-press is first-class ContextMenu invocation',
  'a synthetic hold MUST cancel on meaningful pointer movement',
  'ContextMenu is an enhancement, not the sole discoverability path for an essential action',
  'The canonical contract states are exactly `closed`, `open`, `hover`, `focus-visible`, `pressed`, `checked`, and `disabled`',
  'Printable-character typeahead',
  '`Escape` closes the menu and restores focus to the invoking context target',
  '`Tab` or `Shift+Tab` closes the menu without preventing the browser',
  'Disabled menu items remain discoverable',
  '## Canonical Web implementation',
  '`menu-items.mjs`',
  '`ns-context-menu-activate`',
  '42-Core / 55-token',
  'exact **55-token** union',
  'Maturity is `public-proof`',
  'Proof-only promotion does not redeploy Pages',
  'already-deployed **42-Core / 55-token** singleton cohort'
]) if (!contextMenuDocs.includes(marker)) fail(`context-menu.md missing implemented Expansion C marker: ${marker}`);

const contextMenuCss = await readFile(resolve(root, 'packages/adapters/web/components/context-menu.css'), 'utf8');
for (const marker of [
  '.ns-context-menu__menu',
  '.ns-context-menu--preview-static .ns-context-menu__menu',
  '.ns-context-menu__item',
  '[aria-checked="true"]',
  '[aria-disabled="true"]',
  'var(--ns-depth-rest-x)',
  'var(--ns-press-hover-x)',
  'var(--ns-press-active-x)',
  'transition-duration: var(--ns-motion-standard-duration)',
  '@media (prefers-reduced-motion: reduce)',
  'transition-duration: 1ms !important;',
  '@media (forced-colors: active)',
  '@media (max-width: 32rem)'
]) if (!contextMenuCss.includes(marker)) fail(`context-menu.css missing implementation marker: ${marker}`);

const contextMenuAdapter = await readFile(resolve(root, 'packages/adapters/web/components/context-menu.mjs'), 'utf8');
for (const marker of [
  "from './menu-items.mjs'",
  "owner: 'core.context-menu'",
  "eventName: 'ns-context-menu-activate'",
  "radioGroupDataKey: 'contextMenuRadioGroup'",
  'export function positionContextMenu',
  'export function syncContextMenuState',
  'export function setContextMenuOpen',
  'export function bindContextMenu',
  "addEventListener('contextmenu'",
  "event.key === 'F10'",
  "event.key === 'ContextMenu'",
  'longPressDelay',
  'longPressMoveTolerance',
  "event.pointerType !== 'touch'",
  'Math.hypot',
  'editableWithinTarget',
  "event.key === 'ArrowDown'",
  "event.key === 'ArrowUp'",
  "event.key === 'Home'",
  "event.key === 'End'",
  "event.key === 'Escape'",
  "event.key === 'Tab'",
  "event.key === 'Enter'",
  'event.key.length === 1',
  'returnFocus: true',
  "anchor: { kind: 'point'",
  "anchor: { kind: 'target'"
]) if (!contextMenuAdapter.includes(marker)) fail(`context-menu.mjs missing implementation marker: ${marker}`);
for (const forbidden of [
  "parts.target.addEventListener('click'",
  "setAttribute('tabindex'",
  "setAttribute('role'",
  "setAttribute('aria-haspopup'",
  "setAttribute('aria-expanded'",
  "setAttribute('aria-modal'",
  'role="listbox"',
  'role="option"',
  'fetch(',
  'XMLHttpRequest',
  'WebSocket',
  'requestSubmit(',
  'form.submit(',
  'location.href',
  'history.pushState',
  'history.replaceState'
]) if (contextMenuAdapter.includes(forbidden)) fail(`core.context-menu must not manufacture target/menu-button/value/business/network/form/navigation authority: ${forbidden}`);


const menubarEntry = registry.components.find((entry) => entry.id === 'core.menubar');
if (!menubarEntry || menubarEntry.maturity !== 'public-proof') fail('core.menubar must be public-proof after the dedicated Menubar proof promotion');
if (menubarEntry.evidence.implementation !== 'packages/adapters/web/components/menubar.mjs' || menubarEntry.evidence.publicProof !== 'evidence/public/core.menubar.json') fail('core.menubar public-proof evidence boundary is invalid');
await access(resolve(root, menubarEntry.evidence.implementation));
await access(resolve(root, menubarEntry.evidence.publicProof));
const menubarContract = await readJson(resolve(root, 'packages/core/components/menubar.json'));
if (menubarContract.states.join('|') !== 'closed|open|hover|focus-visible|pressed|checked|disabled') fail('core.menubar state contract must remain exactly closed|open|hover|focus-visible|pressed|checked|disabled');
const expectedMenubarDependencies = [
  'color.surface.panel','color.surface.interactive','color.content.primary','color.content.secondary',
  'color.border.strong','color.action.primary.surface','color.action.primary.content','color.focus.ring',
  'space.navigation.gap','space.control.inline','space.control.block','space.surface.inline','space.surface.block',
  'border.surface.width','radius.control','radius.surface','size.control.minimum',
  'depth.rest.x','depth.rest.y','depth.hover.x','depth.hover.y','depth.active.x','depth.active.y',
  'press.hover.x','press.hover.y','press.active.x','press.active.y',
  'motion.press.duration','motion.press.easing','motion.release.duration','motion.release.easing',
  'motion.standard.duration','motion.standard.easing','focus.ring.width','focus.ring.offset',
  'opacity.disabled','font.family.body','font.size.body','font.size.label','font.weight.regular','font.weight.emphasis'
];
if (menubarContract.dependencies.join('|') !== expectedMenubarDependencies.join('|')) fail('core.menubar contract dependency boundary drifted');
const menubarDocs = await readFile(resolve(root, 'packages/core/components/menubar.md'), 'utf8');
for (const marker of [
  'persistent horizontal application-command menu primitive','## Semantic boundary','role="menubar"','menuitemcheckbox','menuitemradio',
  'Exactly one valid root item participates in ordinary document Tab order','Re-entry restores the last valid root item','ArrowLeft','ArrowRight',
  'RTL reverses visual Left/Right traversal','Printable-character typeahead','aria-haspopup="menu"','aria-expanded','one first-level submenu',
  'role="menu"','Escape','Tab','Menubar is not DropdownMenu','Menubar is not ContextMenu','Menubar is not generic Popover','Menubar is not Toolbar',
  'Menubar is not NavigationMenu','core.navigation-menu','Menubar is not Select/Listbox/Combobox','searchable CommandMenu',
  'The canonical contract states are exactly `closed`, `open`, `hover`, `focus-visible`, `pressed`, `checked`, and `disabled`',
  '## Canonical Web implementation','`menu-items.mjs`','`ns-menubar-activate`','43-Core / 55-token','exact **55-token** union','**249 real preview states**',
  'Maturity is `public-proof`','Proof-only promotion does not redeploy Pages','already-deployed **43-Core / 55-token** singleton cohort'
]) if (!menubarDocs.includes(marker)) fail(`menubar.md missing implemented Expansion C marker: ${marker}`);
const menubarCss = await readFile(resolve(root, 'packages/adapters/web/components/menubar.css'), 'utf8');
for (const marker of [
  '.ns-menubar__root','.ns-menubar__menu','.ns-menubar--preview-static .ns-menubar__menu','.ns-menubar__item',
  '[aria-haspopup="menu"]','[aria-expanded="true"]','[aria-checked="true"]','[aria-disabled="true"]','var(--ns-space-navigation-gap)',
  'var(--ns-depth-rest-x)','var(--ns-press-hover-x)','var(--ns-press-active-x)','transition-duration: var(--ns-motion-standard-duration)',
  '@media (prefers-reduced-motion: reduce)','transition-duration: 1ms !important;','@media (forced-colors: active)','@media (max-width: 32rem)',
  'scroll-snap-type: inline proximity'
]) if (!menubarCss.includes(marker)) fail(`menubar.css missing implementation marker: ${marker}`);
const menubarAdapter = await readFile(resolve(root, 'packages/adapters/web/components/menubar.mjs'), 'utf8');
for (const marker of [
  "from './menu-items.mjs'","owner: 'core.menubar'","eventName: 'ns-menubar-activate'","radioGroupDataKey: 'menubarRadioGroup'",
  'export function positionMenubarSubmenu','export function syncMenubarState','export function setMenubarSubmenuOpen','export function bindMenubar',
  'exactly one root menu item must have tabindex="0"','aria-haspopup="menu"','aria-expanded="true" or "false"',
  "event.key === 'ArrowRight'","event.key === 'ArrowLeft'","event.key === 'ArrowDown'","event.key === 'ArrowUp'",
  "event.key === 'Home'","event.key === 'End'","event.key === 'Escape'","event.key === 'Tab'","event.key === 'Enter'",
  'event.key.length === 1','getComputedStyle(parts.bar).direction','submenuItems.typeahead','submenuItems.activate',"CustomEvent('ns-menubar-activate'"
]) if (!menubarAdapter.includes(marker)) fail(`menubar.mjs missing implementation marker: ${marker}`);
for (const forbidden of [
  "addEventListener('contextmenu'","event.key === 'ContextMenu'","event.key === 'F10'",'longPress',"setAttribute('role'",
  "setAttribute('aria-haspopup'","setAttribute('aria-modal'",'role="listbox"','role="option"','fetch(','XMLHttpRequest','WebSocket',
  'requestSubmit(','form.submit(','location.href','history.pushState','history.replaceState'
]) if (menubarAdapter.includes(forbidden)) fail(`core.menubar must exclude ContextMenu/modal/value/business/network/form/navigation authority: ${forbidden}`);
let menubarControllerExists = false;
try { await access(resolve(root, 'packages/core/previews/menubar/controller.mjs')); menubarControllerExists = true; }
catch (error) { if (error?.code !== 'ENOENT') throw error; }
if (menubarControllerExists) fail('core.menubar fixture/native preview must not ship an unused controller');

const navigationMenuEntry = registry.components.find((entry) => entry.id === 'core.navigation-menu');
if (!navigationMenuEntry || navigationMenuEntry.maturity !== 'public-proof') fail('core.navigation-menu must be public-proof after the dedicated NavigationMenu proof promotion');
if (navigationMenuEntry.evidence.implementation !== 'packages/adapters/web/components/navigation-menu.mjs' || navigationMenuEntry.evidence.publicProof !== 'evidence/public/core.navigation-menu.json') fail('core.navigation-menu public-proof evidence boundary is invalid');
await access(resolve(root, navigationMenuEntry.evidence.implementation));
await access(resolve(root, navigationMenuEntry.evidence.publicProof));
const navigationMenuContract = await readJson(resolve(root, 'packages/core/components/navigation-menu.json'));
if (navigationMenuContract.states.join('|') !== 'closed|open|hover|focus-visible|pressed|current') fail('core.navigation-menu state contract must remain exactly closed|open|hover|focus-visible|pressed|current');
const expectedNavigationMenuDependencies = [
  'color.surface.panel','color.surface.interactive','color.content.primary','color.content.secondary',
  'color.border.strong','color.action.primary.surface','color.action.primary.content','color.focus.ring',
  'space.navigation.gap','space.control.inline','space.control.block','space.surface.inline','space.surface.block',
  'border.control.width','border.surface.width','radius.control','radius.surface','size.control.minimum',
  'depth.rest.x','depth.rest.y','depth.hover.x','depth.hover.y','depth.active.x','depth.active.y',
  'press.hover.x','press.hover.y','press.active.x','press.active.y',
  'motion.press.duration','motion.press.easing','motion.release.duration','motion.release.easing',
  'motion.standard.duration','motion.standard.easing','focus.ring.width','focus.ring.offset',
  'font.family.body','font.size.body','font.size.navigation','font.weight.regular','font.weight.emphasis'
];
if (navigationMenuContract.dependencies.join('|') !== expectedNavigationMenuDependencies.join('|')) fail('core.navigation-menu contract dependency boundary drifted');
const navigationMenuDocs = await readFile(resolve(root, 'packages/core/components/navigation-menu.md'), 'utf8');
for (const marker of [
  'site/application navigation disclosure primitive','## Semantic boundary','native `<nav>` landmark','real `<a href>` destination',
  'separate adjacent disclosure button','aria-expanded="true|false"','`aria-controls`','ordinary document Tab order',
  'does not intercept Arrow keys, `Home`, or `End`','`Escape` closes an open disclosure','aria-current="page"',
  'MUST NOT use `role="menu"`','MUST NOT manufacture fake disabled anchors','NavigationMenu is not Menubar',
  'NavigationMenu is not DropdownMenu','NavigationMenu is not ContextMenu','NavigationMenu is not generic Popover',
  'NavigationMenu is not Tabs','NavigationMenu is not Breadcrumb','NavigationMenu is not Pagination','NavigationMenu is not Drawer',
  'The canonical contract states are exactly `closed`, `open`, `hover`, `focus-visible`, `pressed`, and `current`',
  '## Canonical Web implementation','`bindNavigationMenu`','public **44-Core / 55-token** singleton',
  '**255 real states**','Maturity is `public-proof`','`evidence/public/core.navigation-menu.json`','Proof-only promotion does not redeploy Pages'
]) if (!navigationMenuDocs.includes(marker)) fail(`navigation-menu.md missing public-proof Expansion C marker: ${marker}`);
const navigationMenuCss = await readFile(resolve(root, 'packages/adapters/web/components/navigation-menu.css'), 'utf8');
for (const marker of [
  '.ns-navigation-menu','.ns-navigation-menu__list','.ns-navigation-menu__link','.ns-navigation-menu__trigger','.ns-navigation-menu__panel',
  '[aria-current="page"]','[aria-expanded="true"]','var(--ns-space-navigation-gap)','var(--ns-depth-rest-x)',
  'var(--ns-press-hover-x)','var(--ns-press-active-x)','@media (prefers-reduced-motion: reduce)',
  'transition-duration: 1ms !important;','@media (forced-colors: active)','@media (max-width: 32rem)'
]) if (!navigationMenuCss.includes(marker)) fail(`navigation-menu.css missing implementation marker: ${marker}`);
const navigationMenuAdapter = await readFile(resolve(root, 'packages/adapters/web/components/navigation-menu.mjs'), 'utf8');
for (const marker of [
  'export function syncNavigationMenuState','export function setNavigationMenuOpen','export function bindNavigationMenu',
  'web adapter requires a native <nav class="ns-navigation-menu"> root','destination items must be real <a href> links',
  'at most one aria-current="page" destination','real <button type="button"> controls','nested NavigationMenu disclosure',
  "event.key !== 'Escape'","event.preventDefault();","addEventListener('focusout'","addEventListener('pointerdown'"
]) if (!navigationMenuAdapter.includes(marker)) fail(`navigation-menu.mjs missing implementation marker: ${marker}`);
for (const forbidden of [
  "from './menu-items.mjs'","event.key === 'ArrowLeft'","event.key === 'ArrowRight'","event.key === 'ArrowUp'","event.key === 'ArrowDown'",
  "event.key === 'Home'","event.key === 'End'","setAttribute('role'","setAttribute('tabindex'","setAttribute('aria-haspopup'",
  'history.pushState','history.replaceState','location.href','fetch(','XMLHttpRequest','WebSocket','requestSubmit(','form.submit('
]) if (navigationMenuAdapter.includes(forbidden)) fail(`core.navigation-menu must exclude menu-composite/router/business/network/form authority: ${forbidden}`);
let navigationMenuControllerExists = false;
try { await access(resolve(root, 'packages/core/previews/navigation-menu/controller.mjs')); navigationMenuControllerExists = true; }
catch (error) { if (error?.code !== 'ENOENT') throw error; }
if (navigationMenuControllerExists) fail('core.navigation-menu fixture/native preview must not ship an unused controller');

const toastEntry = registry.components.find((entry) => entry.id === 'core.toast');
if (!toastEntry || toastEntry.maturity !== 'public-proof') fail('core.toast must be public-proof after the dedicated Toast proof promotion');
if (toastEntry.evidence.implementation !== 'packages/adapters/web/components/toast.mjs' || toastEntry.evidence.publicProof !== 'evidence/public/core.toast.json') fail('core.toast public-proof evidence boundary is invalid');
await access(resolve(root, toastEntry.evidence.implementation));
await access(resolve(root, toastEntry.evidence.publicProof));
const toastContract = await readJson(resolve(root, 'packages/core/components/toast.json'));
if (toastContract.states.join('|') !== 'queued|visible|dismissed') fail('core.toast state contract must remain exactly queued|visible|dismissed');
const expectedToastDependencies = [
  'color.surface.panel','color.surface.interactive','color.content.primary','color.content.secondary','color.border.strong',
  'color.state.info','color.state.success','color.state.warning','color.state.error','color.focus.ring',
  'space.control.inline','space.control.block','space.surface.inline','space.surface.block',
  'size.control.minimum','border.control.width','border.surface.width','radius.control','radius.surface',
  'focus.ring.width','focus.ring.offset',
  'depth.rest.x','depth.rest.y','depth.hover.x','depth.hover.y','depth.active.x','depth.active.y',
  'press.hover.x','press.hover.y','press.active.x','press.active.y',
  'motion.press.duration','motion.release.duration','motion.standard.duration',
  'motion.press.easing','motion.release.easing','motion.standard.easing',
  'font.family.body','font.size.body','font.weight.regular','font.weight.emphasis'
];
if (toastContract.dependencies.join('|') !== expectedToastDependencies.join('|')) fail('core.toast contract dependency boundary drifted');
const toastDocs = await readFile(resolve(root, 'packages/core/components/toast.md'), 'utf8');
for (const marker of [
  'transient status-announcement primitive','## Semantic boundary','FIFO queue order','at most one visible Toast announcement at a time',
  'The canonical contract states are exactly `queued`, `visible`, and `dismissed`','default announcement channel is polite status',
  'MUST NOT be inferred from warning/error color','MUST NOT move DOM focus','Timed dismissal is optional configuration',
  'countdown pauses while the pointer is over the Toast','while focus is inside it','while the document is hidden',
  'real native `<button type="button">`','MUST NOT install global Escape handling','Toast is not Alert','Toast is not Dialog or AlertDialog',
  'Toast is not Popover or Tooltip','## Accessibility and input law','## Canonical Web implementation','`bindToast`',
  'exact deployed **45-Core / 55-token / 258-state** singleton','**258 real states**','## Token boundary',
  'Maturity is `public-proof`','`evidence/public/core.toast.json`'
]) if (!toastDocs.includes(marker)) fail(`toast.md missing public-proof Expansion C marker: ${marker}`);
const toastCss = await readFile(resolve(root, 'packages/adapters/web/components/toast.css'), 'utf8');
for (const marker of [
  '.ns-toast-region','.ns-toast','.ns-toast__dismiss','[data-tone="info"]','[data-tone="success"]','[data-tone="warning"]','[data-tone="error"]',
  'min-block-size: var(--ns-size-control-minimum)','var(--ns-depth-rest-x)','var(--ns-press-hover-x)','var(--ns-press-active-x)',
  'transition-duration: var(--ns-motion-standard-duration)','@media (max-width: 32rem)','@media (prefers-reduced-motion: reduce)',
  'transition-duration: 1ms !important;','@media (forced-colors: active)'
]) if (!toastCss.includes(marker)) fail(`toast.css missing implementation marker: ${marker}`);
const toastAdapter = await readFile(resolve(root, 'packages/adapters/web/components/toast.mjs'), 'utf8');
for (const marker of [
  'export function syncToastState','export function showNextToast','export function dismissToast','export function bindToast',
  "new Set(['queued', 'visible', 'dismissed'])","new Set(['polite', 'assertive'])",'data-toast-timeout-ms',
  'at most one visible announcement at a time','focusable Toast content must not auto-dismiss','root.ownerDocument.hidden',
  "addEventListener('pointerover'","addEventListener('focusin'","addEventListener('visibilitychange'","CustomEvent('ns-toast-dismiss'",
  "record.item.setAttribute('role', record.priority === 'assertive' ? 'alert' : 'status')"
]) if (!toastAdapter.includes(marker)) fail(`toast.mjs missing implementation marker: ${marker}`);
for (const forbidden of [
  "addEventListener('keydown'","event.key === 'Escape'","setAttribute('tabindex'","history.pushState","history.replaceState",
  'location.href','fetch(','XMLHttpRequest','WebSocket','requestSubmit(','form.submit(','role="menu"','role="dialog"',
  'role="listbox"','aria-activedescendant','longPress','swipe'
]) if (toastAdapter.includes(forbidden)) fail(`core.toast must exclude global keyboard/composite/modal/gesture/router/business/network/form authority: ${forbidden}`);
let toastControllerExists = false;
try { await access(resolve(root, 'packages/core/previews/toast/controller.mjs')); toastControllerExists = true; }
catch (error) { if (error?.code !== 'ENOENT') throw error; }
if (toastControllerExists) fail('core.toast fixture preview must not ship an unused controller');
await access(resolve(root, 'evidence/public/core.toast.json'));
try {
  await access(resolve(root, 'evidence/maintenance/core.toast.json'));
  fail('core.toast public-proof cohort must not retain a component maintenance record');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}

const tableEntry = registry.components.find((entry) => entry.id === 'core.table');
if (!tableEntry || tableEntry.maturity !== 'public-proof') fail('core.table must be public-proof after the dedicated Table proof promotion');
if (tableEntry.evidence.implementation !== 'packages/adapters/web/components/table.css' || tableEntry.evidence.publicProof !== 'evidence/public/core.table.json') fail('core.table public-proof evidence boundary is invalid');
await access(resolve(root, tableEntry.evidence.implementation));
await access(resolve(root, tableEntry.evidence.publicProof));
const tableContract = await readJson(resolve(root, 'packages/core/components/table.json'));
if (tableContract.states.join('|') !== 'rest') fail('core.table state contract must remain exactly rest');
const expectedTableDependencies = [
  'color.surface.panel','color.content.primary','color.content.secondary','color.border.default','color.border.strong',
  'space.surface.inline','space.surface.block','border.surface.width',
  'font.family.body','font.size.body','font.weight.regular','font.weight.strong'
];
if (tableContract.dependencies.join('|') !== expectedTableDependencies.join('|')) fail('core.table contract dependency boundary drifted');
const tableDocs = await readFile(resolve(root, 'packages/core/components/table.md'), 'utf8');
for (const marker of [
  'generic semantic tabular-display primitive','canonical Web host is a real `<table>`','Table is not DataTable','Table is not DataGrid',
  'canonical component state is exactly `rest`','`<th scope="col">`','`<th scope="row">`','`id` + `headers`',
  'non-interactive and non-focusable','roving `tabindex`','`aria-activedescendant`','ordinary document Tab order',
  'sorting, filtering, pagination','column resizing/reordering','inline editing','virtualization','external overflow/ScrollArea',
  'MUST NOT reflow semantic rows into fake cards','## Canonical Web implementation','CSS-only',
  'proven shipping cohort resolves all ten official Light/Dark Theme scopes at **46 Core / 55 semantic token values**','**259 real states**',
  '## Responsive, RTL, reduced-motion, and forced-colors implementation','exact deployed **46-Core / 55-token / 259-state** singleton',
  'Maturity is `public-proof`','`evidence/public/core.table.json`'
]) if (!tableDocs.includes(marker)) fail(`table.md missing public-proof Expansion D marker: ${marker}`);
const tableCss = await readFile(resolve(root, 'packages/adapters/web/components/table.css'), 'utf8');
for (const marker of [
  '.ns-table','border-collapse: collapse','table-layout: auto','.ns-table caption','.ns-table th','.ns-table td',
  'th[scope="row"]','.ns-table tfoot','text-align: start','overflow-wrap: anywhere','@media (max-width: 32rem)',
  '@media (forced-colors: active)','background: Canvas','border-color: CanvasText'
]) if (!tableCss.includes(marker)) fail(`table.css missing implementation marker: ${marker}`);
for (const forbidden of [
  'var(--ns-depth-','var(--ns-press-','var(--ns-motion-','transition:','transition-property','animation:','transform:',
  'cursor: pointer','role="grid"','role="table"','aria-selected','aria-activedescendant'
]) if (tableCss.includes(forbidden)) fail(`core.table must remain a non-interactive motionless native semantic surface: ${forbidden}`);
try {
  await access(resolve(root, 'packages/adapters/web/components/table.mjs'));
  fail('core.table CSS-only implementation must not create table.mjs');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
try {
  await access(resolve(root, 'packages/core/previews/table/controller.mjs'));
  fail('core.table fixture preview must not ship a controller');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
await access(resolve(root, 'evidence/public/core.table.json'));
try {
  await access(resolve(root, 'evidence/maintenance/core.table.json'));
  fail('core.table public-proof cohort must not retain a component maintenance record');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}

const dataGridEntry = registry.components.find((entry) => entry.id === 'core.data-grid');
if (!dataGridEntry || dataGridEntry.maturity !== 'public-proof') fail('core.data-grid must be public-proof after the dedicated DataGrid proof promotion');
if (dataGridEntry.evidence.implementation !== 'packages/adapters/web/components/data-grid.mjs' || dataGridEntry.evidence.publicProof !== 'evidence/public/core.data-grid.json') fail('core.data-grid public-proof evidence boundary is invalid');
await access(resolve(root, dataGridEntry.evidence.implementation));
await access(resolve(root, dataGridEntry.evidence.publicProof));
const dataGridContract = await readJson(resolve(root, 'packages/core/components/data-grid.json'));
if (dataGridContract.states.join('|') !== 'rest|hover|focus-visible|selected|editing') fail('core.data-grid state contract must remain exactly rest|hover|focus-visible|selected|editing');
const expectedDataGridDependencies = [
  'color.surface.panel','color.surface.interactive','color.content.primary','color.content.secondary',
  'color.border.default','color.border.strong','color.action.primary.surface','color.action.primary.content','color.focus.ring',
  'space.control.inline','space.control.block','space.surface.inline','space.surface.block',
  'size.control.minimum','border.control.width','border.surface.width','focus.ring.width','focus.ring.offset',
  'font.family.body','font.size.body','font.weight.regular','font.weight.emphasis','font.weight.strong'
];
if (dataGridContract.dependencies.join('|') !== expectedDataGridDependencies.join('|')) fail('core.data-grid contract dependency boundary drifted');
const dataGridDocs = await readFile(resolve(root, 'packages/core/components/data-grid.md'), 'utf8');
for (const marker of [
  'generic interactive tabular-data composite','DataGrid is not Table','DataGrid is not DataTable','DataGrid is not Calendar',
  'canonical component states are exactly `rest`, `hover`, `focus-visible`, `selected`, and `editing`',
  '`role="grid"`','exactly one navigable data cell is in the page Tab sequence','`tabindex="0"`','`tabindex="-1"`',
  'ArrowRight and ArrowLeft','ArrowDown and ArrowUp','Home and End','Control+Home and Control+End',
  'Focus and selection are distinct authorities','single-cell selection only','zero or one data gridcell may expose `aria-selected="true"`',
  'Space may toggle selection','Enter or F2','Escape exits edit mode and restores focus to the owning gridcell',
  'All rows/columns are DOM-resident','no spatial motion requirement','no component-specific semantic token IDs',
  '## Canonical Web implementation','shipping Web implementation is `packages/adapters/web/components/data-grid.css` plus `packages/adapters/web/components/data-grid.mjs`',
  '**264 real states**','**108 fixture + 49 native-pointer + 27 native-keyboard + 80 controller**',
  'exact deployed **47-Core / 55-token / 264-state** singleton','Maturity is `public-proof`','`evidence/public/core.data-grid.json`'
]) if (!dataGridDocs.includes(marker)) fail(`data-grid.md missing implemented Expansion D marker: ${marker}`);

const dataGridCss = await readFile(resolve(root, 'packages/adapters/web/components/data-grid.css'), 'utf8');
for (const marker of [
  '.ns-data-grid','grid-template-columns','[role="columnheader"]','[role="gridcell"]','min-block-size: var(--ns-size-control-minimum)',
  '[role="gridcell"]:focus-visible','[aria-selected="true"]','[data-editing="true"]','.ns-data-grid__editor',
  '@media (max-width: 36rem)','@media (forced-colors: active)','background: Highlight','outline-color: Highlight'
]) if (!dataGridCss.includes(marker)) fail(`data-grid.css missing implementation marker: ${marker}`);
for (const forbidden of ['var(--ns-motion-','transition:','transition-property','animation:','transform:']) if (dataGridCss.includes(forbidden)) fail(`core.data-grid must remain structurally motionless: ${forbidden}`);

const dataGridAdapter = await readFile(resolve(root, 'packages/adapters/web/components/data-grid.mjs'), 'utf8');
for (const marker of [
  'export function syncDataGridState','export function bindDataGrid','role="grid"','data-grid-cell','cell.tabIndex === 0','candidate.tabIndex = candidate === cell ? 0 : -1','editor.tabIndex = isEditing ? 0 : -1',
  "key === 'ArrowRight'","key === 'ArrowLeft'","key === 'ArrowUp'","key === 'ArrowDown'",
  "key === 'Home'","key === 'End'","root.dataset.selectionEnabled","aria-selected","setSelectedCell",
  "event.key === 'Enter'","event.key === 'F2'","event.key === 'Escape'","event.key === 'Tab'",
  'data-grid-editor','neosmartui:data-grid-edit-exit',"getComputedStyle(root).direction === 'rtl'"
]) if (!dataGridAdapter.includes(marker)) fail(`data-grid.mjs missing implementation marker: ${marker}`);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'FormData(', '.submit(', 'aria-sort', 'aria-multiselectable', 'aria-rowcount', 'aria-colcount', 'aria-level', 'role="treegrid"']) if (dataGridAdapter.includes(forbidden)) fail(`core.data-grid must not acquire data/business/tree/virtual authority: ${forbidden}`);

const dataGridPreview = await readJson(resolve(root, 'packages/core/previews/data-grid/preview.json'));
if (dataGridPreview.component !== 'core.data-grid' || dataGridPreview.defaultState !== 'rest' || dataGridPreview.controller !== 'controller.mjs') fail('core.data-grid preview identity/controller boundary drifted');
if (Object.keys(dataGridPreview.stateRealization).join('|') !== 'rest|hover|focus-visible|selected|editing') fail('core.data-grid preview state set must exactly match the contract');
if (dataGridPreview.stateRealization.rest.mode !== 'fixture' || dataGridPreview.stateRealization.hover.mode !== 'native-pointer' || dataGridPreview.stateRealization['focus-visible'].mode !== 'native-keyboard' || dataGridPreview.stateRealization.selected.mode !== 'controller' || dataGridPreview.stateRealization.editing.mode !== 'controller') fail('core.data-grid preview realization modes drifted');
if ((dataGridPreview.renderers?.web?.bindings ?? []).length !== 1 || dataGridPreview.renderers.web.bindings[0]?.module !== 'packages/adapters/web/components/data-grid.mjs' || dataGridPreview.renderers.web.bindings[0]?.export !== 'bindDataGrid' || dataGridPreview.renderers.web.bindings[0]?.selector !== '#data-grid-demo') fail('core.data-grid canonical binding boundary drifted');
await access(resolve(root, 'packages/core/previews/data-grid/fixture.html'));
await access(resolve(root, 'packages/core/previews/data-grid/controller.mjs'));
await access(resolve(root, 'evidence/public/core.data-grid.json'));
try {
  await access(resolve(root, 'evidence/maintenance/core.data-grid.json'));
  fail('core.data-grid public-proof cohort must not retain a component maintenance record');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}

const itemEntry = registry.components.find((entry) => entry.id === 'core.item');
if (!itemEntry || itemEntry.maturity !== 'public-proof') fail('core.item must be public-proof after the dedicated Item proof promotion');
if (itemEntry.evidence.implementation !== 'packages/adapters/web/components/item.css' || itemEntry.evidence.publicProof !== 'evidence/public/core.item.json') fail('core.item public-proof evidence boundary is invalid');
await access(resolve(root, itemEntry.evidence.implementation));
await access(resolve(root, itemEntry.evidence.publicProof));
const itemContract = await readJson(resolve(root, 'packages/core/components/item.json'));
if (itemContract.states.join('|') !== 'rest') fail('core.item state contract must remain exactly rest');
const expectedItemDependencies = [
  'color.surface.panel','color.content.primary','color.content.secondary','color.border.default',
  'space.surface.inline','space.surface.block','border.surface.width',
  'font.family.body','font.size.body','font.weight.regular','font.weight.strong'
];
if (itemContract.dependencies.join('|') !== expectedItemDependencies.join('|')) fail('core.item contract dependency boundary drifted');
const itemDocs = await readFile(resolve(root, 'packages/core/components/item.md'), 'utf8');
for (const marker of [
  'generic structured content row','Item is not List','Item is not Card','semantic host is composition-owned',
  'canonical component state is exactly `rest`','MUST NOT become whole-row clickable','ordinary document Tab order',
  'no inherent `list`, `option`, `menuitem`, `treeitem`, `gridcell`, button, link, checkbox, selection or disclosure role',
  'roving `tabindex`','`aria-activedescendant`','Arrow/Home/End','owns no spatial motion requirement',
  '## Canonical Web implementation','CSS-only','**265 real states**','**109 fixture + 49 native-pointer + 27 native-keyboard + 80 controller**',
  'exact deployed **48-Core / 55-token / 265-state** singleton','Maturity is `public-proof`','`evidence/public/core.item.json`'
]) if (!itemDocs.includes(marker)) fail(`item.md missing public-proof Expansion D marker: ${marker}`);
const itemCss = await readFile(resolve(root, 'packages/adapters/web/components/item.css'), 'utf8');
for (const marker of [
  '.ns-item','flex-wrap: wrap','.ns-item__leading','.ns-item__content','.ns-item__title','.ns-item__description',
  '.ns-item__metadata','.ns-item__trailing','.ns-item__actions','overflow-wrap: anywhere',
  '@media (max-width: 36rem)','@media (forced-colors: active)','background: Canvas','border-color: CanvasText'
]) if (!itemCss.includes(marker)) fail(`item.css missing implementation marker: ${marker}`);
for (const forbidden of [
  'cursor: pointer','tabindex','role="button"','aria-selected','aria-current','aria-expanded',
  'var(--ns-color-action-','var(--ns-color-focus-','var(--ns-depth-','var(--ns-press-','var(--ns-motion-',
  'transition:','transition-property','animation:','transform:'
]) if (itemCss.includes(forbidden)) fail(`core.item must remain a non-interactive motionless structured row: ${forbidden}`);
try {
  await access(resolve(root, 'packages/adapters/web/components/item.mjs'));
  fail('core.item CSS-only implementation must not create item.mjs');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
const itemPreview = await readJson(resolve(root, 'packages/core/previews/item/preview.json'));
if (itemPreview.component !== 'core.item' || itemPreview.defaultState !== 'rest' || itemPreview.controller !== null) fail('core.item preview identity/controller boundary drifted');
if (Object.keys(itemPreview.stateRealization).join('|') !== 'rest' || itemPreview.stateRealization.rest.mode !== 'fixture' || itemPreview.stateRealization.rest.target !== '#item-demo') fail('core.item preview state realization drifted');
if ((itemPreview.renderers?.web?.bindings ?? []).length !== 0) fail('core.item must not claim a runtime binding');
if (itemPreview.fixtureComponents.join('|') !== 'core.button') fail('core.item preview must compose the proven core.button for nested action behavior');
if (itemPreview.renderers.web.styles.join('|') !== 'packages/adapters/web/components/item.css|packages/adapters/web/components/button.css') fail('core.item preview style composition drifted');
await access(resolve(root, 'packages/core/previews/item/fixture.html'));
try {
  await access(resolve(root, 'packages/core/previews/item/controller.mjs'));
  fail('core.item fixture preview must not ship a controller');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
await access(resolve(root, 'evidence/public/core.item.json'));
try {
  await access(resolve(root, 'evidence/maintenance/core.item.json'));
  fail('core.item public-proof cohort must not retain a component maintenance record');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}

const listEntry = registry.components.find((entry) => entry.id === 'core.list');
if (!listEntry || listEntry.maturity !== 'public-proof') fail('core.list must be public-proof after the dedicated List proof promotion');
if (listEntry.evidence.implementation !== 'packages/adapters/web/components/list.css' || listEntry.evidence.publicProof !== 'evidence/public/core.list.json') fail('core.list public-proof evidence boundary is invalid');
await access(resolve(root, listEntry.evidence.implementation));
await access(resolve(root, listEntry.evidence.publicProof));
const listContract = await readJson(resolve(root, 'packages/core/components/list.json'));
if (listContract.states.join('|') !== 'rest') fail('core.list state contract must remain exactly rest');
const expectedListDependencies = [
  'color.content.primary','color.content.secondary','color.border.default',
  'space.surface.inline','space.surface.block','border.surface.width',
  'font.family.body','font.size.body','font.weight.regular','font.weight.strong'
];
if (listContract.dependencies.join('|') !== expectedListDependencies.join('|')) fail('core.list contract dependency boundary drifted');
const listDocs = await readFile(resolve(root, 'packages/core/components/list.md'), 'utf8');
for (const marker of [
  'generic semantic collection primitive','List owns collection semantics; Item owns one structured row/unit',
  'real `<ul>`','real `<ol>`','real `<li>`','role="list"','role="listitem"',
  'Ordered versus unordered is authored document meaning','canonical component state is exactly `rest`',
  'List is not Listbox','List is not Menu, TreeView, DataGrid, NavigationMenu, Tabs or Feed',
  'Timeline and DataTable remain Blocks/compositions','MUST NOT enter the page Tab sequence',
  'ordinary document Tab order','roving `tabindex`','`aria-activedescendant`','Arrow/Home/End keyboard model',
  'Nested lists remain nested','owns no spatial motion requirement','no component-specific semantic token IDs',
  'CSS-only','**266 real states**','exact deployed **49-Core / 55-token / 266-state** singleton',
  'Maturity is `public-proof`','`evidence/public/core.list.json`'
]) if (!listDocs.includes(marker)) fail(`list.md missing public-proof Expansion D marker: ${marker}`);
const listCss = await readFile(resolve(root, 'packages/adapters/web/components/list.css'), 'utf8');
for (const marker of [
  '.ns-list','.ns-list > li','.ns-list > li::marker','.ns-list .ns-list',
  'padding-inline-start','border-block-end','overflow-wrap: anywhere','@media (max-width: 36rem)','@media (forced-colors: active)'
]) if (!listCss.includes(marker)) fail(`list.css missing implementation marker: ${marker}`);
for (const forbidden of [
  'var(--ns-depth-','var(--ns-press-','var(--ns-motion-','transition:','transition-property','animation:','transform:',
  'cursor: pointer','role="listbox"','aria-selected','aria-activedescendant'
]) if (listCss.includes(forbidden)) fail(`core.list must remain a non-interactive motionless semantic collection surface: ${forbidden}`);
try {
  await access(resolve(root, 'packages/adapters/web/components/list.mjs'));
  fail('core.list CSS-only implementation must not create list.mjs');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
try {
  await access(resolve(root, 'packages/core/previews/list/controller.mjs'));
  fail('core.list fixture preview must not ship a controller');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
await access(resolve(root, 'evidence/public/core.list.json'));
try {
  await access(resolve(root, 'evidence/maintenance/core.list.json'));
  fail('core.list public-proof cohort must not retain a component maintenance record');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}

const descriptionListEntry = registry.components.find((entry) => entry.id === 'core.description-list');
if (!descriptionListEntry || descriptionListEntry.maturity !== 'public-proof') fail('core.description-list must be public-proof only after v2 current-host admission');
if (descriptionListEntry.evidence.implementation !== 'packages/adapters/web/components/description-list.css' || descriptionListEntry.evidence.publicProof !== 'evidence/current-host/cohort-v2.json') fail('core.description-list must bind the active v2 current-host proof cohort');
await access(resolve(root, descriptionListEntry.evidence.publicProof));
await access(resolve(root, descriptionListEntry.evidence.implementation));
const descriptionListContract = await readJson(resolve(root, 'packages/core/components/description-list.json'));
if (descriptionListContract.states.join('|') !== 'rest') fail('core.description-list state contract must remain exactly rest');
const expectedDescriptionListDependencies = [
  'color.content.primary','color.content.secondary','color.border.default',
  'space.surface.inline','space.surface.block','border.surface.width',
  'font.family.body','font.size.body','font.weight.regular','font.weight.strong'
];
if (descriptionListContract.dependencies.join('|') !== expectedDescriptionListDependencies.join('|')) fail('core.description-list contract dependency boundary drifted');
const descriptionListDocs = await readFile(resolve(root, 'packages/core/components/description-list.md'), 'utf8');
for (const marker of [
  'semantic term/description display primitive','real `<dl>`','real `<dt>`','real `<dd>`',
  'DescriptionList owns term/description relationships','List owns generic ordered/unordered collection semantics',
  'Item owns one structured content row/unit','Multiple consecutive `<dt>` elements may share one following `<dd>`',
  'one `<dt>` may be followed by multiple `<dd>` elements','canonical component state is exactly `rest`',
  'MUST NOT enter the page Tab sequence','ordinary document Tab order','roving `tabindex`','`aria-activedescendant`',
  'sorting, filtering, search, pagination','MUST NOT duplicate labels','owns no spatial motion requirement',
  '## Canonical Web implementation','CSS-only','**267 real states**',
  'verified public implementation is **50 Core / 55 tokens**',
  'historical **49-Core / 55-token / 266-state** List singleton',
  'Maturity is `public-proof`','current-host `neosmartuxui/public-proof-cohort@2`'
]) if (!descriptionListDocs.includes(marker)) fail(`description-list.md missing implemented Expansion D marker: ${marker}`);
const descriptionListCss = await readFile(resolve(root, 'packages/adapters/web/components/description-list.css'), 'utf8');
for (const marker of [
  '.ns-description-list','.ns-description-list > dt','.ns-description-list > dd',
  'margin-inline-start','overflow-wrap: anywhere','@media (max-width: 36rem)','@media (forced-colors: active)'
]) if (!descriptionListCss.includes(marker)) fail(`description-list.css missing implementation marker: ${marker}`);
for (const forbidden of [
  'var(--ns-depth-','var(--ns-press-','var(--ns-motion-','transition:','transition-property','animation:','transform:',
  'cursor: pointer','role="list"','role="table"','role="grid"','aria-selected','aria-activedescendant'
]) if (descriptionListCss.includes(forbidden)) fail(`core.description-list must remain a passive motionless native semantic surface: ${forbidden}`);
try {
  await access(resolve(root, 'packages/adapters/web/components/description-list.mjs'));
  fail('core.description-list CSS-only implementation must not create description-list.mjs');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
try {
  await access(resolve(root, 'packages/core/previews/description-list/controller.mjs'));
  fail('core.description-list fixture preview must not ship a controller');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
for (const path of ['evidence/public/core.description-list.json','evidence/maintenance/core.description-list.json']) {
  try { await access(resolve(root, path)); fail(`core.description-list must not fabricate a historical v1 public-proof or maintenance record: ${path}`); }
  catch (error) {
    if (error?.message?.startsWith('[core-components]')) throw error;
    if (error?.code !== 'ENOENT') throw error;
  }
}

for (const forbiddenId of ['core.focus-trap', 'core.sheet']) if (registry.components.some((entry) => entry.id === forbiddenId)) fail(`${forbiddenId} must not inflate Core breadth; FocusTrap is infrastructure and Sheet merges into Drawer`);

const multiSelectCss = await readFile(resolve(root, 'packages/adapters/web/components/multi-select.css'), 'utf8');
for (const marker of ['.ns-multi-select__trigger','.ns-multi-select__list','aria-selected="true"','var(--ns-depth-rest-x)','var(--ns-press-hover-x)','var(--ns-press-active-x)','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!multiSelectCss.includes(marker)) fail(`multi-select.css missing implementation marker: ${marker}`);
const multiSelectAdapter = await readFile(resolve(root, 'packages/adapters/web/components/multi-select.mjs'), 'utf8');
for (const marker of ['export function syncMultiSelectState','export function setMultiSelectOpen','export function setMultiSelectSelection','export function setMultiSelectHighlighted','export function setMultiSelectInvalid','export function setMultiSelectDisabled','export function toggleMultiSelectOption','export function bindMultiSelect','aria-multiselectable','aria-activedescendant','aria-selected',"event.key === 'ArrowDown'","event.key === 'ArrowUp'","event.key === 'Escape'"]) if (!multiSelectAdapter.includes(marker)) fail(`multi-select.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["event.preventDefault(); close();", "event.key === 'Tab'", "setAttribute('role'", 'freeform', 'fetch(', 'XMLHttpRequest', 'WebSocket']) if (multiSelectAdapter.includes(forbidden)) fail(`core.multi-select must preserve ordinary Tab traversal and finite local option authority: ${forbidden}`);

const fileUploadCss = await readFile(resolve(root, 'packages/adapters/web/components/file-upload.css'), 'utf8');
for (const marker of ['.ns-file-upload__dropzone','.ns-file-upload__input','::file-selector-button','var(--ns-depth-rest-x)','var(--ns-press-hover-x)','var(--ns-press-active-x)','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!fileUploadCss.includes(marker)) fail(`file-upload.css missing implementation marker: ${marker}`);
for (const forbidden of ['.ns-file-upload__dropzone:hover','.ns-file-upload__dropzone:active','transform: translate(var(--ns-press-hover-x)']) {
  if (forbidden.startsWith('.ns-file-upload__dropzone') && fileUploadCss.includes(forbidden)) fail(`core.file-upload passive drop surface must remain non-pressable: ${forbidden}`);
}
const fileUploadAdapter = await readFile(resolve(root, 'packages/adapters/web/components/file-upload.mjs'), 'utf8');
for (const marker of ['export function syncFileUploadState','export function setFileUploadFiles','export function clearFileUploadFiles','export function setFileUploadDragActive','export function setFileUploadInvalid','export function setFileUploadDisabled','export function bindFileUpload',"input.type !== 'file'",'DataTransfer',"input.addEventListener('change'","dropzone.addEventListener('dragenter'","dropzone.addEventListener('drop'"]) if (!fileUploadAdapter.includes(marker)) fail(`file-upload.mjs missing implementation marker: ${marker}`);
for (const forbidden of ['fetch(', 'XMLHttpRequest', 'WebSocket', 'requestSubmit(', 'form.submit(', 'uploadProgress', 'presigned', "addEventListener('keydown'", "setAttribute('role'", "setAttribute('tabindex'"]) if (fileUploadAdapter.includes(forbidden)) fail(`core.file-upload must preserve native local-file authority without transport/focus synthesis: ${forbidden}`);

const inputOtpCss = await readFile(resolve(root, 'packages/adapters/web/components/input-otp.css'), 'utf8');
for (const marker of ['.ns-input-otp__input','min-block-size: var(--ns-size-control-minimum)','letter-spacing: 0.45em','transform: none','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!inputOtpCss.includes(marker)) fail(`input-otp.css missing implementation marker: ${marker}`);
for (const forbidden of ['var(--ns-depth-','var(--ns-press-']) if (inputOtpCss.includes(forbidden)) fail(`core.input-otp editable surface must remain non-pressable: ${forbidden}`);
const inputOtpAdapter = await readFile(resolve(root, 'packages/adapters/web/components/input-otp.mjs'), 'utf8');
for (const marker of ['export function syncInputOtpState','export function setInputOtpValue','export function setInputOtpInvalid','export function setInputOtpDisabled','export function bindInputOtp',"input.type !== 'text'","input.autocomplete !== 'one-time-code'","input.maxLength","'empty'","'partial'","'complete'","input.addEventListener('input'","input.addEventListener('change'"]) if (!inputOtpAdapter.includes(marker)) fail(`input-otp.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["addEventListener('keydown'","addEventListener('submit'","requestSubmit(","form.submit(","setAttribute('role'","setAttribute('tabindex'"]) if (inputOtpAdapter.includes(forbidden)) fail(`core.input-otp must preserve one native editing/value authority without submit/focus synthesis: ${forbidden}`);

const multiSelectDocs = await readFile(resolve(root, 'packages/core/components/multi-select.md'), 'utf8');
for (const marker of ['zero or more committed option values', 'single-selection only', 'ordinary Tab/Shift+Tab document traversal']) if (!multiSelectDocs.includes(marker)) fail(`multi-select.md missing count/semantic marker: ${marker}`);
const otpDocs = await readFile(resolve(root, 'packages/core/components/input-otp.md'), 'utf8');
for (const marker of ['one logical form value', 'autocomplete="one-time-code"', 'MUST NOT automatically submit']) if (!otpDocs.includes(marker)) fail(`input-otp.md missing value-authority marker: ${marker}`);
const uploadDocs = await readFile(resolve(root, 'packages/core/components/file-upload.md'), 'utf8');
for (const marker of ['Drag/drop is an input mode', 'MUST NOT own network transport', 'keyboard-operable file picker']) if (!uploadDocs.includes(marker)) fail(`file-upload.md missing acquisition-boundary marker: ${marker}`);
const colorDocs = await readFile(resolve(root, 'packages/core/components/color-picker.md'), 'utf8');
for (const marker of ['opaque sRGB color value', '<input type="color">', 'MUST NOT manufacture a fake portable `open` state']) if (!colorDocs.includes(marker)) fail(`color-picker.md missing platform-picker marker: ${marker}`);
const dateDocs = await readFile(resolve(root, 'packages/core/components/date-picker.md'), 'utf8');
for (const marker of ['DateRangePicker', 'MUST NOT become a second Core ID', 'must not trap normal document Tab traversal']) if (!dateDocs.includes(marker)) fail(`date-picker.md missing range/count marker: ${marker}`);
const timeDocs = await readFile(resolve(root, 'packages/core/components/time-picker.md'), 'utf8');
for (const marker of ['local wall-clock time', '<input type="time">', 'does not own calendar dates, time zones']) if (!timeDocs.includes(marker)) fail(`time-picker.md missing time-boundary marker: ${marker}`);
const calendarDocs = await readFile(resolve(root, 'packages/core/components/calendar.md'), 'utf8');
for (const marker of ['standalone calendar-grid', 'one roving/focusable grid position', 'Range start/middle/end cannot rely only on color']) if (!calendarDocs.includes(marker)) fail(`calendar.md missing grid marker: ${marker}`);

const calendarCss = await readFile(resolve(root, 'packages/adapters/web/components/calendar.css'), 'utf8');
for (const marker of ['.ns-calendar__grid','.ns-calendar__day','var(--ns-depth-rest-x)','var(--ns-press-hover-x)','var(--ns-press-active-x)','[aria-current="date"]','[data-state="range-start"]::after','text-decoration: line-through','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!calendarCss.includes(marker)) fail(`calendar.css missing implementation marker: ${marker}`);
const calendarAdapter = await readFile(resolve(root, 'packages/adapters/web/components/calendar.mjs'), 'utf8');
for (const marker of ['export function syncCalendarState','export function setCalendarVisibleMonth','export function setCalendarActiveDate','export function setCalendarSelection','export function setCalendarUnavailableDates','export function setCalendarDisabled','export function bindCalendar',"getAttribute('role') !== 'grid'",'Date.UTC',"timeZone: 'UTC'",'tabIndex = -1','aria-current','aria-selected','aria-disabled',"event.key === 'ArrowRight'","event.key === 'ArrowLeft'","event.key === 'ArrowDown'","event.key === 'ArrowUp'","event.key === 'Home'","event.key === 'End'",'dataset.rangePosition']) if (!calendarAdapter.includes(marker)) fail(`calendar.mjs missing implementation marker: ${marker}`);
for (const forbidden of ['aria-activedescendant',"event.key === 'Tab'",'Date.parse(', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'requestSubmit(', 'form.submit(']) if (calendarAdapter.includes(forbidden)) fail(`core.calendar must preserve roving DOM focus and local date authority without transport/focus trapping: ${forbidden}`);

const datePickerCss = await readFile(resolve(root, 'packages/adapters/web/components/date-picker.css'), 'utf8');
for (const marker of ['.ns-date-picker__input','.ns-date-picker__trigger','.ns-date-picker__popup','transform: none','var(--ns-depth-rest-x)','var(--ns-press-hover-x)','var(--ns-press-active-x)','var(--ns-color-state-error)','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!datePickerCss.includes(marker)) fail(`date-picker.css missing implementation marker: ${marker}`);
const datePickerAdapter = await readFile(resolve(root, 'packages/adapters/web/components/date-picker.mjs'), 'utf8');
for (const marker of ["from './calendar.mjs'","export function syncDatePickerState","export function setDatePickerOpen","export function setDatePickerMode","export function setDatePickerValue","export function setDatePickerInvalid","export function setDatePickerDisabled","export function bindDatePicker","bindCalendar(parts.calendar)","setCalendarSelection","setCalendarActiveDate","Date.UTC","aria-modal","queueMicrotask","event.key !== 'Enter'","event.key !== 'Escape'","root.addEventListener('focusout'"]) if (!datePickerAdapter.includes(marker)) fail(`date-picker.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["event.key === 'Tab'","event.key === 'ArrowLeft'","event.key === 'ArrowRight'","event.key === 'ArrowUp'","event.key === 'ArrowDown'","event.key === 'PageUp'","event.key === 'PageDown'","event.key === 'Home'","event.key === 'End'",'Date.parse(', 'fetch(', 'XMLHttpRequest', 'WebSocket', 'requestSubmit(', 'form.submit(', 'timeZone', 'appointment', 'scheduling']) if (datePickerAdapter.includes(forbidden)) fail(`core.date-picker must preserve Calendar-owned navigation, ordinary Tab traversal, and date-only local authority: ${forbidden}`);

const colorPickerCss = await readFile(resolve(root, 'packages/adapters/web/components/color-picker.css'), 'utf8');
for (const marker of ['.ns-color-picker__input','::-webkit-color-swatch','var(--ns-depth-rest-x)','var(--ns-press-hover-x)','var(--ns-press-active-x)','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!colorPickerCss.includes(marker)) fail(`color-picker.css missing implementation marker: ${marker}`);
const colorPickerAdapter = await readFile(resolve(root, 'packages/adapters/web/components/color-picker.mjs'), 'utf8');
for (const marker of ['export function syncColorPickerState','export function setColorPickerValue','export function setColorPickerInvalid','export function setColorPickerDisabled','export function bindColorPicker',"input.type !== 'color'",'opaque six-digit sRGB hex color',"input.addEventListener('input'","input.addEventListener('change'"]) if (!colorPickerAdapter.includes(marker)) fail(`color-picker.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["addEventListener('keydown'", 'showPicker(', "setAttribute('role'", 'data-open', 'aria-expanded']) if (colorPickerAdapter.includes(forbidden)) fail(`core.color-picker must preserve native platform-picker authority: ${forbidden}`);

const timePickerCss = await readFile(resolve(root, 'packages/adapters/web/components/time-picker.css'), 'utf8');
for (const marker of ['.ns-time-picker__input','transform: none','var(--ns-color-state-error)',':read-only','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!timePickerCss.includes(marker)) fail(`time-picker.css missing implementation marker: ${marker}`);
for (const forbidden of ['var(--ns-depth-', 'var(--ns-press-']) if (timePickerCss.includes(forbidden)) fail(`core.time-picker editable surface must remain non-pressable: ${forbidden}`);
const timePickerAdapter = await readFile(resolve(root, 'packages/adapters/web/components/time-picker.mjs'), 'utf8');
for (const marker of ['export function syncTimePickerState','export function setTimePickerValue','export function setTimePickerInvalid','export function setTimePickerReadOnly','export function setTimePickerDisabled','export function bindTimePicker',"input.type !== 'time'","input.addEventListener('input'","input.addEventListener('change'"]) if (!timePickerAdapter.includes(marker)) fail(`time-picker.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["addEventListener('keydown'", 'showPicker(', "setAttribute('role'", 'data-open', 'aria-expanded', 'ArrowUp', 'ArrowDown', 'Home', 'End']) if (timePickerAdapter.includes(forbidden)) fail(`core.time-picker must preserve native time-input behavior: ${forbidden}`);

const forbiddenMergedIds = new Map([
  ['core.native-select', 'canonical core.select already owns the real native single-select capability'],
  ['core.search-field', 'canonical core.input already supports native type=search; clear/submit remain InputGroup + Button composition'],
  ['core.rating', 'canonical core.radio already owns mutually-exclusive choice semantics; ordinal/star presentation remains composition']
]);
for (const [id, reason] of forbiddenMergedIds) if (registry.components.some((entry) => entry.id === id)) fail(`${id} must not exist: ${reason}`);
const searchOwnerDocs = await readFile(resolve(root, 'packages/core/components/input.md'), 'utf8');
const searchOwnerAdapter = await readFile(resolve(root, 'packages/adapters/web/components/input.mjs'), 'utf8');
for (const marker of ['`search`', 'prefix/suffix action']) if (!searchOwnerDocs.includes(marker)) fail(`core.input must retain SearchField merge authority: ${marker}`);
if (!searchOwnerAdapter.includes("'search'")) fail('core.input adapter must retain native search input support');
const ratingOwnerDocs = await readFile(resolve(root, 'packages/core/components/radio.md'), 'utf8');
for (const marker of ['generic mutually-exclusive choice primitive', 'arrow-key movement/selection', 'Choice-card presentation is a separate composition']) if (!ratingOwnerDocs.includes(marker)) fail(`core.radio must retain Rating merge authority: ${marker}`);

const buttonGroupCss = await readFile(resolve(root, 'packages/adapters/web/components/button-group.css'), 'utf8');
for (const marker of ['display: inline-flex','var(--ns-space-control-inline)','var(--ns-radius-control)','[data-orientation="vertical"]','@media (forced-colors: active)']) if (!buttonGroupCss.includes(marker)) fail(`button-group.css missing grouped-control marker: ${marker}`);
for (const forbidden of ['aria-pressed', 'role="tab"', 'transform: translate', 'box-shadow: var(--ns-depth-']) if (buttonGroupCss.includes(forbidden)) fail(`core.button-group must not invent selection/pressure semantics: ${forbidden}`);

const inputGroupCss = await readFile(resolve(root, 'packages/adapters/web/components/input-group.css'), 'utf8');
for (const marker of ['display: flex','var(--ns-color-surface-interactive)','var(--ns-color-border-default)',':focus-within','var(--ns-color-focus-ring)',':has(.ns-input[aria-invalid="true"])','var(--ns-opacity-disabled)','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!inputGroupCss.includes(marker)) fail(`input-group.css missing composite-input marker: ${marker}`);
for (const forbidden of ['var(--ns-press-', 'var(--ns-depth-', 'cursor: pointer']) if (inputGroupCss.includes(forbidden)) fail(`core.input-group must keep the editing surface non-pressable: ${forbidden}`);

const toggleCss = await readFile(resolve(root, 'packages/adapters/web/components/toggle.css'), 'utf8');
for (const marker of ['.ns-toggle','aria-pressed="true"','var(--ns-size-control-minimum)','var(--ns-depth-rest-x)','var(--ns-press-hover-x)','var(--ns-press-active-x)','border-style: double','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!toggleCss.includes(marker)) fail(`toggle.css missing implementation marker: ${marker}`);
const toggleAdapter = await readFile(resolve(root, 'packages/adapters/web/components/toggle.mjs'), 'utf8');
for (const marker of ['export function syncToggleState','export function setTogglePressed','export function setToggleDisabled','export function bindToggle',"toggle.tagName !== 'BUTTON'","toggle.type !== 'button'",'aria-pressed',"toggle.addEventListener('click'","toggle.removeEventListener('click'"]) if (!toggleAdapter.includes(marker)) fail(`toggle.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["addEventListener('keydown'", "setAttribute('role'", 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']) if (toggleAdapter.includes(forbidden)) fail(`core.toggle must preserve native Button activation without invented composite semantics: ${forbidden}`);

const toggleGroupCss = await readFile(resolve(root, 'packages/adapters/web/components/toggle-group.css'), 'utf8');
for (const marker of ['.ns-toggle-group','var(--ns-space-control-inline)','var(--ns-space-control-block)','[data-orientation="vertical"]','[data-disabled="true"]','var(--ns-opacity-disabled)','@media (forced-colors: active)']) if (!toggleGroupCss.includes(marker)) fail(`toggle-group.css missing implementation marker: ${marker}`);
const toggleGroupAdapter = await readFile(resolve(root, 'packages/adapters/web/components/toggle-group.mjs'), 'utf8');
for (const marker of ['export function syncToggleGroup','export function setToggleGroupSelection','export function setToggleGroupDisabled','export function bindToggleGroup','data-selection-mode="single" or "multiple"',"['single', 'multiple'].includes(mode)",'single mode permits at most one pressed Toggle',"toggle.addEventListener('click'","toggle.removeEventListener('click'"]) if (!toggleGroupAdapter.includes(marker)) fail(`toggle-group.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["addEventListener('keydown'", "setAttribute('role'", "setAttribute('tabindex'", 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'role="radiogroup"', 'role="tablist"']) if (toggleGroupAdapter.includes(forbidden)) fail(`core.toggle-group must preserve ordinary Tab traversal and Toggle semantics: ${forbidden}`);

const numberFieldCss = await readFile(resolve(root, 'packages/adapters/web/components/number-field.css'), 'utf8');
for (const marker of ['.ns-number-field','.ns-number-field__input','appearance: textfield','transform: none','.ns-number-field__step','var(--ns-depth-rest-x)','var(--ns-press-hover-x)','var(--ns-press-active-x)','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!numberFieldCss.includes(marker)) fail(`number-field.css missing implementation marker: ${marker}`);
const numberFieldAdapter = await readFile(resolve(root, 'packages/adapters/web/components/number-field.mjs'), 'utf8');
for (const marker of ['export function syncNumberFieldState','export function setNumberFieldValue','export function setNumberFieldInvalid','export function setNumberFieldReadOnly','export function setNumberFieldDisabled','export function bindNumberField',"input.type !== 'number'",'input.stepUp()','input.stepDown()',"'input'", "'change'"]) if (!numberFieldAdapter.includes(marker)) fail(`number-field.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["addEventListener('keydown'", "setAttribute('role'", 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']) if (numberFieldAdapter.includes(forbidden)) fail(`core.number-field must preserve native numeric editing/keyboard semantics: ${forbidden}`);

const sliderCss = await readFile(resolve(root, 'packages/adapters/web/components/slider.css'), 'utf8');
for (const marker of ['.ns-slider','.ns-slider__input','::-webkit-slider-thumb','::-moz-range-thumb','pointer-events: auto','var(--ns-depth-rest-x)','var(--ns-press-hover-x)','var(--ns-press-active-x)','writing-mode: vertical-lr','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!sliderCss.includes(marker)) fail(`slider.css missing implementation marker: ${marker}`);
const sliderAdapter = await readFile(resolve(root, 'packages/adapters/web/components/slider.mjs'), 'utf8');
for (const marker of ['export function syncSlider','export function setSliderDisabled','export function setSliderValues','export function bindSlider','data-slider-mode="single" or "range"',"input.type !== 'range'","input.dataset.sliderThumb === 'lower'","input.dataset.sliderThumb === 'upper'","parts.lower.max = String(upperValue)","parts.upper.min = String(lowerValue)","input.addEventListener('input'","input.addEventListener('change'"]) if (!sliderAdapter.includes(marker)) fail(`slider.mjs missing implementation marker: ${marker}`);
for (const forbidden of ["addEventListener('keydown'", "setAttribute('role'", "setAttribute('tabindex'", 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End']) if (sliderAdapter.includes(forbidden)) fail(`core.slider must preserve native range keyboard/value semantics: ${forbidden}`);

const labelCss = await readFile(resolve(root, 'packages/adapters/web/components/label.css'), 'utf8');
for (const marker of ['var(--ns-color-content-primary)','var(--ns-color-content-secondary)','var(--ns-font-size-label)','var(--ns-font-weight-emphasis)','var(--ns-opacity-disabled)','@media (forced-colors: active)']) if (!labelCss.includes(marker)) fail(`label.css missing marker: ${marker}`);
for (const forbidden of [':hover',':active',':focus',':focus-visible','transform: translate']) if (labelCss.includes(forbidden)) fail(`core.label must not invent interaction: ${forbidden}`);

const separatorCss = await readFile(resolve(root, 'packages/adapters/web/components/separator.css'), 'utf8');
for (const marker of ['var(--ns-color-border-default)','var(--ns-border-surface-width)','[aria-orientation="vertical"]','@media (forced-colors: active)','transform: none','transition: none']) if (!separatorCss.includes(marker)) fail(`separator.css missing marker: ${marker}`);
for (const forbidden of [':hover',':active',':focus',':focus-visible','box-shadow: var(--ns-depth-']) if (separatorCss.includes(forbidden)) fail(`core.separator must remain non-interactive: ${forbidden}`);

const progressCss = await readFile(resolve(root, 'packages/adapters/web/components/progress.css'), 'utf8');
for (const marker of ['appearance: none','::-webkit-progress-value','::-moz-progress-bar',':not([value])','var(--ns-color-action-primary-surface)','var(--ns-motion-standard-duration)','@media (prefers-reduced-motion: reduce)','@media (forced-colors: active)']) if (!progressCss.includes(marker)) fail(`progress.css missing native-progress marker: ${marker}`);
for (const forbidden of [':hover',':active',':focus-visible','cursor: pointer','var(--ns-press-','var(--ns-depth-']) if (progressCss.includes(forbidden)) fail(`core.progress must remain reporting-only: ${forbidden}`);

const spinnerCss = await readFile(resolve(root, 'packages/adapters/web/components/spinner.css'), 'utf8');
for (const marker of ['var(--ns-color-border-default)','var(--ns-color-action-primary-surface)','var(--ns-motion-standard-duration)','@keyframes ns-spinner-turn','@media (prefers-reduced-motion: reduce)','animation: none','@media (forced-colors: active)']) if (!spinnerCss.includes(marker)) fail(`spinner.css missing busy-indicator marker: ${marker}`);
for (const forbidden of [':hover',':active',':focus-visible','cursor: pointer']) if (spinnerCss.includes(forbidden)) fail(`core.spinner must remain non-interactive: ${forbidden}`);

const nativeSelectCandidate = registry.components.find((entry) => entry.id === 'core.native-select');
if (nativeSelectCandidate) fail('core.native-select must not exist: canonical core.select already owns the real native single-select capability');

const button = await readJson(resolve(root, 'packages/core/components/button.json'));
for (const state of ['rest', 'hover', 'focus-visible', 'pressed', 'loading', 'disabled']) if (!button.states.includes(state)) fail(`core.button missing state ${state}`);
for (const token of ['depth.rest.x', 'depth.hover.x', 'depth.active.x', 'press.hover.x', 'press.active.x', 'motion.press.duration', 'motion.release.duration', 'color.focus.ring']) if (!button.dependencies.includes(token)) fail(`core.button missing tactile token ${token}`);
const buttonDocs = await readFile(resolve(root, 'packages/core/components/button.md'), 'utf8');
for (const marker of ['real `<button>`', 'MUST NOT increase apparent elevation', 'Loading prevents duplicate activation', 'Reduced motion removes non-essential travel/rebound']) if (!buttonDocs.includes(marker)) fail(`button.md missing marker: ${marker}`);

const checkbox = await readJson(resolve(root, 'packages/core/components/checkbox.json'));
for (const state of ['rest', 'hover', 'focus-visible', 'pressed', 'unchecked', 'checked', 'indeterminate', 'invalid', 'disabled']) if (!checkbox.states.includes(state)) fail(`core.checkbox missing state ${state}`);
for (const token of ['color.surface.interactive', 'color.action.primary.surface', 'color.state.error', 'size.control.minimum', 'depth.rest.x', 'depth.hover.x', 'depth.active.x', 'press.hover.x', 'press.active.x', 'motion.press.duration', 'motion.release.duration', 'color.focus.ring']) if (!checkbox.dependencies.includes(token)) fail(`core.checkbox missing semantic/tactile token ${token}`);
const checkboxEntry = registry.components.find((entry) => entry.id === 'core.checkbox');
if (!checkboxEntry || !['implemented', 'public-proof'].includes(checkboxEntry.maturity)) fail('core.checkbox must be at least implemented');
if (checkboxEntry.evidence.implementation !== 'packages/adapters/web/components/checkbox.mjs') fail('core.checkbox implementation evidence must bind the canonical Web adapter');
if (checkboxEntry.maturity === 'implemented' && checkboxEntry.evidence.publicProof !== null) fail('implemented core.checkbox must not claim public proof');
if (checkboxEntry.maturity === 'public-proof' && checkboxEntry.evidence.publicProof !== 'evidence/public/core.checkbox.json') fail('public-proof core.checkbox must bind its canonical proof record');
await access(resolve(root, 'packages/adapters/web/components/checkbox.css'));
const checkboxDocs = await readFile(resolve(root, 'packages/core/components/checkbox.md'), 'utf8');
for (const marker of ['indeterminate', 'MUST NOT increase apparent elevation', 'effective interactive hit target MUST meet or exceed `size.control.minimum`', 'no legacy implementation code is copied']) if (!checkboxDocs.includes(marker)) fail(`checkbox.md missing marker: ${marker}`);

const input = await readJson(resolve(root, 'packages/core/components/input.json'));
for (const state of ['rest', 'hover', 'focus-visible', 'empty', 'filled', 'invalid', 'read-only', 'disabled']) if (!input.states.includes(state)) fail(`core.input missing state ${state}`);
for (const token of ['color.surface.interactive', 'color.content.primary', 'color.content.secondary', 'color.border.default', 'color.state.error', 'size.control.minimum', 'color.focus.ring', 'opacity.disabled', 'font.family.body', 'motion.standard.duration']) if (!input.dependencies.includes(token)) fail(`core.input missing semantic token ${token}`);
for (const forbidden of ['depth.rest.x', 'press.hover.x', 'press.active.x']) if (input.dependencies.includes(forbidden)) fail(`core.input must not depend on press-depth token ${forbidden}`);
const inputEntry = registry.components.find((entry) => entry.id === 'core.input');
if (!inputEntry || !['implemented', 'public-proof'].includes(inputEntry.maturity)) fail('core.input must be at least implemented');
if (inputEntry.evidence.implementation !== 'packages/adapters/web/components/input.mjs') fail('core.input implementation evidence must bind the canonical Web adapter');
if (inputEntry.maturity === 'implemented' && inputEntry.evidence.publicProof !== null) fail('implemented core.input must not claim public proof');
if (inputEntry.maturity === 'public-proof' && inputEntry.evidence.publicProof !== 'evidence/public/core.input.json') fail('public-proof core.input must bind its canonical proof record');
await access(resolve(root, 'packages/adapters/web/components/input.css'));
const inputDocs = await readFile(resolve(root, 'packages/core/components/input.md'), 'utf8');
for (const marker of ['real native `<input>`', 'interactive, not pressable', 'placeholder MAY provide an example or hint, but MUST NOT substitute for an accessible name', 'Read-only and disabled are not interchangeable states', 'no legacy implementation code is copied']) if (!inputDocs.includes(marker)) fail(`input.md missing marker: ${marker}`);

const textarea = await readJson(resolve(root, 'packages/core/components/textarea.json'));
for (const state of ['rest', 'hover', 'focus-visible', 'empty', 'filled', 'invalid', 'read-only', 'disabled']) if (!textarea.states.includes(state)) fail(`core.textarea missing state ${state}`);
for (const token of ['color.surface.interactive', 'color.content.primary', 'color.content.secondary', 'color.border.default', 'color.state.error', 'size.control.minimum', 'color.focus.ring', 'opacity.disabled', 'font.family.body', 'motion.standard.duration']) if (!textarea.dependencies.includes(token)) fail(`core.textarea missing semantic token ${token}`);
for (const forbidden of ['depth.rest.x', 'press.hover.x', 'press.active.x']) if (textarea.dependencies.includes(forbidden)) fail(`core.textarea must not depend on press-depth token ${forbidden}`);
const textareaEntry = registry.components.find((entry) => entry.id === 'core.textarea');
if (!textareaEntry || textareaEntry.maturity !== 'public-proof') fail('core.textarea must be public-proof in this slice');
if (textareaEntry.evidence.implementation !== 'packages/adapters/web/components/textarea.mjs') fail('core.textarea implementation evidence must bind the canonical Web adapter');
if (textareaEntry.evidence.publicProof !== 'evidence/public/core.textarea.json') fail('public-proof core.textarea must bind its canonical proof record');
await access(resolve(root, 'packages/adapters/web/components/textarea.css'));
const textareaAdapter = await readFile(resolve(root, 'packages/adapters/web/components/textarea.mjs'), 'utf8');
for (const marker of ['export function syncTextareaState', 'export function bindTextarea', "textarea.tagName !== 'TEXTAREA'", "textarea.value.length === 0 ? 'empty' : 'filled'", "textarea.addEventListener('input'", "textarea.addEventListener('change'"]) if (!textareaAdapter.includes(marker)) fail(`textarea.mjs missing implementation marker: ${marker}`);
const textareaDocs = await readFile(resolve(root, 'packages/core/components/textarea.md'), 'utf8');
for (const marker of ['real native `<textarea>`', 'interactive, not pressable', 'line breaks', 'Core MUST NOT globally disable resize', 'No textarea-specific Rivet implementation artifact is claimed', 'Maturity is `public-proof`']) if (!textareaDocs.includes(marker)) fail(`textarea.md missing marker: ${marker}`);

const select = await readJson(resolve(root, 'packages/core/components/select.json'));
for (const state of ['rest', 'hover', 'focus-visible', 'pressed', 'selected', 'invalid', 'disabled']) if (!select.states.includes(state)) fail(`core.select missing state ${state}`);
for (const forbiddenState of ['open', 'read-only', 'loading']) if (select.states.includes(forbiddenState)) fail(`core.select must not invent unsupported state ${forbiddenState}`);
for (const token of ['color.surface.interactive', 'color.content.primary', 'color.content.secondary', 'color.border.default', 'color.border.strong', 'color.state.error', 'size.control.minimum', 'depth.rest.x', 'depth.hover.x', 'depth.active.x', 'press.hover.x', 'press.active.x', 'motion.press.duration', 'motion.release.duration', 'color.focus.ring', 'opacity.disabled', 'font.family.body']) if (!select.dependencies.includes(token)) fail(`core.select missing semantic/tactile token ${token}`);
const selectEntry = registry.components.find((entry) => entry.id === 'core.select');
if (!selectEntry || selectEntry.maturity !== 'public-proof') fail('core.select must be public-proof in this slice');
if (selectEntry.evidence.implementation !== 'packages/adapters/web/components/select.mjs') fail('core.select implementation evidence must bind the canonical Web adapter');
if (selectEntry.evidence.publicProof !== 'evidence/public/core.select.json') fail('public-proof core.select must bind its canonical proof record');
await access(resolve(root, 'packages/adapters/web/components/select.css'));
const selectAdapter = await readFile(resolve(root, 'packages/adapters/web/components/select.mjs'), 'utf8');
for (const marker of ['export function syncSelectState', 'export function bindSelect', "select.tagName !== 'SELECT'", 'select.multiple', 'select.size > 1', 'data', 'pointerdown', "select.addEventListener('change'"]) if (!selectAdapter.includes(marker)) fail(`select.mjs missing implementation marker: ${marker}`);
const selectDocs = await readFile(resolve(root, 'packages/core/components/select.md'), 'utf8');
for (const marker of ['real native single-select `<select>`', '`multiple` absent/false', 'contract intentionally does not invent a portable `open` state', 'collapsed single-select is a choice trigger', 'HTML has no native select `placeholder` attribute', 'No select-specific Rivet implementation artifact is claimed', 'Maturity is `public-proof`']) if (!selectDocs.includes(marker)) fail(`select.md missing marker: ${marker}`);

const card = await readJson(resolve(root, 'packages/core/components/card.json'));
if (card.states.length !== 1 || card.states[0] !== 'rest') fail('core.card informational contract must expose only rest state');
for (const forbiddenState of ['hover', 'focus-visible', 'pressed', 'selected', 'loading', 'disabled', 'invalid']) if (card.states.includes(forbiddenState)) fail(`core.card informational contract must not expose interactive state ${forbiddenState}`);
for (const token of ['color.surface.panel', 'color.content.primary', 'color.content.secondary', 'color.border.strong', 'space.surface.inline', 'space.surface.block', 'border.surface.width', 'radius.surface', 'depth.rest.x', 'depth.rest.y', 'font.family.body', 'font.size.body', 'font.weight.regular', 'font.weight.strong']) if (!card.dependencies.includes(token)) fail(`core.card missing surface/content token ${token}`);
for (const forbiddenToken of ['space.control.inline', 'space.control.block', 'border.control.width', 'radius.control', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y', 'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y', 'motion.press.duration', 'motion.release.duration', 'color.action.primary.surface', 'color.focus.ring', 'opacity.disabled']) if (card.dependencies.includes(forbiddenToken)) fail(`core.card informational contract must not borrow control/press token ${forbiddenToken}`);
const cardEntry = registry.components.find((entry) => entry.id === 'core.card');
if (!cardEntry || cardEntry.maturity !== 'public-proof') fail('core.card must be public-proof in this slice');
if (cardEntry.evidence.implementation !== 'packages/adapters/web/components/card.css') fail('core.card implementation evidence must bind the CSS-only Web implementation');
if (cardEntry.evidence.publicProof !== 'evidence/public/core.card.json') fail('public-proof core.card must bind its canonical proof record');
const cardCss = await readFile(resolve(root, 'packages/adapters/web/components/card.css'), 'utf8');
for (const marker of ['padding-block: var(--ns-space-surface-block)', 'padding-inline: var(--ns-space-surface-inline)', 'border: var(--ns-border-surface-width)', 'border-radius: var(--ns-radius-surface)', 'box-shadow: var(--ns-depth-rest-x) var(--ns-depth-rest-y)', 'transform: none', 'transition: none', '@media (forced-colors: active)']) if (!cardCss.includes(marker)) fail(`card.css missing static-surface marker: ${marker}`);
for (const forbiddenSelector of [':hover', ':active', ':focus', ':focus-visible']) if (cardCss.includes(forbiddenSelector)) fail(`card.css must not invent interactive selector ${forbiddenSelector}`);
const cardDocs = await readFile(resolve(root, 'packages/core/components/card.md'), 'utf8');
for (const marker of ['informational by default', 'MUST NOT become clickable', 'informational cards remain stable', 'intentionally CSS-only', 'MUST NOT borrow `border.control.width`, `radius.control`', 'no source code is copied', 'Maturity is `public-proof`']) if (!cardDocs.includes(marker)) fail(`card.md missing marker: ${marker}`);

const badge = await readJson(resolve(root, 'packages/core/components/badge.json'));
const badgeStates = new Set(['rest', 'neutral', 'info', 'success', 'warning', 'error']);
if (badge.states.length !== badgeStates.size || !badge.states.every((state) => badgeStates.has(state))) fail('core.badge must expose exactly rest plus neutral/info/success/warning/error tone states');
for (const token of ['color.surface.panel', 'color.content.primary', 'color.content.inverse', 'color.border.strong', 'color.state.info', 'color.state.success', 'color.state.warning', 'color.state.error', 'space.annotation.inline', 'space.annotation.block', 'border.annotation.width', 'radius.annotation', 'font.family.body', 'font.size.label', 'font.weight.emphasis']) if (!badge.dependencies.includes(token)) fail(`core.badge missing semantic annotation token ${token}`);
for (const forbiddenToken of ['space.control.inline', 'space.control.block', 'border.control.width', 'radius.control', 'size.control.minimum', 'space.surface.inline', 'space.surface.block', 'border.surface.width', 'radius.surface', 'depth.rest.x', 'depth.rest.y', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y', 'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y', 'motion.press.duration', 'motion.release.duration', 'motion.standard.duration', 'color.action.primary.surface', 'color.focus.ring', 'focus.ring.width', 'focus.ring.offset', 'opacity.disabled']) if (badge.dependencies.includes(forbiddenToken)) fail(`core.badge informational contract must not borrow control/surface/interaction token ${forbiddenToken}`);
const badgeEntry = registry.components.find((entry) => entry.id === 'core.badge');
if (!badgeEntry || badgeEntry.maturity !== 'public-proof') fail('core.badge must be public-proof in this slice');
if (badgeEntry.evidence.implementation !== 'packages/adapters/web/components/badge.css') fail('core.badge implementation evidence must bind the CSS-only Web implementation');
if (badgeEntry.evidence.publicProof !== 'evidence/public/core.badge.json') fail('public-proof core.badge must bind its canonical proof record');
const badgeCss = await readFile(resolve(root, 'packages/adapters/web/components/badge.css'), 'utf8');
for (const marker of ['padding-block: var(--ns-space-annotation-block)', 'padding-inline: var(--ns-space-annotation-inline)', 'border: var(--ns-border-annotation-width)', 'border-radius: var(--ns-radius-annotation)', 'background: var(--ns-color-state-info)', 'background: var(--ns-color-state-success)', 'background: var(--ns-color-state-warning)', 'background: var(--ns-color-state-error)', 'color: var(--ns-color-content-inverse)', 'box-shadow: none', 'transform: none', 'transition: none', 'white-space: normal', '@media (forced-colors: active)']) if (!badgeCss.includes(marker)) fail(`badge.css missing static-annotation marker: ${marker}`);
for (const forbiddenSelector of [':hover', ':active', ':focus', ':focus-visible']) if (badgeCss.includes(forbiddenSelector)) fail(`badge.css must not invent interactive selector ${forbiddenSelector}`);
const badgeDocs = await readFile(resolve(root, 'packages/core/components/badge.md'), 'utf8');
for (const marker of ['default Badge is non-interactive', '`role="status"` is also NOT the Badge default', 'Tone MUST NOT be the sole carrier of meaning', 'MUST NOT borrow `space.control.*`', 'default `span` host', 'intentionally CSS-only', 'no legacy implementation code is copied', 'Maturity is `public-proof`']) if (!badgeDocs.includes(marker)) fail(`badge.md missing marker: ${marker}`);

const alert = await readJson(resolve(root, 'packages/core/components/alert.json'));
const alertStates = new Set(['rest', 'neutral', 'info', 'success', 'warning', 'error']);
if (alert.states.length !== alertStates.size || !alert.states.every((state) => alertStates.has(state))) fail('core.alert must expose exactly rest plus neutral/info/success/warning/error message states');
for (const token of ['color.surface.panel', 'color.content.primary', 'color.content.secondary', 'color.border.strong', 'color.state.info', 'color.state.success', 'color.state.warning', 'color.state.error', 'space.surface.inline', 'space.surface.block', 'border.surface.width', 'radius.surface', 'depth.rest.x', 'depth.rest.y', 'font.family.body', 'font.size.body', 'font.weight.regular', 'font.weight.strong']) if (!alert.dependencies.includes(token)) fail(`core.alert missing semantic message/surface token ${token}`);
for (const forbiddenToken of ['space.control.inline', 'space.control.block', 'border.control.width', 'radius.control', 'size.control.minimum', 'space.annotation.inline', 'space.annotation.block', 'border.annotation.width', 'radius.annotation', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y', 'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y', 'motion.press.duration', 'motion.release.duration', 'motion.standard.duration', 'color.action.primary.surface', 'color.focus.ring', 'focus.ring.width', 'focus.ring.offset', 'opacity.disabled']) if (alert.dependencies.includes(forbiddenToken)) fail(`core.alert static message contract must not borrow control/annotation/interaction token ${forbiddenToken}`);
const alertEntry = registry.components.find((entry) => entry.id === 'core.alert');
if (!alertEntry || alertEntry.maturity !== 'public-proof') fail('core.alert must be public-proof in this slice');
if (alertEntry.evidence.implementation !== 'packages/adapters/web/components/alert.css') fail('core.alert implementation evidence must bind the CSS-only Web implementation');
if (alertEntry.evidence.publicProof !== 'evidence/public/core.alert.json') fail('public-proof core.alert must bind its canonical proof record');
const alertCss = await readFile(resolve(root, 'packages/adapters/web/components/alert.css'), 'utf8');
for (const marker of ['padding-block: var(--ns-space-surface-block)', 'padding-inline: var(--ns-space-surface-inline)', 'border: var(--ns-border-surface-width)', 'border-radius: var(--ns-radius-surface)', 'background: var(--ns-color-surface-panel)', 'box-shadow: var(--ns-depth-rest-x) var(--ns-depth-rest-y)', 'background: var(--ns-color-surface-panel)', '--ns-alert-tone: var(--ns-color-state-info)', '--ns-alert-tone: var(--ns-color-state-success)', '--ns-alert-tone: var(--ns-color-state-warning)', '--ns-alert-tone: var(--ns-color-state-error)', 'font-weight: var(--ns-font-weight-strong)', 'overflow-wrap: anywhere', 'transform: none', 'transition: none', '@media (forced-colors: active)']) if (!alertCss.includes(marker)) fail(`alert.css missing static-message marker: ${marker}`);
for (const forbiddenSelector of [':hover', ':active', ':focus', ':focus-visible']) if (alertCss.includes(forbiddenSelector)) fail(`alert.css must not invent interactive selector ${forbiddenSelector}`);
await access(resolve(root, 'packages/adapters/web/components/alert.css'));
try {
  await access(resolve(root, 'packages/adapters/web/components/alert.mjs'));
  fail('core.alert must remain CSS-only; alert.mjs must not exist');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
const alertDocs = await readFile(resolve(root, 'packages/core/components/alert.md'), 'utf8');
for (const marker of ['default Alert is not a live region', '`role="alert"` is not a visual variant', 'MUST NOT make the whole surface clickable', 'A dismiss action is a separate button', 'Tone MUST NOT be the sole carrier of meaning', 'message surfaces remain stable', 'intentionally CSS-only', 'introduces no new token contracts and no new Rivet Light values', 'no legacy implementation code is copied', 'Maturity is `public-proof`']) if (!alertDocs.includes(marker)) fail(`alert.md missing marker: ${marker}`);

const field = await readJson(resolve(root, 'packages/core/components/field.json'));
const fieldStates = new Set(['rest', 'invalid', 'disabled']);
if (field.states.length !== fieldStates.size || !field.states.every((state) => fieldStates.has(state))) fail('core.field must expose exactly rest/invalid/disabled composition states');
for (const token of ['color.content.primary', 'color.content.secondary', 'color.state.error', 'space.field.gap', 'font.family.body', 'font.size.body', 'font.size.label', 'font.weight.regular', 'font.weight.emphasis']) if (!field.dependencies.includes(token)) fail(`core.field missing semantic field token ${token}`);
for (const forbiddenToken of ['space.control.inline', 'space.control.block', 'space.surface.inline', 'space.surface.block', 'space.annotation.inline', 'space.annotation.block', 'border.control.width', 'border.surface.width', 'border.annotation.width', 'radius.control', 'radius.surface', 'radius.annotation', 'size.control.minimum', 'depth.rest.x', 'depth.rest.y', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y', 'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y', 'motion.press.duration', 'motion.release.duration', 'motion.standard.duration', 'color.focus.ring', 'focus.ring.width', 'focus.ring.offset']) if (field.dependencies.includes(forbiddenToken)) fail(`core.field composition contract must not borrow control/surface/interaction token ${forbiddenToken}`);
const fieldEntry = registry.components.find((entry) => entry.id === 'core.field');
if (!fieldEntry || fieldEntry.maturity !== 'public-proof') fail('core.field must be public-proof in this slice');
if (fieldEntry.evidence.implementation !== 'packages/adapters/web/components/field.css') fail('core.field implementation evidence must bind the CSS-only Web implementation');
if (fieldEntry.evidence.publicProof !== 'evidence/public/core.field.json') fail('public-proof core.field must bind its canonical proof record');
const fieldCss = await readFile(resolve(root, 'packages/adapters/web/components/field.css'), 'utf8');
for (const marker of ['gap: var(--ns-space-field-gap)', 'font-family: var(--ns-font-family-body)', 'font-size: var(--ns-font-size-label)', 'font-weight: var(--ns-font-weight-emphasis)', 'color: var(--ns-color-content-secondary)', 'color: var(--ns-color-state-error)', ':has([aria-invalid="true"])', ':has(:disabled)', 'overflow-wrap: anywhere', 'transform: none', 'transition: none', '@media (forced-colors: active)']) if (!fieldCss.includes(marker)) fail(`field.css missing static-composition marker: ${marker}`);
for (const forbiddenSelector of [':hover', ':active', ':focus', ':focus-visible']) if (fieldCss.includes(forbiddenSelector)) fail(`field.css must not invent Field interaction selector ${forbiddenSelector}`);
try {
  await access(resolve(root, 'packages/adapters/web/components/field.mjs'));
  fail('core.field must remain CSS-only; field.mjs must not exist');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
const fieldDocs = await readFile(resolve(root, 'packages/core/components/field.md'), 'utf8');
for (const marker of ['one primary form control', 'does **not** add `role="group"`', '`role="alert"` is **not** the default', 'intentionally CSS-only', '`space.field.gap`', 'clamp(0.5rem, 0.44rem + 0.18vw, 0.6875rem)', 'MUST NOT borrow `space.control.*`', 'no legacy implementation code is copied', 'Maturity is `public-proof`']) if (!fieldDocs.includes(marker)) fail(`field.md missing marker: ${marker}`);

const breadcrumb = await readJson(resolve(root, 'packages/core/components/breadcrumb.json'));
const breadcrumbStates = new Set(['rest', 'current']);
if (breadcrumb.states.length !== breadcrumbStates.size || !breadcrumb.states.every((state) => breadcrumbStates.has(state))) fail('core.breadcrumb must expose exactly rest/current hierarchy states');
for (const token of ['color.content.primary', 'color.content.secondary', 'color.focus.ring', 'space.navigation.gap', 'focus.ring.width', 'focus.ring.offset', 'font.family.body', 'font.size.navigation', 'font.weight.regular', 'font.weight.emphasis']) if (!breadcrumb.dependencies.includes(token)) fail(`core.breadcrumb missing semantic navigation token ${token}`);
for (const forbiddenToken of ['space.control.inline', 'space.control.block', 'space.field.gap', 'space.surface.inline', 'space.surface.block', 'space.annotation.inline', 'space.annotation.block', 'border.control.width', 'border.surface.width', 'border.annotation.width', 'radius.control', 'radius.surface', 'radius.annotation', 'size.control.minimum', 'depth.rest.x', 'depth.rest.y', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y', 'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y', 'motion.press.duration', 'motion.release.duration', 'motion.standard.duration', 'color.action.primary.surface', 'color.state.error', 'opacity.disabled']) if (breadcrumb.dependencies.includes(forbiddenToken)) fail(`core.breadcrumb native-link contract must not borrow control/surface/press token ${forbiddenToken}`);
const breadcrumbEntry = registry.components.find((entry) => entry.id === 'core.breadcrumb');
if (!breadcrumbEntry || breadcrumbEntry.maturity !== 'public-proof') fail('core.breadcrumb must be public-proof in this slice');
if (breadcrumbEntry.evidence.implementation !== 'packages/adapters/web/components/breadcrumb.css') fail('core.breadcrumb implementation evidence must bind the CSS-only Web implementation');
if (breadcrumbEntry.evidence.publicProof !== 'evidence/public/core.breadcrumb.json') fail('public-proof core.breadcrumb must bind its canonical proof record');
const breadcrumbCss = await readFile(resolve(root, 'packages/adapters/web/components/breadcrumb.css'), 'utf8');
for (const marker of ['gap: var(--ns-space-navigation-gap)', 'font-family: var(--ns-font-family-body)', 'font-size: var(--ns-font-size-navigation)', 'color: var(--ns-color-content-secondary)', 'color: var(--ns-color-content-primary)', 'font-weight: var(--ns-font-weight-emphasis)', 'outline: var(--ns-focus-ring-width) solid var(--ns-color-focus-ring)', 'outline-offset: var(--ns-focus-ring-offset)', 'overflow-wrap: anywhere', 'box-shadow: none', 'transform: none', 'transition: none', '@media (forced-colors: active)', 'color: LinkText', 'color: CanvasText']) if (!breadcrumbCss.includes(marker)) fail(`breadcrumb.css missing native-navigation marker: ${marker}`);
for (const forbiddenMarker of ['var(--ns-depth-', 'var(--ns-press-', 'var(--ns-motion-press', 'var(--ns-motion-release', 'translate(']) if (breadcrumbCss.includes(forbiddenMarker)) fail(`breadcrumb.css must not borrow tactile control mechanics: ${forbiddenMarker}`);
try {
  await access(resolve(root, 'packages/adapters/web/components/breadcrumb.mjs'));
  fail('core.breadcrumb must remain CSS-only; breadcrumb.mjs must not exist');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
const breadcrumbDocs = await readFile(resolve(root, 'packages/core/components/breadcrumb.md'), 'utf8');
for (const marker of ['Breadcrumb is a navigation semantic', 'real links with real destinations', '`aria-current="page"`', 'MUST NOT manufacture `role="link" aria-disabled="true"`', 'MUST NOT add structural depth', 'MUST NOT implement arrow-key roving focus', '`space.navigation.gap`', '`font.size.navigation`', '`0.45rem`', '`clamp(0.72rem, 0.69rem + 0.08vw, 0.78rem)`', 'intentionally CSS-only', 'no legacy implementation code is copied', 'Maturity is `public-proof`']) if (!breadcrumbDocs.includes(marker)) fail(`breadcrumb.md missing marker: ${marker}`);

const pagination = await readJson(resolve(root, 'packages/core/components/pagination.json'));
const paginationStates = new Set(['rest', 'hover', 'focus-visible', 'pressed', 'current', 'disabled']);
if (pagination.states.length !== paginationStates.size || !pagination.states.every((state) => paginationStates.has(state))) fail('core.pagination must expose exactly rest/hover/focus-visible/pressed/current/disabled navigation states');
for (const token of ['color.surface.interactive', 'color.content.primary', 'color.border.strong', 'color.action.primary.surface', 'color.action.primary.content', 'color.focus.ring', 'space.navigation.gap', 'space.control.inline', 'space.control.block', 'border.control.width', 'radius.control', 'size.control.minimum', 'depth.rest.x', 'depth.rest.y', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y', 'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y', 'motion.press.duration', 'motion.release.duration', 'focus.ring.width', 'focus.ring.offset', 'opacity.disabled', 'font.family.body', 'font.size.navigation', 'font.weight.emphasis']) if (!pagination.dependencies.includes(token)) fail(`core.pagination missing semantic navigation/control token ${token}`);
for (const forbiddenToken of ['space.field.gap', 'space.surface.inline', 'space.surface.block', 'space.annotation.inline', 'space.annotation.block', 'border.surface.width', 'border.annotation.width', 'radius.surface', 'radius.annotation', 'color.state.error', 'motion.standard.duration']) if (pagination.dependencies.includes(forbiddenToken)) fail(`core.pagination must not borrow unrelated composition/surface/status token ${forbiddenToken}`);
const paginationEntry = registry.components.find((entry) => entry.id === 'core.pagination');
if (!paginationEntry || paginationEntry.maturity !== 'public-proof') fail('core.pagination must be public-proof in this slice');
if (paginationEntry.evidence.implementation !== 'packages/adapters/web/components/pagination.css') fail('core.pagination implementation evidence must bind the CSS-only Web implementation');
if (paginationEntry.evidence.publicProof !== 'evidence/public/core.pagination.json') fail('public-proof core.pagination must bind its canonical proof record');
const paginationCss = await readFile(resolve(root, 'packages/adapters/web/components/pagination.css'), 'utf8');
for (const marker of ['gap: var(--ns-space-navigation-gap)', 'font-size: var(--ns-font-size-navigation)', 'min-inline-size: var(--ns-size-control-minimum)', 'min-block-size: var(--ns-size-control-minimum)', 'padding-block: var(--ns-space-control-block)', 'padding-inline: var(--ns-space-control-inline)', 'border: var(--ns-border-control-width) solid var(--ns-color-border-strong)', 'border-radius: var(--ns-radius-control)', 'box-shadow: var(--ns-depth-rest-x) var(--ns-depth-rest-y)', 'translate(var(--ns-press-hover-x)', 'translate(var(--ns-press-active-x)', 'outline: var(--ns-focus-ring-width) solid var(--ns-color-focus-ring)', 'background: var(--ns-color-action-primary-surface)', 'color: var(--ns-color-action-primary-content)', 'opacity: var(--ns-opacity-disabled)', 'transform: none', 'transition: none', '@media (prefers-reduced-motion: reduce)', '@media (forced-colors: active)', 'border-style: double']) if (!paginationCss.includes(marker)) fail(`pagination.css missing navigation/pressure marker: ${marker}`);
for (const forbiddenMarker of ['javascript:', 'position: absolute', 'role="link"']) if (paginationCss.includes(forbiddenMarker)) fail(`pagination.css contains forbidden implementation marker: ${forbiddenMarker}`);
try {
  await access(resolve(root, 'packages/adapters/web/components/pagination.mjs'));
  fail('core.pagination must remain CSS-only; pagination.mjs must not exist');
} catch (error) {
  if (error?.message?.startsWith('[core-components]')) throw error;
  if (error?.code !== 'ENOENT') throw error;
}
const paginationDocs = await readFile(resolve(root, 'packages/core/components/pagination.md'), 'utf8');
for (const marker of ['Pagination is navigation, not a row of arbitrary buttons', 'real anchor with a real `href`', '`aria-current="page"`', 'Pagination is also not Tabs', 'does not use Arrow-key roving focus', 'effective target MUST meet or exceed `size.control.minimum`', 'introduces no new token contracts', 'intentionally CSS-only', 'exact implemented/public dependency union remains 55', '`components/ui/pagination.tsx`', 'Maturity is `public-proof`']) if (!paginationDocs.includes(marker)) fail(`pagination.md missing marker: ${marker}`);

const segmented = await readJson(resolve(root, 'packages/core/components/segmented-control.json'));
const segmentedStates = new Set(['rest', 'hover', 'focus-visible', 'pressed', 'selected', 'disabled']);
if (segmented.states.length !== segmentedStates.size || !segmented.states.every((state) => segmentedStates.has(state))) fail('core.segmented-control must expose exactly rest/hover/focus-visible/pressed/selected/disabled states');
for (const token of ['color.surface.panel', 'color.surface.interactive', 'color.content.primary', 'color.content.secondary', 'color.border.strong', 'color.action.primary.surface', 'color.action.primary.content', 'color.focus.ring', 'space.navigation.gap', 'space.control.inline', 'space.control.block', 'border.control.width', 'radius.control', 'size.control.minimum', 'depth.rest.x', 'depth.rest.y', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y', 'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y', 'motion.press.duration', 'motion.release.duration', 'focus.ring.width', 'focus.ring.offset', 'opacity.disabled', 'font.family.body', 'font.size.label', 'font.weight.emphasis']) if (!segmented.dependencies.includes(token)) fail(`core.segmented-control missing semantic/tactile token ${token}`);
for (const forbiddenToken of ['space.field.gap', 'space.surface.inline', 'space.surface.block', 'space.annotation.inline', 'space.annotation.block', 'border.surface.width', 'border.annotation.width', 'radius.surface', 'radius.annotation', 'color.state.error', 'motion.standard.duration', 'font.size.navigation']) if (segmented.dependencies.includes(forbiddenToken)) fail(`core.segmented-control must not borrow unrelated field/surface/annotation/status/navigation token ${forbiddenToken}`);
const segmentedEntry = registry.components.find((entry) => entry.id === 'core.segmented-control');
if (!segmentedEntry || segmentedEntry.maturity !== 'public-proof') fail('core.segmented-control must be public-proof in this slice');
if (segmentedEntry.evidence.implementation !== 'packages/adapters/web/components/segmented-control.mjs') fail('core.segmented-control implementation evidence must bind the canonical Web adapter');
if (segmentedEntry.evidence.publicProof !== 'evidence/public/core.segmented-control.json') fail('public-proof core.segmented-control must bind its canonical proof record');
const segmentedCss = await readFile(resolve(root, 'packages/adapters/web/components/segmented-control.css'), 'utf8');
for (const marker of ['gap: var(--ns-space-navigation-gap)', 'min-inline-size: var(--ns-size-control-minimum)', 'min-block-size: var(--ns-size-control-minimum)', 'padding-block: var(--ns-space-control-block)', 'padding-inline: var(--ns-space-control-inline)', 'border: var(--ns-border-control-width) solid var(--ns-color-border-strong)', 'border-radius: var(--ns-radius-control)', 'box-shadow: var(--ns-depth-rest-x) var(--ns-depth-rest-y)', 'translate(var(--ns-press-hover-x)', 'translate(var(--ns-press-active-x)', 'outline: var(--ns-focus-ring-width) solid var(--ns-color-focus-ring)', 'background: var(--ns-color-action-primary-surface)', 'color: var(--ns-color-action-primary-content)', 'border-style: double', 'opacity: var(--ns-opacity-disabled)', '@media (max-width: 560px)', '@media (prefers-reduced-motion: reduce)', '@media (forced-colors: active)']) if (!segmentedCss.includes(marker)) fail(`segmented-control.css missing pressure/selection marker: ${marker}`);
const segmentedAdapter = await readFile(resolve(root, 'packages/adapters/web/components/segmented-control.mjs'), 'utf8');
for (const marker of ['export function syncSegmentedControl', 'export function selectSegment', 'export function bindSegmentedControl', 'role="group"', 'BUTTON', "segment.type !== 'button'", "['true', 'false'].includes(pressed)", 'selected.length !== 1', "setAttribute('aria-pressed'", "segment.addEventListener('click'", "segment.removeEventListener('click'"]) if (!segmentedAdapter.includes(marker)) fail(`segmented-control.mjs missing implementation marker: ${marker}`);
for (const forbiddenMarker of ['addEventListener(\'keydown\'', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', "event.key === 'Home'", "event.key === 'End'", 'role="tablist"', 'role="tab"']) if (segmentedAdapter.includes(forbiddenMarker)) fail(`segmented-control.mjs must not manufacture Tabs/radio composite behavior: ${forbiddenMarker}`);
const segmentedDocs = await readFile(resolve(root, 'packages/core/components/segmented-control.md'), 'utf8');
for (const marker of ['Segmented Control is a button-based mode selector', 'real `<button type="button">` segments', '`aria-pressed="true"`', 'Use `core.radio`', 'Use `core.tabs`', 'MUST NOT expose `role="tablist"`', 'Core does not create a roving-focus composite', 'effective target MUST meet or exceed `size.control.minimum`', 'does not claim a Rivet Segmented Control implementation artifact', 'exact dependency union therefore remains 55', 'installs no `keydown` handler', 'Maturity is `public-proof`']) if (!segmentedDocs.includes(marker)) fail(`segmented-control.md missing marker: ${marker}`);

const tooltip = await readJson(resolve(root, 'packages/core/components/tooltip.json'));
const tooltipStates = new Set(['closed', 'open', 'dismissed']);
if (tooltip.states.length !== tooltipStates.size || !tooltip.states.every((state) => tooltipStates.has(state))) fail('core.tooltip must expose exactly closed/open/dismissed states');
for (const token of ['color.surface.panel', 'color.content.primary', 'color.border.strong', 'space.annotation.inline', 'space.annotation.block', 'border.annotation.width', 'radius.annotation', 'depth.rest.x', 'depth.rest.y', 'motion.standard.duration', 'font.family.body', 'font.size.body', 'font.weight.regular']) if (!tooltip.dependencies.includes(token)) fail(`core.tooltip missing semantic annotation/surface token ${token}`);
for (const forbiddenToken of ['color.surface.interactive', 'color.action.primary.surface', 'color.action.primary.content', 'color.focus.ring', 'space.control.inline', 'space.control.block', 'space.field.gap', 'space.navigation.gap', 'space.surface.inline', 'space.surface.block', 'border.control.width', 'border.surface.width', 'radius.control', 'radius.surface', 'size.control.minimum', 'focus.ring.width', 'focus.ring.offset', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y', 'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y', 'motion.press.duration', 'motion.release.duration', 'opacity.disabled']) if (tooltip.dependencies.includes(forbiddenToken)) fail(`core.tooltip informational contract must not borrow target/control/press token ${forbiddenToken}`);
const tooltipEntry = registry.components.find((entry) => entry.id === 'core.tooltip');
if (!tooltipEntry || tooltipEntry.maturity !== 'public-proof') fail('core.tooltip must be public-proof in this slice');
if (tooltipEntry.evidence.implementation !== 'packages/adapters/web/components/tooltip.mjs') fail('core.tooltip implementation evidence must bind the canonical Web adapter');
if (tooltipEntry.evidence.publicProof !== 'evidence/public/core.tooltip.json') fail('public-proof core.tooltip must bind its canonical proof record');
const tooltipCss = await readFile(resolve(root, 'packages/adapters/web/components/tooltip.css'), 'utf8');
for (const marker of ['padding-block: var(--ns-space-annotation-block)', 'padding-inline: var(--ns-space-annotation-inline)', 'border: var(--ns-border-annotation-width) solid var(--ns-color-border-strong)', 'border-radius: var(--ns-radius-annotation)', 'background: var(--ns-color-surface-panel)', 'color: var(--ns-color-content-primary)', 'box-shadow: var(--ns-depth-rest-x) var(--ns-depth-rest-y)', 'font-family: var(--ns-font-family-body)', 'font-size: var(--ns-font-size-body)', 'font-weight: var(--ns-font-weight-regular)', 'transform: none', 'transition-property: opacity', 'transition-duration: var(--ns-motion-standard-duration)', '@media (prefers-reduced-motion: reduce)', '@media (forced-colors: active)']) if (!tooltipCss.includes(marker)) fail(`tooltip.css missing informational-surface marker: ${marker}`);
for (const forbiddenMarker of ['var(--ns-press-', 'var(--ns-depth-hover', 'var(--ns-depth-active', 'cursor: pointer', ':hover', ':active']) if (tooltipCss.includes(forbiddenMarker)) fail(`tooltip.css must not borrow target/control pressure mechanics: ${forbiddenMarker}`);
const tooltipAdapter = await readFile(resolve(root, 'packages/adapters/web/components/tooltip.mjs'), 'utf8');
for (const marker of ['export function syncTooltipState', 'export function bindTooltip', 'role="tooltip"', 'aria-describedby', "['closed', 'open', 'dismissed']", 'tooltip.dataset.state', 'target.dataset.tooltipState', "addEventListener('pointerenter'", "addEventListener('pointerleave'", "addEventListener('focus'", "addEventListener('blur'", "event.key !== 'Escape'", 'tooltip content must remain non-interactive', 'controllers.delete(target)']) if (!tooltipAdapter.includes(marker)) fail(`tooltip.mjs missing implementation marker: ${marker}`);
for (const forbiddenMarker of ["addEventListener('click'", 'touchstart', 'touchend', 'contextmenu', 'longpress', "setAttribute('role'", "setAttribute('tabindex'", 'preventDefault(', 'stopPropagation(']) if (tooltipAdapter.includes(forbiddenMarker)) fail(`tooltip.mjs must not manufacture target/touch activation behavior: ${forbiddenMarker}`);
const tooltipDocs = await readFile(resolve(root, 'packages/core/components/tooltip.md'), 'utf8');
for (const marker of ['Tooltip content is supplemental, not essential', '`role="tooltip"`', '`aria-describedby`', 'MUST NOT contain buttons, links, inputs, menus, dismiss controls', 'Escape dismisses it without moving focus from the target', 'MUST NOT trap focus', 'Tooltips MUST NOT introduce movement that makes the target appear actionable', 'MUST NOT hijack tap, long-press, context-menu, text-selection, or native activation behavior', 'contains no `components/ui/tooltip.tsx`', 'exact dependency union therefore remains 55', '`packages/adapters/web/components/tooltip.css`', '`packages/adapters/web/components/tooltip.mjs`', '`core.hover-card`', 'Maturity is `public-proof`']) if (!tooltipDocs.includes(marker)) fail(`tooltip.md missing marker: ${marker}`);

const combobox = await readJson(resolve(root, 'packages/core/components/combobox.json'));
const comboboxStates = new Set(['rest', 'hover', 'focus-visible', 'pressed', 'closed', 'open', 'query-empty', 'query-filled', 'highlighted', 'selected', 'invalid', 'disabled']);
if (combobox.states.length !== comboboxStates.size || !combobox.states.every((state) => comboboxStates.has(state))) fail('core.combobox must expose exactly the implemented editable single-selection state matrix');
for (const token of ['color.surface.interactive', 'color.surface.panel', 'color.content.primary', 'color.content.secondary', 'color.border.default', 'color.border.strong', 'color.action.primary.surface', 'color.action.primary.content', 'color.state.error', 'color.focus.ring', 'space.control.inline', 'space.control.block', 'space.surface.inline', 'space.surface.block', 'border.control.width', 'border.surface.width', 'radius.control', 'radius.surface', 'size.control.minimum', 'depth.rest.x', 'depth.rest.y', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y', 'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y', 'motion.press.duration', 'motion.release.duration', 'motion.standard.duration', 'focus.ring.width', 'focus.ring.offset', 'opacity.disabled', 'font.family.body', 'font.size.body', 'font.weight.regular', 'font.weight.emphasis']) if (!combobox.dependencies.includes(token)) fail(`core.combobox missing semantic/editable/popup token ${token}`);
for (const forbiddenToken of ['space.annotation.inline', 'space.annotation.block', 'border.annotation.width', 'radius.annotation', 'font.size.navigation']) if (combobox.dependencies.includes(forbiddenToken)) fail(`core.combobox must not borrow unrelated annotation/navigation token ${forbiddenToken}`);
const comboboxEntry = registry.components.find((entry) => entry.id === 'core.combobox');
if (!comboboxEntry || comboboxEntry.maturity !== 'public-proof') fail('core.combobox must be public-proof in Slice 17');
if (comboboxEntry.evidence.implementation !== 'packages/adapters/web/components/combobox.mjs') fail('core.combobox implementation evidence must bind the canonical Web adapter');
if (comboboxEntry.evidence.publicProof !== 'evidence/public/core.combobox.json') fail('public-proof core.combobox must bind its canonical proof record');
const comboboxCss = await readFile(resolve(root, 'packages/adapters/web/components/combobox.css'), 'utf8');
for (const marker of ['.ns-combobox-input', 'min-block-size: var(--ns-size-control-minimum)', 'border: var(--ns-border-control-width) solid var(--ns-color-border-default)', '.ns-combobox-input:active:not(:disabled)', 'transform: none', '.ns-combobox-trigger', 'box-shadow: var(--ns-depth-rest-x) var(--ns-depth-rest-y)', 'translate(var(--ns-press-hover-x)', 'translate(var(--ns-press-active-x)', '.ns-combobox-popup', 'padding: var(--ns-space-surface-block) var(--ns-space-surface-inline)', 'border: var(--ns-border-surface-width) solid var(--ns-color-border-strong)', 'border-radius: var(--ns-radius-surface)', 'transition-property: opacity', '.ns-combobox-option[data-active="true"]', '.ns-combobox-option[aria-selected="true"]', 'border-style: double', '.ns-combobox-option[aria-disabled="true"]', '@media (prefers-reduced-motion: reduce)', '@media (forced-colors: active)']) if (!comboboxCss.includes(marker)) fail(`combobox.css missing implementation marker: ${marker}`);
const comboboxInputRule = /\.ns-combobox-input\s*\{([^}]*)\}/s.exec(comboboxCss)?.[1] || '';
if (!comboboxInputRule.includes('transform: none') || /var\(--ns-(?:depth|press)-/.test(comboboxInputRule)) fail('core.combobox editable input must remain non-pressable and must not borrow depth/press tokens');
const comboboxAdapter = await readFile(resolve(root, 'packages/adapters/web/components/combobox.mjs'), 'utf8');
for (const marker of ['export function syncComboboxState', 'export function selectComboboxOption', 'export function bindCombobox', '[role="combobox"]', "input.tagName !== 'INPUT'", 'aria-autocomplete', 'aria-controls', 'role="listbox"', 'role="option"', 'aria-selected', 'data-value', 'selected.length > 1', 'aria-activedescendant', 'query-filled', 'query-empty', 'selectionState', "event.key === 'ArrowDown'", "event.key === 'ArrowUp'", "event.key === 'Enter'", "event.key === 'Escape'", 'isDisabledOption', "parts.input.addEventListener('input'", "parts.input.addEventListener('keydown'", "trigger.setAttribute('aria-expanded'", 'controllers.delete(root)']) if (!comboboxAdapter.includes(marker)) fail(`combobox.mjs missing implementation marker: ${marker}`);
for (const forbiddenMarker of ["event.key === 'Home'", "event.key === 'End'", "event.key === 'ArrowLeft'", "event.key === 'ArrowRight'", "event.key === 'Tab'", 'role="dialog"', 'aria-modal', 'stopPropagation(']) if (comboboxAdapter.includes(forbiddenMarker)) fail(`combobox.mjs must preserve native text/focus behavior and non-modal semantics: ${forbiddenMarker}`);
const comboboxDocs = await readFile(resolve(root, 'packages/core/components/combobox.md'), 'utf8');
for (const marker of ['editable single-selection', 'Combobox is not a styled native Select', 'Query text and committed value are different authorities', '`aria-activedescendant`', 'MUST NOT trap focus', 'Tab and Shift+Tab retain ordinary document focus traversal', 'Home/End and Left/Right remain text-editing keys by default', 'initial Core contract is **single-selection only**', 'trigger follows the family pressure law', 'editable text surface itself remains an editing surface, not a pressable button', 'introduces **no new semantic token contracts**', '## Canonical Web implementation', '`packages/adapters/web/components/combobox.css`', '`packages/adapters/web/components/combobox.mjs`', 'The CSS keeps `.ns-combobox-input` at `transform: none`', 'closing through it keeps the button focused', 'previous 85 browser cases remain unchanged, for 90 total', 'Combobox surfaces', 'keyboard-complete production Combobox behavior as high-value unfinished work', '`components/ui/combobox.tsx`', 'excludes chips/multi-select', 'Maturity is `public-proof`']) if (!comboboxDocs.includes(marker)) fail(`combobox.md missing marker: ${marker}`);

const radio = await readJson(resolve(root, 'packages/core/components/radio.json'));
for (const state of ['rest', 'hover', 'focus-visible', 'pressed', 'unchecked', 'checked', 'invalid', 'disabled']) if (!radio.states.includes(state)) fail(`core.radio missing state ${state}`);
for (const token of ['color.surface.interactive', 'color.action.primary.surface', 'color.state.error', 'size.control.minimum', 'depth.rest.x', 'depth.hover.x', 'depth.active.x', 'press.hover.x', 'press.active.x', 'motion.press.duration', 'motion.release.duration', 'color.focus.ring']) if (!radio.dependencies.includes(token)) fail(`core.radio missing semantic/tactile token ${token}`);
const radioEntry = registry.components.find((entry) => entry.id === 'core.radio');
if (!radioEntry || radioEntry.maturity !== 'public-proof') fail('core.radio must be public-proof in this slice');
if (radioEntry.evidence.implementation !== 'packages/adapters/web/components/radio.mjs') fail('core.radio implementation evidence must bind the canonical Web adapter');
if (radioEntry.evidence.publicProof !== 'evidence/public/core.radio.json') fail('public-proof core.radio must bind its canonical proof record');
await access(resolve(root, 'packages/adapters/web/components/radio.css'));
const radioDocs = await readFile(resolve(root, 'packages/core/components/radio.md'), 'utf8');
for (const marker of ['real native `<input type="radio">`', 'mutually-exclusive', 'MUST NOT emulate independent checkbox behavior', 'effective interactive hit target MUST meet or exceed `size.control.minimum`', 'no legacy implementation code is copied', 'No radio-specific Rivet implementation artifact is claimed']) if (!radioDocs.includes(marker)) fail(`radio.md missing marker: ${marker}`);

const switchContract = await readJson(resolve(root, 'packages/core/components/switch.json'));
for (const state of ['rest', 'hover', 'focus-visible', 'pressed', 'off', 'on', 'invalid', 'disabled']) if (!switchContract.states.includes(state)) fail(`core.switch missing state ${state}`);
for (const token of ['color.surface.interactive', 'color.action.primary.surface', 'color.action.primary.content', 'color.state.error', 'size.control.minimum', 'depth.rest.x', 'depth.hover.x', 'depth.active.x', 'press.hover.x', 'press.active.x', 'motion.press.duration', 'motion.release.duration', 'motion.standard.duration', 'color.focus.ring']) if (!switchContract.dependencies.includes(token)) fail(`core.switch missing semantic/tactile token ${token}`);
const switchEntry = registry.components.find((entry) => entry.id === 'core.switch');
if (!switchEntry || switchEntry.maturity !== 'public-proof') fail('core.switch must be public-proof in this slice');
if (switchEntry.evidence.implementation !== 'packages/adapters/web/components/switch.mjs') fail('core.switch implementation evidence must bind the canonical Web adapter');
if (switchEntry.evidence.publicProof !== 'evidence/public/core.switch.json') fail('public-proof core.switch must bind its canonical proof record');
await access(resolve(root, 'packages/adapters/web/components/switch.css'));
const switchDocs = await readFile(resolve(root, 'packages/core/components/switch.md'), 'utf8');
for (const marker of ['role="switch"', 'binary setting', 'MUST NOT expose an indeterminate state', 'thumb position and state color MUST resolve together', 'effective interactive hit target MUST meet or exceed `size.control.minimum`', 'real `<input type="checkbox">`', 'no legacy implementation code is copied', 'No switch-specific Rivet implementation artifact is claimed']) if (!switchDocs.includes(marker)) fail(`switch.md missing marker: ${marker}`);

const tabs = await readJson(resolve(root, 'packages/core/components/tabs.json'));
for (const state of ['rest', 'hover', 'focus-visible', 'pressed', 'unselected', 'selected', 'disabled']) if (!tabs.states.includes(state)) fail(`core.tabs missing state ${state}`);
for (const token of ['color.surface.interactive', 'color.surface.panel', 'color.content.primary', 'color.border.strong', 'color.action.primary.surface', 'size.control.minimum', 'depth.rest.x', 'depth.hover.x', 'depth.active.x', 'press.hover.x', 'press.active.x', 'motion.press.duration', 'motion.release.duration', 'motion.standard.duration', 'color.focus.ring', 'font.size.label', 'opacity.disabled']) if (!tabs.dependencies.includes(token)) fail(`core.tabs missing semantic/tactile token ${token}`);
const tabsEntry = registry.components.find((entry) => entry.id === 'core.tabs');
if (!tabsEntry || tabsEntry.maturity !== 'public-proof') fail('core.tabs must be public-proof in this slice');
if (tabsEntry.evidence.implementation !== 'packages/adapters/web/components/tabs.mjs') fail('core.tabs implementation evidence must bind the canonical Web adapter');
if (tabsEntry.evidence.publicProof !== 'evidence/public/core.tabs.json') fail('public-proof core.tabs must bind its canonical proof record');
await access(resolve(root, 'packages/adapters/web/components/tabs.css'));
const tabsAdapter = await readFile(resolve(root, 'packages/adapters/web/components/tabs.mjs'), 'utf8');
for (const marker of ['export function selectTab', 'export function bindTabs', "['automatic', 'manual']", 'aria-orientation', 'ArrowLeft', 'ArrowRight', "event.key === 'Home'", "event.key === 'End'", "event.key === ' ' || event.key === 'Enter'", 'aria-selected']) if (!tabsAdapter.includes(marker)) fail(`tabs.mjs missing implementation marker: ${marker}`);
const tabsDocs = await readFile(resolve(root, 'packages/core/components/tabs.md'), 'utf8');
for (const marker of ['role="tablist"', 'roving focus', 'Automatic activation', 'Manual activation', 'logical inline-end', 'MUST NOT increase apparent elevation', 'selected tab SHOULD feel seated/locked into its rail', 'no legacy implementation code is copied', 'No tabs-specific Rivet implementation artifact is claimed', 'Maturity is `public-proof`']) if (!tabsDocs.includes(marker)) fail(`tabs.md missing marker: ${marker}`);

const accordion = await readJson(resolve(root, 'packages/core/components/accordion.json'));
const accordionStates = new Set(['rest', 'hover', 'focus-visible', 'pressed', 'closed', 'open', 'disabled']);
if (accordion.states.length !== accordionStates.size || !accordion.states.every((state) => accordionStates.has(state))) fail('core.accordion must expose exactly rest/hover/focus-visible/pressed/closed/open/disabled disclosure states');
for (const token of ['color.surface.interactive', 'color.surface.panel', 'color.content.primary', 'color.content.secondary', 'color.border.default', 'color.border.strong', 'color.focus.ring', 'space.control.inline', 'space.control.block', 'space.surface.inline', 'space.surface.block', 'border.control.width', 'border.surface.width', 'radius.control', 'radius.surface', 'size.control.minimum', 'depth.rest.x', 'depth.rest.y', 'depth.hover.x', 'depth.hover.y', 'depth.active.x', 'depth.active.y', 'press.hover.x', 'press.hover.y', 'press.active.x', 'press.active.y', 'motion.press.duration', 'motion.release.duration', 'motion.standard.duration', 'focus.ring.width', 'focus.ring.offset', 'opacity.disabled', 'font.family.body', 'font.size.body', 'font.size.label', 'font.weight.regular', 'font.weight.emphasis']) if (!accordion.dependencies.includes(token)) fail(`core.accordion missing semantic disclosure/control token ${token}`);
for (const forbiddenToken of ['space.annotation.inline', 'space.annotation.block', 'border.annotation.width', 'radius.annotation', 'space.navigation.gap', 'font.size.navigation', 'color.state.error']) if (accordion.dependencies.includes(forbiddenToken)) fail(`core.accordion must not borrow unrelated annotation/navigation/error token ${forbiddenToken}`);
const accordionEntry = registry.components.find((entry) => entry.id === 'core.accordion');
if (!accordionEntry || accordionEntry.maturity !== 'public-proof') fail('core.accordion must be public-proof after verified Slice 18 deployment');
if (accordionEntry.evidence.implementation !== 'packages/adapters/web/components/accordion.mjs') fail('core.accordion implementation evidence must bind the canonical Web adapter');
if (accordionEntry.evidence.publicProof !== 'evidence/public/core.accordion.json') fail('public-proof core.accordion must bind its canonical proof record');
const accordionCss = await readFile(resolve(root, 'packages/adapters/web/components/accordion.css'), 'utf8');
for (const marker of ['.ns-accordion-trigger', 'min-block-size: var(--ns-size-control-minimum)', 'padding-block: var(--ns-space-control-block)', 'padding-inline: var(--ns-space-control-inline)', 'border: var(--ns-border-control-width) solid var(--ns-color-border-strong)', 'box-shadow: var(--ns-depth-rest-x) var(--ns-depth-rest-y)', 'translate(var(--ns-press-hover-x)', 'translate(var(--ns-press-active-x)', 'outline: var(--ns-focus-ring-width) solid var(--ns-color-focus-ring)', '.ns-accordion-trigger[aria-expanded="true"] .ns-accordion-indicator', 'transition-duration: var(--ns-motion-standard-duration)', '.ns-accordion-panel', 'padding-block: var(--ns-space-surface-block)', 'padding-inline: var(--ns-space-surface-inline)', 'border: var(--ns-border-surface-width) solid var(--ns-color-border-default)', '.ns-accordion-panel[hidden]', '@media (prefers-reduced-motion: reduce)', '@media (forced-colors: active)']) if (!accordionCss.includes(marker)) fail(`accordion.css missing implementation marker: ${marker}`);
for (const forbiddenMarker of ['transition: all', 'position: absolute', 'var(--ns-space-navigation-gap)', 'var(--ns-space-annotation-', 'var(--ns-color-action-primary-']) if (accordionCss.includes(forbiddenMarker)) fail(`accordion.css contains forbidden Tabs/navigation/annotation shortcut: ${forbiddenMarker}`);
const accordionAdapter = await readFile(resolve(root, 'packages/adapters/web/components/accordion.mjs'), 'utf8');
for (const marker of ['export function syncAccordionItem', 'export function setAccordionItemOpen', 'export function bindAccordion', "root.classList.contains('ns-accordion')", "trigger.tagName !== 'BUTTON'", "trigger.type !== 'button'", 'aria-controls', 'aria-labelledby', "['true', 'false'].includes(expanded)", "['single', 'multiple'].includes(expansion)", 'panel.hidden = !nextOpen', 'trigger.dataset.state', 'panel.dataset.state', "trigger.addEventListener('click'", "trigger.removeEventListener('click'", 'controllers.delete(root)']) if (!accordionAdapter.includes(marker)) fail(`accordion.mjs missing implementation marker: ${marker}`);
for (const forbiddenMarker of ["addEventListener('keydown'", 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', "event.key === 'Home'", "event.key === 'End'", "event.key === 'Tab'", "setAttribute('role'", "setAttribute('tabindex'", 'role="tablist"', 'role="tab"', 'role="tabpanel"', 'preventDefault(', 'stopPropagation(']) if (accordionAdapter.includes(forbiddenMarker)) fail(`accordion.mjs must preserve native disclosure/button focus behavior: ${forbiddenMarker}`);
const accordionDocs = await readFile(resolve(root, 'packages/core/components/accordion.md'), 'utf8');
for (const marker of ['real `<button>`', '<button type="button">', '`aria-expanded="true|false"`', '`aria-controls`', 'ordinary document focus traversal', 'installs **no `keydown` handler**', '`open` and `closed` describe disclosure state', '0→2→5px pressure model', '`hidden` attribute', '`single` and `multiple` expansion policies', 'exact implemented/public dependency union remains 55', 'previous 90 browser cases remain unchanged, for 95 total', '`packages/adapters/web/components/accordion.css`', '`packages/adapters/web/components/accordion.mjs`', 'does not list or implement Accordion', '`components/ui/accordion.tsx`', 'Maturity is `public-proof`']) if (!accordionDocs.includes(marker)) fail(`accordion.md missing marker: ${marker}`);

console.log(`[core-components] validated ${registry.components.length} Core components: 50 current-host public-proof including DescriptionList with native-dl/term-description/non-interaction/token/accessibility/evidence/count-integrity invariants`);
