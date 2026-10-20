import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[reduced-motion] ${message}`); };
const componentsDir = resolve(root, 'packages/adapters/web/components');

const mediaBlock = (css, marker) => {
  const start = css.indexOf(marker);
  if (start < 0) return null;
  const open = css.indexOf('{', start + marker.length);
  if (open < 0) return null;
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    if (css[index] === '{') depth += 1;
    if (css[index] === '}') {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, index);
    }
  }
  return null;
};

const expectedCurrent = new Set([
  'accordion.css',
  'button.css',
  'checkbox.css',
  'calendar.css',
  'date-picker.css',
  'dropdown-menu.css',
  'context-menu.css',
  'menubar.css',
  'navigation-menu.css',
  'toast.css',
  'combobox.css',
  'file-upload.css',
  'multi-select.css',
  'pagination.css',
  'radio.css',
  'segmented-control.css',
  'select.css',
  'switch.css',
  'tabs.css'
]);

const tactileFiles = [];
for (const name of (await readdir(componentsDir)).filter((entry) => entry.endsWith('.css')).sort()) {
  const css = await readFile(resolve(componentsDir, name), 'utf8');
  if (!css.includes('var(--ns-motion-press-duration)')) continue;
  tactileFiles.push(name);
  const reduced = mediaBlock(css, '@media (prefers-reduced-motion: reduce)');
  if (!reduced) fail(`${name} uses press-duration motion but has no reduced-motion override`);
  if (!reduced.includes('transition-duration: 1ms !important;')) fail(`${name} reduced-motion override must authoritatively keep tactile transition duration at 1ms`);
  if (reduced.includes('var(--ns-motion-press-duration)') || reduced.includes('var(--ns-motion-release-duration)')) fail(`${name} reduced-motion override must not restore Theme pressure timing`);
}

for (const name of expectedCurrent) if (!tactileFiles.includes(name)) fail(`expected current tactile adapter ${name} to remain covered by reduced-motion validation`);
if (tactileFiles.length < expectedCurrent.size) fail(`expected at least ${expectedCurrent.size} tactile adapters, got ${tactileFiles.length}`);

const dialogCss = await readFile(resolve(componentsDir, 'dialog.css'), 'utf8');
if (dialogCss.includes('var(--ns-motion-press-duration)') || dialogCss.includes('var(--ns-motion-release-duration)')) fail('dialog.css is structural modal motion and must not use tactile pressure timing');
if (!dialogCss.includes('var(--ns-motion-standard-duration)')) fail('dialog.css must bind its structural transition to motion.standard.duration');
const dialogReduced = mediaBlock(dialogCss, '@media (prefers-reduced-motion: reduce)');
if (!dialogReduced) fail('dialog.css structural motion requires a reduced-motion override');
if (!dialogReduced.includes('transition-duration: 1ms !important;')) fail('dialog.css reduced-motion override must authoritatively cap structural transition duration at 1ms');
if (dialogReduced.includes('var(--ns-motion-standard-duration)') || dialogReduced.includes('var(--ns-motion-press-duration)') || dialogReduced.includes('var(--ns-motion-release-duration)')) fail('dialog.css reduced-motion override must not restore Theme motion timing');

const alertDialogCss = await readFile(resolve(componentsDir, 'alert-dialog.css'), 'utf8');
for (const marker of ['.ns-alert-dialog__message','.ns-alert-dialog__actions']) if (!alertDialogCss.includes(marker)) fail(`alert-dialog.css missing stable overlay marker: ${marker}`);
for (const forbidden of ['transition-property','transition-duration','var(--ns-motion-press-duration)','var(--ns-motion-release-duration)','transform: translate(']) if (alertDialogCss.includes(forbidden)) fail(`alert-dialog.css must inherit Dialog structural/reduced-motion behavior instead of owning motion: ${forbidden}`);

const drawerCss = await readFile(resolve(componentsDir, 'drawer.css'), 'utf8');
for (const marker of ['.ns-drawer','transition-property: opacity, transform, box-shadow','transition-duration: var(--ns-motion-standard-duration)']) if (!drawerCss.includes(marker)) fail(`drawer.css missing structural motion marker: ${marker}`);
for (const forbidden of ['var(--ns-motion-press-duration)','var(--ns-motion-release-duration)','var(--ns-press-hover-','var(--ns-press-active-']) if (drawerCss.includes(forbidden)) fail(`drawer.css structural motion must not borrow Button pressure timing/travel: ${forbidden}`);
const drawerReduced = mediaBlock(drawerCss, '@media (prefers-reduced-motion: reduce)');
if (!drawerReduced) fail('drawer.css structural motion requires a reduced-motion override');
if (!drawerReduced.includes('transition-duration: 1ms !important;')) fail('drawer.css reduced-motion override must authoritatively cap structural transition duration at 1ms');
if (drawerReduced.includes('var(--ns-motion-standard-duration)') || drawerReduced.includes('var(--ns-motion-press-duration)') || drawerReduced.includes('var(--ns-motion-release-duration)')) fail('drawer.css reduced-motion override must not restore Theme motion timing');

const popoverCss = await readFile(resolve(componentsDir, 'popover.css'), 'utf8');
for (const marker of ['.ns-popover','transition-property: opacity','transition-duration: var(--ns-motion-standard-duration)']) if (!popoverCss.includes(marker)) fail(`popover.css missing structural motion marker: ${marker}`);
for (const forbidden of ['var(--ns-motion-press-duration)','var(--ns-motion-release-duration)','var(--ns-press-hover-','var(--ns-press-active-']) if (popoverCss.includes(forbidden)) fail(`popover.css structural motion must not borrow Button pressure timing/travel: ${forbidden}`);
const popoverReduced = mediaBlock(popoverCss, '@media (prefers-reduced-motion: reduce)');
if (!popoverReduced) fail('popover.css structural motion requires a reduced-motion override');
if (!popoverReduced.includes('transition-duration: 1ms !important;')) fail('popover.css reduced-motion override must authoritatively cap structural transition duration at 1ms');
if (popoverReduced.includes('var(--ns-motion-standard-duration)') || popoverReduced.includes('var(--ns-motion-press-duration)') || popoverReduced.includes('var(--ns-motion-release-duration)')) fail('popover.css reduced-motion override must not restore Theme motion timing');

const hoverCardCss = await readFile(resolve(componentsDir, 'hover-card.css'), 'utf8');
for (const marker of ['.ns-hover-card','transition-property: opacity','transition-duration: var(--ns-motion-standard-duration)']) if (!hoverCardCss.includes(marker)) fail(`hover-card.css missing structural motion marker: ${marker}`);
for (const forbidden of ['var(--ns-motion-press-duration)','var(--ns-motion-release-duration)','var(--ns-press-hover-','var(--ns-press-active-']) if (hoverCardCss.includes(forbidden)) fail(`hover-card.css structural motion must not borrow Button pressure timing/travel: ${forbidden}`);
const hoverCardReduced = mediaBlock(hoverCardCss, '@media (prefers-reduced-motion: reduce)');
if (!hoverCardReduced) fail('hover-card.css structural motion requires a reduced-motion override');
if (!hoverCardReduced.includes('transition-duration: 1ms !important;')) fail('hover-card.css reduced-motion override must authoritatively cap structural transition duration at 1ms');
if (hoverCardReduced.includes('var(--ns-motion-standard-duration)') || hoverCardReduced.includes('var(--ns-motion-press-duration)') || hoverCardReduced.includes('var(--ns-motion-release-duration)')) fail('hover-card.css reduced-motion override must not restore Theme motion timing');

const toastCss = await readFile(resolve(componentsDir, 'toast.css'), 'utf8');
for (const marker of ['.ns-toast','transition-property: opacity, transform, box-shadow','transition-duration: var(--ns-motion-standard-duration)']) if (!toastCss.includes(marker)) fail(`toast.css missing structural motion marker: ${marker}`);
const toastReduced = mediaBlock(toastCss, '@media (prefers-reduced-motion: reduce)');
if (!toastReduced) fail('toast.css structural/tactile motion requires a reduced-motion override');
if (!toastReduced.includes('transition-duration: 1ms !important;')) fail('toast.css reduced-motion override must authoritatively cap all Toast transition duration at 1ms');
if (toastReduced.includes('var(--ns-motion-standard-duration)') || toastReduced.includes('var(--ns-motion-press-duration)') || toastReduced.includes('var(--ns-motion-release-duration)')) fail('toast.css reduced-motion override must not restore Theme motion timing');

const tableCss = await readFile(resolve(componentsDir, 'table.css'), 'utf8');
for (const marker of ['.ns-table','border-collapse: collapse','@media (forced-colors: active)']) if (!tableCss.includes(marker)) fail(`table.css missing stable native Table marker: ${marker}`);
for (const forbidden of ['animation:','animation-name','transition:','transition-property','transition-duration','transform:','var(--ns-motion-']) if (tableCss.includes(forbidden)) fail(`table.css must remain structurally motionless: ${forbidden}`);
const dataGridCss = await readFile(resolve(componentsDir, 'data-grid.css'), 'utf8');
for (const marker of ['.ns-data-grid','[role="gridcell"]:focus-visible','[aria-selected="true"]','@media (forced-colors: active)']) if (!dataGridCss.includes(marker)) fail(`data-grid.css missing stable DataGrid marker: ${marker}`);
for (const forbidden of ['animation:','animation-name','transition:','transition-property','transition-duration','transform:','var(--ns-motion-']) if (dataGridCss.includes(forbidden)) fail(`data-grid.css must remain structurally motionless: ${forbidden}`);
const itemCss = await readFile(resolve(componentsDir, 'item.css'), 'utf8');
for (const marker of ['.ns-item','.ns-item__content','.ns-item__actions','@media (forced-colors: active)']) if (!itemCss.includes(marker)) fail(`item.css missing stable Item marker: ${marker}`);
for (const forbidden of ['animation:','animation-name','transition:','transition-property','transition-duration','transform:','var(--ns-motion-']) if (itemCss.includes(forbidden)) fail(`item.css must remain structurally motionless: ${forbidden}`);
const listCss = await readFile(resolve(componentsDir, 'list.css'), 'utf8');
for (const marker of ['.ns-list','.ns-list > li','.ns-list > li::marker','@media (forced-colors: active)']) if (!listCss.includes(marker)) fail(`list.css missing stable List marker: ${marker}`);
for (const forbidden of ['animation:','animation-name','transition:','transition-property','transition-duration','transform:','var(--ns-motion-']) if (listCss.includes(forbidden)) fail(`list.css must remain structurally motionless: ${forbidden}`);
const descriptionListCss = await readFile(resolve(componentsDir, 'description-list.css'), 'utf8');
for (const marker of ['.ns-description-list','.ns-description-list > dt','.ns-description-list > dd','@media (forced-colors: active)']) if (!descriptionListCss.includes(marker)) fail(`description-list.css missing stable DescriptionList marker: ${marker}`);
for (const forbidden of ['animation:','animation-name','transition:','transition-property','transition-duration','transform:','var(--ns-motion-']) if (descriptionListCss.includes(forbidden)) fail(`description-list.css must remain structurally motionless: ${forbidden}`);





console.log(`[reduced-motion] validated authoritative <=1ms reduced-motion overrides for ${tactileFiles.length} press-duration adapters including DropdownMenu, ContextMenu, Menubar, NavigationMenu, and Toast dismiss controls plus structural Dialog/Drawer/Popover/HoverCard/Toast motion and motionless AlertDialog/Table/DataGrid/Item/List/DescriptionList styling`);
