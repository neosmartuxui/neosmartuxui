import { test, expect } from '@playwright/test';
import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const moduleUrl = (source) => `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
const adapterModuleUrl = async (repositoryPath, cache = new Map()) => {
  if (cache.has(repositoryPath)) return cache.get(repositoryPath);
  let source = await readFile(resolve(root, repositoryPath), 'utf8');
  const dependencies = [...source.matchAll(/from\s+(['"])(\.\/[A-Za-z0-9_-]+\.mjs)\1/g)].map((match) => match[2]);
  for (const specifier of dependencies) {
    const slash = repositoryPath.lastIndexOf('/');
    const dependencyPath = repositoryPath.slice(0, slash + 1) + specifier.slice(2);
    const dependencyUrl = await adapterModuleUrl(dependencyPath, cache);
    source = source.replaceAll(specifier, dependencyUrl);
  }
  const url = moduleUrl(source);
  cache.set(repositoryPath, url);
  return url;
};

const registry = await json('packages/core/component-registry.json');
const runtimeUrl = moduleUrl(await readFile(resolve(root, 'packages/core/previews/runtime.mjs'), 'utf8'));
const previews = new Map();
const previewableComponents = registry.components.filter((entry) => entry.maturity !== 'contract-only');
const contractOnlyComponents = registry.components.filter((entry) => entry.maturity === 'contract-only');

for (const entry of previewableComponents) {
  const slug = entry.id.split('.')[1];
  const base = resolve(root, 'packages/core/previews', slug);
  const manifest = JSON.parse(await readFile(resolve(base, 'preview.json'), 'utf8'));
  const fixture = await readFile(resolve(base, 'fixture.html'), 'utf8');
  const controllerUrl = manifest.controller
    ? moduleUrl(await readFile(resolve(base, manifest.controller), 'utf8'))
    : null;
  const moduleUrls = {};
  const adapterCache = new Map();
  for (const binding of manifest.renderers.web.bindings) {
    if (moduleUrls[binding.module]) continue;
    moduleUrls[binding.module] = await adapterModuleUrl(binding.module, adapterCache);
  }
  previews.set(entry.id, { manifest, fixture, controllerUrl, moduleUrls });
}

async function destroyMounted(page) {
  await page.evaluate(() => {
    try { window.__nsPreview?.mounted?.destroy?.(); } catch {}
    delete window.__nsPreview;
  }).catch(() => {});
}

async function mountState(page, preview) {
  await destroyMounted(page);
  await page.setContent(`<!doctype html><html><body><main id="preview-root">${preview.fixture}</main></body></html>`);
  await page.evaluate(async ({ manifest, runtimeUrl, moduleUrls, controllerUrl }) => {
    const runtime = await import(runtimeUrl);
    const root = document.querySelector('#preview-root');
    const mounted = await runtime.mountPreviewBindings({
      root,
      manifest,
      moduleResolver: (path) => {
        const url = moduleUrls[path];
        if (!url) throw new Error(`No preview module URL for ${path}`);
        return import(url);
      }
    });
    window.__nsPreview = { root, manifest, runtime, mounted, controllerUrl };
  }, {
    manifest: preview.manifest,
    runtimeUrl,
    moduleUrls: preview.moduleUrls,
    controllerUrl: preview.controllerUrl
  });
}

async function realizeNativeKeyboard(page, selector) {
  const locator = page.locator(selector);
  let focused = false;
  for (let attempt = 0; attempt < 24; attempt += 1) {
    await page.keyboard.press('Tab');
    focused = await locator.evaluate((element) => document.activeElement === element);
    if (focused) break;
  }
  expect(focused, `keyboard focus did not reach ${selector}`).toBe(true);
  expect(await locator.evaluate((element) => element.matches(':focus-visible'))).toBe(true);
}

async function realizeNativePointer(page, selector, state) {
  const locator = page.locator(selector);
  await locator.hover();
  if (state === 'hover') {
    expect(await locator.evaluate((element) => element.matches(':hover'))).toBe(true);
    return;
  }
  const box = await locator.boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  expect(await locator.evaluate((element) => element.matches(':active'))).toBe(true);
  await page.mouse.up();
}

async function realizeController(page, state) {
  await page.evaluate(async (state) => {
    const preview = window.__nsPreview;
    if (!preview?.controllerUrl) throw new Error(`Controller URL missing for ${preview?.manifest?.component ?? 'unknown'}`);
    const controller = await import(preview.controllerUrl);
    preview.runtime.applyPreviewController({
      root: preview.root,
      manifest: preview.manifest,
      state,
      controller,
      helpers: preview.mounted.helpers
    });
  }, state);
}

async function assertControllerPostcondition(page, component, state, target) {
  const passed = await page.evaluate(({ component, state, target }) => {
    const element = document.querySelector(target);
    const byId = (id) => document.getElementById(id);
    if (!element) return false;

    if (component === 'core.button') {
      if (state === 'loading') return element.dataset.loading === 'true' && element.getAttribute('aria-busy') === 'true' && element.getAttribute('aria-disabled') === 'true';
      if (state === 'disabled') return element.disabled === true;
    }
    if (component === 'core.checkbox') {
      if (state === 'checked') return element.checked === true && element.dataset.state === 'checked';
      if (state === 'invalid') return element.getAttribute('aria-invalid') === 'true';
      if (state === 'disabled') return element.disabled === true;
    }
    if (component === 'core.context-menu' && state === 'focus-visible') {
      const menu = byId('context-menu-menu');
      return document.activeElement === element && menu?.hidden === false && menu?.dataset.state === 'open' && element.getAttribute('role') === 'menuitem';
    }
    if (component === 'core.input') {
      if (state === 'filled') return element.value.length > 0 && element.dataset.state === 'filled';
      if (state === 'invalid') return element.getAttribute('aria-invalid') === 'true';
      if (state === 'read-only') return element.readOnly === true;
      if (state === 'disabled') return element.disabled === true;
    }
    if (component === 'core.number-field') {
      const input = byId('number-field-input');
      const decrement = byId('number-field-decrement');
      const increment = byId('number-field-increment');
      if (state === 'filled') return input.value === '4' && element.dataset.state === 'filled';
      if (state === 'invalid') return input.getAttribute('aria-invalid') === 'true' && element.dataset.state === 'invalid';
      if (state === 'read-only') return input.readOnly === true && input.disabled === false && decrement.disabled === true && increment.disabled === true && element.dataset.state === 'read-only';
      if (state === 'disabled') return input.disabled === true && decrement.disabled === true && increment.disabled === true && element.dataset.state === 'disabled';
    }
    if (component === 'core.slider' && state === 'disabled') {
      const inputs = [...element.querySelectorAll('input[type="range"]')];
      return inputs.length === 1 && inputs.every((input) => input.disabled === true) && element.dataset.state === 'disabled';
    }
    if (component === 'core.multi-select') {
      const root = byId('multi-select-demo');
      const trigger = byId('multi-select-trigger');
      const list = byId('multi-select-listbox');
      if (state === 'open') return root.dataset.state === 'open' && trigger.getAttribute('aria-expanded') === 'true';
      if (state === 'selected') return root.dataset.selectionState === 'selected' && root.dataset.selectedCount === '2' && byId('multi-select-option-react').getAttribute('aria-selected') === 'true' && byId('multi-select-option-vue').getAttribute('aria-selected') === 'true';
      if (state === 'highlighted') return root.dataset.highlightState === 'highlighted' && root.dataset.highlightedValue === 'svelte' && list.getAttribute('aria-activedescendant') === 'multi-select-option-svelte' && byId('multi-select-option-svelte').dataset.highlighted === 'true';
      if (state === 'invalid') return root.dataset.state === 'invalid' && list.getAttribute('aria-invalid') === 'true';
      if (state === 'disabled') return root.dataset.state === 'disabled' && trigger.disabled === true && list.getAttribute('aria-disabled') === 'true';
    }
    if (component === 'core.multi-select') {
      const root = byId('multi-select-demo');
      const trigger = byId('multi-select-trigger');
      const list = byId('multi-select-listbox');
      if (state === 'open') return root.dataset.state === 'open' && trigger.getAttribute('aria-expanded') === 'true';
      if (state === 'selected') return root.dataset.selectionState === 'selected' && root.dataset.selectedCount === '2' && byId('multi-select-option-react').getAttribute('aria-selected') === 'true' && byId('multi-select-option-vue').getAttribute('aria-selected') === 'true';
      if (state === 'highlighted') return root.dataset.highlightState === 'highlighted' && root.dataset.highlightedValue === 'svelte' && list.getAttribute('aria-activedescendant') === 'multi-select-option-svelte' && byId('multi-select-option-svelte').dataset.highlighted === 'true';
      if (state === 'invalid') return root.dataset.state === 'invalid' && list.getAttribute('aria-invalid') === 'true';
      if (state === 'disabled') return root.dataset.state === 'disabled' && trigger.disabled === true && list.getAttribute('aria-disabled') === 'true';
    }
    if (component === 'core.calendar') {
      const root = byId('calendar-demo');
      if (state === 'selected') return root.dataset.selectionState === 'selected' && root.dataset.selectedValue === '2026-09-16' && byId('calendar-grid-day-2026-09-16').dataset.state === 'selected';
      if (state === 'range-start') return root.dataset.selectionState === 'range-partial' && root.dataset.rangeStart === '2026-09-14' && byId('calendar-grid-day-2026-09-14').dataset.rangePosition === 'start';
      if (state === 'range-middle') return root.dataset.selectionState === 'range-selected' && byId('calendar-grid-day-2026-09-16').dataset.rangePosition === 'middle';
      if (state === 'range-end') return root.dataset.selectionState === 'range-selected' && root.dataset.rangeEnd === '2026-09-18' && byId('calendar-grid-day-2026-09-18').dataset.rangePosition === 'end';
      if (state === 'disabled') return root.dataset.state === 'disabled' && root.dataset.disabled === 'true' && byId('calendar-grid').getAttribute('aria-disabled') === 'true';
    }
    if (component === 'core.date-picker') {
      const root = byId('date-picker-demo');
      const start = byId('date-picker-start');
      const end = byId('date-picker-end');
      const trigger = byId('date-picker-trigger');
      const popup = byId('date-picker-popup');
      const calendar = byId('date-picker-calendar');
      if (state === 'open') return root.dataset.state === 'open' && trigger.getAttribute('aria-expanded') === 'true' && popup.hidden === false;
      if (state === 'selected') return root.dataset.selectionState === 'selected' && root.dataset.selectedValue === '2026-09-16' && start.value === '2026-09-16' && calendar.dataset.selectedDate === '2026-09-16';
      if (state === 'range-partial') return root.dataset.mode === 'range' && root.dataset.selectionState === 'range-partial' && start.value === '2026-09-14' && end.value === '' && calendar.dataset.rangeStart === '2026-09-14';
      if (state === 'range-selected') return root.dataset.selectionState === 'range-selected' && root.dataset.selectedValue === '2026-09-14/2026-09-18' && end.value === '2026-09-18' && calendar.dataset.rangeEnd === '2026-09-18';
      if (state === 'invalid') return root.dataset.state === 'invalid' && start.getAttribute('aria-invalid') === 'true' && byId('date-picker-error').hidden === false;
      if (state === 'disabled') return root.dataset.state === 'disabled' && trigger.disabled === true && byId('date-picker-calendar-grid').getAttribute('aria-disabled') === 'true';
    }
    if (component === 'core.file-upload') {
      const root = byId('file-upload-demo');
      const input = byId('file-upload-input');
      const dropzone = byId('file-upload-dropzone');
      if (state === 'drag-active') return root.dataset.state === 'drag-active' && dropzone.dataset.dragActive === 'true' && root.dataset.selectedCount === '0';
      if (state === 'selected') return root.dataset.state === 'selected' && root.dataset.selectedCount === '2' && input.files?.length === 2;
      if (state === 'invalid') return root.dataset.state === 'invalid' && input.getAttribute('aria-invalid') === 'true' && byId('file-upload-error').hidden === false;
      if (state === 'disabled') return root.dataset.state === 'disabled' && input.disabled === true && root.dataset.disabled === 'true';
    }
    if (component === 'core.input-otp') {
      const input = byId('input-otp-input');
      if (state === 'partial') return input.value === '123' && element.dataset.state === 'partial';
      if (state === 'complete') return input.value === '123456' && element.dataset.state === 'complete';
      if (state === 'invalid') return input.getAttribute('aria-invalid') === 'true' && element.dataset.state === 'invalid';
      if (state === 'disabled') return input.disabled === true && element.dataset.state === 'disabled';
    }
    if (component === 'core.color-picker') {
      const input = byId('color-picker-input');
      const output = byId('color-picker-value');
      if (state === 'selected') return input.value === '#2e6e50' && output.textContent === '#2E6E50' && element.dataset.state === 'selected';
      if (state === 'invalid') return input.getAttribute('aria-invalid') === 'true' && element.dataset.state === 'invalid';
      if (state === 'disabled') return input.disabled === true && element.dataset.state === 'disabled';
    }
    if (component === 'core.time-picker') {
      const input = byId('time-picker-input');
      if (state === 'filled') return input.value === '10:30' && element.dataset.state === 'filled';
      if (state === 'invalid') return input.getAttribute('aria-invalid') === 'true' && element.dataset.state === 'invalid';
      if (state === 'read-only') return input.readOnly === true && input.disabled === false && element.dataset.state === 'read-only';
      if (state === 'disabled') return input.disabled === true && element.dataset.state === 'disabled';
    }
    if (component === 'core.radio') {
      if (state === 'invalid') return element.getAttribute('aria-invalid') === 'true';
      if (state === 'disabled') return element.disabled === true;
    }
    if (component === 'core.switch') {
      if (state === 'on') return element.checked === true && element.dataset.state === 'on';
      if (state === 'invalid') return element.getAttribute('aria-invalid') === 'true';
      if (state === 'disabled') return element.disabled === true;
    }
    if (component === 'core.toggle') {
      if (state === 'off') return element.getAttribute('aria-pressed') === 'false' && element.dataset.state === 'off';
      if (state === 'on') return element.getAttribute('aria-pressed') === 'true' && element.dataset.state === 'on';
      if (state === 'disabled') return element.disabled === true && element.dataset.state === 'disabled';
    }
    if (component === 'core.toggle-group') {
      const toggles = [...element.querySelectorAll('.ns-toggle')];
      if (state === 'none-selected') return element.dataset.state === 'none-selected' && element.dataset.selectedCount === '0' && toggles.every((toggle) => toggle.getAttribute('aria-pressed') === 'false');
      if (state === 'selected') return element.dataset.state === 'selected' && element.dataset.selectedCount === '2' && byId('toggle-group-bold')?.getAttribute('aria-pressed') === 'true' && byId('toggle-group-italic')?.getAttribute('aria-pressed') === 'true';
      if (state === 'disabled') return element.dataset.state === 'disabled' && toggles.every((toggle) => toggle.disabled === true);
    }
    if (component === 'core.textarea') {
      if (state === 'filled') return element.value.length > 0 && element.dataset.state === 'filled';
      if (state === 'invalid') return element.getAttribute('aria-invalid') === 'true';
      if (state === 'read-only') return element.readOnly === true;
      if (state === 'disabled') return element.disabled === true;
    }
    if (component === 'core.select') {
      if (state === 'invalid') return element.getAttribute('aria-invalid') === 'true';
      if (state === 'disabled') return element.disabled === true;
    }
    if (component === 'core.tooltip') {
      if (state === 'open' || state === 'dismissed') return element.dataset.state === state;
    }
    if (component === 'core.combobox') {
      const root = byId('combobox-demo');
      const input = byId('combobox-input');
      if (state === 'open') return root.dataset.state === 'open' && input.getAttribute('aria-expanded') === 'true';
      if (state === 'query-filled') return root.dataset.queryState === 'query-filled' && input.value === 'Re';
      if (state === 'highlighted') return input.getAttribute('aria-activedescendant') === 'combobox-option-react' && byId('combobox-option-react').dataset.active === 'true';
      if (state === 'selected') return byId('combobox-option-react').getAttribute('aria-selected') === 'true' && root.dataset.selectionState === 'selected' && input.value === 'React';
      if (state === 'invalid') return input.getAttribute('aria-invalid') === 'true';
      if (state === 'disabled') return input.disabled === true && byId('combobox-trigger').disabled === true;
    }
    if (component === 'core.dialog' && state === 'open') {
      const root = byId('dialog-demo');
      return element.tagName === 'DIALOG'
        && element.open === true
        && element.matches(':modal')
        && element.dataset.state === 'open'
        && root?.dataset.state === 'open'
        && element.contains(document.activeElement);
    }
    if (component === 'core.alert-dialog' && state === 'open') {
      const root = byId('alert-dialog-demo');
      const safer = byId('alert-dialog-cancel');
      return element.tagName === 'DIALOG'
        && element.getAttribute('role') === 'alertdialog'
        && element.open === true
        && element.matches(':modal')
        && element.dataset.state === 'open'
        && root?.dataset.state === 'open'
        && element.contains(document.activeElement)
        && document.activeElement === safer;
    }
    if (component === 'core.drawer' && state === 'open') {
      const root = byId('drawer-demo');
      return element.tagName === 'DIALOG'
        && element.open === true
        && element.matches(':modal')
        && element.dataset.state === 'open'
        && root?.dataset.state === 'open'
        && root?.dataset.drawerPlacement === 'inline-end'
        && element.dataset.drawerPlacement === 'inline-end'
        && element.contains(document.activeElement)
        && document.activeElement?.id === 'drawer-close';
    }
    if (component === 'core.popover' && state === 'open') {
      const root = byId('popover-demo');
      const trigger = byId('popover-trigger');
      return element.matches(':popover-open')
        && element.dataset.state === 'open'
        && root?.dataset.state === 'open'
        && root?.dataset.popoverSide === 'block-end'
        && element.dataset.popoverSide === 'block-end'
        && trigger?.getAttribute('aria-expanded') === 'true'
        && !element.hasAttribute('aria-modal');
    }
    if (component === 'core.hover-card' && (state === 'open' || state === 'dismissed')) {
      const trigger = byId('hover-card-trigger');
      return element.dataset.state === state
        && trigger?.dataset.hoverCardState === state
        && trigger?.getAttribute('aria-details') === 'hover-card-surface'
        && element.tabIndex < 0
        && !element.hasAttribute('aria-modal')
        && !element.hasAttribute('aria-haspopup')
        && !element.hasAttribute('aria-expanded')
        && !['tooltip','dialog','alertdialog','menu','menubar','navigation'].includes(element.getAttribute('role'));
    }
    if (component === 'core.accordion' && state === 'open') {
      return element.getAttribute('aria-expanded') === 'true' && byId('accordion-single-panel-b').hidden === false;
    }
    if (component === 'core.data-grid') {
      const grid = byId('data-grid-demo');
      if (state === 'selected') {
        return element.getAttribute('role') === 'gridcell'
          && element.getAttribute('aria-selected') === 'true'
          && grid?.dataset.selectedCell === element.id
          && grid?.dataset.state === 'selected';
      }
      if (state === 'editing') {
        const editor = element.querySelector('[data-grid-editor]');
        return element.getAttribute('role') === 'gridcell'
          && element.dataset.editing === 'true'
          && element.dataset.state === 'editing'
          && editor?.hidden === false
          && document.activeElement === editor
          && grid?.dataset.editingCell === element.id
          && grid?.dataset.state === 'editing';
      }
    }
    return false;
  }, { component, state, target });
  expect(passed, `${component} controller postcondition failed for ${state}`).toBe(true);
}

async function assertFixturePostcondition(page, component, state, target) {
  const passed = await page.evaluate(({ component, state, target }) => {
    const element = document.querySelector(target);
    if (!element) return false;
    if (component === 'core.checkbox' && state === 'indeterminate') return element.indeterminate === true && element.dataset.state === 'indeterminate';
    if (component === 'core.checkbox' && state === 'unchecked') return element.checked === false && element.dataset.state === 'unchecked';
    if (component === 'core.input' && state === 'empty') return element.value === '' && element.dataset.state === 'empty';
    if (component === 'core.number-field' && state === 'empty') return element.value === '' && element.dataset.state === 'empty';
    if (component === 'core.multi-select' && state === 'closed') return element.dataset.state === 'closed' && document.getElementById('multi-select-trigger')?.getAttribute('aria-expanded') === 'false';
    if (component === 'core.multi-select' && state === 'none-selected') return element.dataset.selectionState === 'none-selected' && element.dataset.selectedCount === '0';
    if (component === 'core.multi-select' && state === 'closed') return element.dataset.state === 'closed' && document.getElementById('multi-select-trigger')?.getAttribute('aria-expanded') === 'false';
    if (component === 'core.multi-select' && state === 'none-selected') return element.dataset.selectionState === 'none-selected' && element.dataset.selectedCount === '0';
    if (component === 'core.calendar' && state === 'current') return element.dataset.state === 'current' && element.getAttribute('aria-current') === 'date';
    if (component === 'core.calendar' && state === 'unavailable') return element.dataset.state === 'unavailable' && element.getAttribute('aria-disabled') === 'true' && element.getAttribute('aria-label')?.includes('unavailable');
    if (component === 'core.date-picker' && state === 'closed') return element.dataset.state === 'closed' && document.getElementById('date-picker-trigger')?.getAttribute('aria-expanded') === 'false' && document.getElementById('date-picker-popup')?.hidden === true;
    if (component === 'core.drawer' && state === 'closed') return element.tagName === 'DIALOG' && element.open === false && element.dataset.state === 'closed' && document.getElementById('drawer-demo')?.dataset.state === 'closed' && element.dataset.drawerPlacement === 'inline-end';
    if (component === 'core.popover' && state === 'closed') return !element.matches(':popover-open') && element.dataset.state === 'closed' && document.getElementById('popover-demo')?.dataset.state === 'closed' && document.getElementById('popover-trigger')?.getAttribute('aria-expanded') === 'false' && element.dataset.popoverSide === 'block-end';
    if (component === 'core.hover-card' && state === 'closed') return element.dataset.state === 'closed' && document.getElementById('hover-card-trigger')?.dataset.hoverCardState === 'closed' && document.getElementById('hover-card-trigger')?.getAttribute('aria-details') === 'hover-card-surface' && element.dataset.hoverCardSide === 'block-end';
    if (component === 'core.dropdown-menu') {
      const trigger = document.getElementById(state === 'open' ? 'dropdown-menu-state-trigger' : 'dropdown-menu-trigger');
      const menu = document.getElementById(state === 'open' ? 'dropdown-menu-state-menu' : 'dropdown-menu-menu');
      if (state === 'closed') return element.dataset.state === 'closed' && trigger?.getAttribute('aria-expanded') === 'false' && menu?.hidden === true;
      if (state === 'open') return element.dataset.state === 'open' && trigger?.getAttribute('aria-expanded') === 'true' && menu?.hidden === false;
      if (state === 'checked') return element.getAttribute('role') === 'menuitemcheckbox' && element.getAttribute('aria-checked') === 'true' && element.dataset.state === 'checked';
      if (state === 'disabled') return element.getAttribute('aria-disabled') === 'true' && element.dataset.state === 'disabled';
    }
    if (component === 'core.context-menu') {
      const menu = document.getElementById(state === 'open' ? 'context-menu-state-menu' : 'context-menu-menu');
      if (state === 'closed') return element.dataset.state === 'closed' && menu?.hidden === true && !document.getElementById('context-menu-target')?.hasAttribute('aria-expanded');
      if (state === 'open') return element.dataset.state === 'open' && menu?.hidden === false && menu?.getAttribute('role') === 'menu';
      if (state === 'checked') return element.getAttribute('role') === 'menuitemcheckbox' && element.getAttribute('aria-checked') === 'true' && element.dataset.state === 'checked';
      if (state === 'disabled') return element.getAttribute('aria-disabled') === 'true' && element.dataset.state === 'disabled';
    }
    if (component === 'core.menubar') {
      const rootMenu = document.getElementById(state === 'open' ? 'menubar-state-root' : 'menubar-root');
      const submenu = document.getElementById(state === 'open' ? 'menubar-state-menu' : 'menubar-file-menu');
      if (state === 'closed') return element.dataset.state === 'closed' && rootMenu?.getAttribute('role') === 'menubar' && submenu?.hidden === true && document.getElementById('menubar-file')?.getAttribute('aria-expanded') === 'false';
      if (state === 'open') return element.dataset.state === 'open' && rootMenu?.getAttribute('role') === 'menubar' && submenu?.hidden === false && document.getElementById('menubar-state-parent')?.getAttribute('aria-expanded') === 'true';
      if (state === 'checked') return element.getAttribute('role') === 'menuitemcheckbox' && element.getAttribute('aria-checked') === 'true' && element.dataset.state === 'checked';
      if (state === 'disabled') return element.getAttribute('aria-disabled') === 'true' && element.dataset.state === 'disabled';
    }
    if (component === 'core.navigation-menu') {
      const root = document.getElementById(state === 'open' ? 'navigation-menu-state-open' : 'navigation-menu-demo');
      const trigger = document.getElementById(state === 'open' ? 'navigation-menu-state-trigger' : 'navigation-menu-guides-trigger');
      const panel = document.getElementById(state === 'open' ? 'navigation-menu-state-panel' : 'navigation-menu-guides-panel');
      if (state === 'closed') return element.tagName === 'NAV' && element.dataset.state === 'closed' && trigger?.getAttribute('aria-expanded') === 'false' && panel?.hidden === true;
      if (state === 'open') return root?.tagName === 'NAV' && root?.dataset.state === 'open' && trigger?.getAttribute('aria-expanded') === 'true' && panel?.hidden === false;
      if (state === 'current') return element.tagName === 'A' && element.getAttribute('aria-current') === 'page' && element.hasAttribute('href');
    }
    if (component === 'core.toast') {
      if (state === 'queued') return element.dataset.state === 'queued' && element.getAttribute('aria-hidden') === 'true';
      if (state === 'visible') return element.dataset.state === 'visible' && element.hidden === false && element.getAttribute('role') === 'status' && element.getAttribute('aria-live') === 'polite';
      if (state === 'dismissed') return element.dataset.state === 'dismissed' && element.getAttribute('aria-hidden') === 'true';
    }
    if (component === 'core.table' && state === 'rest') {
      return element.tagName === 'TABLE'
        && element.dataset.state === 'rest'
        && element.querySelector('caption')?.textContent?.includes('Workspace access summary')
        && element.querySelectorAll('th[scope="col"]').length === 4
        && element.querySelectorAll('th[scope="row"]').length === 4
        && !element.hasAttribute('role')
        && !element.hasAttribute('tabindex');
    }
    if (component === 'core.data-grid') {
      const grid = document.getElementById('data-grid-demo');
      if (state === 'rest') return element.getAttribute('role') === 'grid' && element.dataset.state === 'rest' && grid?.querySelectorAll('[role="gridcell"][tabindex="0"]').length === 1 && grid?.querySelectorAll('[role="gridcell"][aria-selected="true"]').length === 0;
      if (state === 'hover') return element.getAttribute('role') === 'gridcell';
      if (state === 'focus-visible') return element.getAttribute('role') === 'gridcell' && document.activeElement === element && element.tabIndex === 0;
      if (state === 'selected') return element.getAttribute('role') === 'gridcell' && element.getAttribute('aria-selected') === 'true' && grid?.dataset.selectedCell === element.id;
      if (state === 'editing') {
        const editor = element.querySelector('[data-grid-editor]');
        return element.dataset.editing === 'true' && element.dataset.state === 'editing' && editor?.hidden === false && document.activeElement === editor && grid?.dataset.editingCell === element.id;
      }
    }
    if (component === 'core.item' && state === 'rest') {
      return element.tagName === 'ARTICLE'
        && element.dataset.state === 'rest'
        && !element.hasAttribute('role')
        && !element.hasAttribute('tabindex')
        && element.querySelector('.ns-item__title')?.textContent?.includes('Foundry workspace')
        && element.querySelector('#item-demo-action')?.tagName === 'BUTTON';
    }
    if (component === 'core.list' && state === 'rest') {
      return element.tagName === 'UL'
        && element.dataset.state === 'rest'
        && element.querySelectorAll(':scope > li').length === 3
        && !element.hasAttribute('role')
        && !element.hasAttribute('tabindex');
    }
    if (component === 'core.description-list' && state === 'rest') {
      return element.tagName === 'DL'
        && element.dataset.state === 'rest'
        && element.querySelectorAll(':scope > dt').length === 4
        && element.querySelectorAll(':scope > dd').length === 4
        && !element.hasAttribute('role')
        && !element.hasAttribute('tabindex');
    }
    if (component === 'core.date-picker' && state === 'empty') return element.dataset.selectionState === 'empty' && document.getElementById('date-picker-start')?.value === '';
    if (component === 'core.file-upload' && state === 'empty') return element.dataset.state === 'empty' && element.dataset.selectionState === 'empty' && element.dataset.selectedCount === '0';
    if (component === 'core.input-otp' && state === 'empty') return element.value === '' && element.dataset.state === 'empty';
    if (component === 'core.time-picker' && state === 'empty') return element.value === '' && element.dataset.state === 'empty';
    if (component === 'core.radio' && state === 'checked') return element.checked === true && element.dataset.state === 'checked';
    if (component === 'core.radio' && state === 'unchecked') return element.checked === false && element.dataset.state === 'unchecked';
    if (component === 'core.switch' && state === 'off') return element.checked === false && element.dataset.state === 'off';
    if (component === 'core.tabs' && state === 'selected') return element.getAttribute('aria-selected') === 'true';
    if (component === 'core.tabs' && state === 'unselected') return element.getAttribute('aria-selected') === 'false';
    if (component === 'core.tabs' && state === 'disabled') return element.disabled === true;
    if (component === 'core.textarea' && state === 'empty') return element.value === '' && element.dataset.state === 'empty';
    if (component === 'core.select' && state === 'selected') return element.dataset.state === 'selected';
    if (component === 'core.tooltip' && state === 'closed') return element.dataset.state === 'closed';
    if (component === 'core.combobox' && state === 'closed') return element.dataset.state === 'closed';
    if (component === 'core.combobox' && state === 'query-empty') return document.getElementById('combobox-demo').dataset.queryState === 'query-empty';
    if (component === 'core.accordion' && state === 'closed') return element.getAttribute('aria-expanded') === 'false';
    if (state === 'disabled' && 'disabled' in element) return element.disabled === true;
    if (state === 'current') return element.hasAttribute('aria-current');
    return true;
  }, { component, state, target });
  expect(passed, `${component} fixture postcondition failed for ${state}`).toBe(true);
}

test('contract-only Core entries do not claim shipping preview directories', async () => {
  for (const entry of contractOnlyComponents) {
    const slug = entry.id.split('.')[1];
    let exists = true;
    try {
      await access(resolve(root, 'packages/core/previews', slug));
    } catch (error) {
      if (error?.code === 'ENOENT') exists = false;
      else throw error;
    }
    expect(exists, `${entry.id} must remain preview-free while contract-only`).toBe(false);
  }
});

for (const entry of previewableComponents) {
  test(`${entry.id} shared preview realizes every canonical state`, async ({ page }) => {
    const preview = previews.get(entry.id);
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    expect(Object.keys(preview.manifest.stateRealization)).toEqual((await json(`packages/core/${entry.contract}`)).states);

    for (const [state, realization] of Object.entries(preview.manifest.stateRealization)) {
      await mountState(page, preview);
      const target = page.locator(realization.target);
      await expect(target).toHaveCount(1);

      if (realization.mode === 'native-keyboard') {
        await realizeNativeKeyboard(page, realization.target);
      } else if (realization.mode === 'native-pointer') {
        await realizeNativePointer(page, realization.target, state);
      } else if (realization.mode === 'controller') {
        await realizeController(page, state);
        await assertControllerPostcondition(page, entry.id, state, realization.target);
      } else {
        await assertFixturePostcondition(page, entry.id, state, realization.target);
      }
    }

    await destroyMounted(page);
    expect(pageErrors).toEqual([]);
  });
}
