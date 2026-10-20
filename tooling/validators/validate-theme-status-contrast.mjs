import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { contrastRatio } from '../../packages/contracts/color-contrast.mjs';

const root = resolve(import.meta.dirname, '../..');
const fail = (message) => { throw new Error(`[theme-status-contrast] ${message}`); };
const json = async (path) => JSON.parse(await readFile(resolve(root, path), 'utf8'));

const badgeCss = await readFile(resolve(root, 'packages/adapters/web/components/badge.css'), 'utf8');
const ruleBody = (selector) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'm').exec(badgeCss);
  if (!match) fail(`shipping badge.css is missing ${selector}`);
  return match[1];
};
const requireMarker = (body, marker, label) => {
  if (!body.includes(marker)) fail(`shipping badge.css ${label} must include ${marker}`);
};

const baseBadge = ruleBody('.ns-badge');
requireMarker(baseBadge, 'color: var(--ns-color-content-primary);', 'neutral foreground mapping');
requireMarker(baseBadge, 'background: var(--ns-color-surface-panel);', 'neutral background mapping');
for (const tone of ['info', 'success', 'warning']) {
  const body = ruleBody(`.ns-badge[data-tone="${tone}"]`);
  requireMarker(body, `background: var(--ns-color-state-${tone});`, `${tone} background mapping`);
  if (/\bcolor\s*:/.test(body)) fail(`shipping badge.css ${tone} tone must inherit color.content.primary`);
}
const errorBadge = ruleBody('.ns-badge[data-tone="error"]');
requireMarker(errorBadge, 'color: var(--ns-color-content-inverse);', 'error foreground mapping');
requireMarker(errorBadge, 'background: var(--ns-color-state-error);', 'error background mapping');

const tones = [
  ['neutral', 'color.content.primary', 'color.surface.panel'],
  ['info', 'color.content.primary', 'color.state.info'],
  ['success', 'color.content.primary', 'color.state.success'],
  ['warning', 'color.content.primary', 'color.state.warning'],
  ['error', 'color.content.inverse', 'color.state.error']
];

const themesDir = resolve(root, 'packages/themes');
const entries = await readdir(themesDir, { withFileTypes: true });
let checkedThemes = 0;
for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
  let bundle;
  try {
    bundle = await json(`packages/themes/${entry.name}/tokens.json`);
  } catch (error) {
    if (error?.code === 'ENOENT') continue;
    throw error;
  }
  if (!Array.isArray(bundle.scope) || !bundle.scope.includes('core.badge')) continue;
  if (!Array.isArray(bundle.values)) fail(`${entry.name} resolved bundle has no values array`);
  const values = new Map();
  for (const token of bundle.values) {
    if (!token || typeof token.id !== 'string') fail(`${entry.name} has an invalid resolved token entry`);
    if (values.has(token.id)) fail(`${entry.name} duplicates resolved token ${token.id}`);
    values.set(token.id, token.value);
  }
  for (const [tone, foregroundId, backgroundId] of tones) {
    const foreground = values.get(foregroundId);
    const background = values.get(backgroundId);
    if (typeof foreground !== 'string' || typeof background !== 'string') fail(`${entry.name} lacks ${tone} Badge color roles`);
    const ratio = contrastRatio(foreground, background);
    if (ratio < 4.5) fail(`${entry.name} ${tone} Badge contrast ${ratio.toFixed(3)}:1 is below 4.5:1 (${foregroundId} on ${backgroundId})`);
  }
  checkedThemes += 1;
}
if (checkedThemes < 7) fail(`expected at least seven concrete resolved Themes with core.badge, got ${checkedThemes}`);

console.log(`[theme-status-contrast] validated shipping Badge role mapping and >=4.5:1 authored contrast across ${checkedThemes} concrete Themes`);
