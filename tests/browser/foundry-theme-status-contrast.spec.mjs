import { test, expect } from '@playwright/test';
import { contrastRatio } from '../../packages/contracts/color-contrast.mjs';

const themes = [
  { label: 'Rivet Light', route: '/', selector: 'main' },
  { label: 'Hardline Light', route: '/flavors/hardline/', selector: '.ns-theme-hardline-light' },
  { label: 'Hardline Dark', route: '/flavors/hardline/', selector: '.ns-theme-hardline-dark' },
  { label: 'Soft Light', route: '/flavors/soft/', selector: '.ns-theme-soft-light' },
  { label: 'Soft Dark', route: '/flavors/soft/', selector: '.ns-theme-soft-dark' },
  { label: 'Rivet Dark', route: '/flavors/rivet/', selector: '.ns-theme-rivet-dark' },
  { label: 'Mono Light', route: '/flavors/mono/', selector: '.ns-theme-mono-light' },
  { label: 'Mono Dark', route: '/flavors/mono/', selector: '.ns-theme-mono-dark' }
];
const tones = ['neutral', 'info', 'success', 'warning', 'error'];

for (const theme of themes) {
  test(`${theme.label} renders every Badge tone at >=4.5:1 authored text contrast`, async ({ page }) => {
    const errors = [];
    page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(theme.route);
    const root = page.locator(theme.selector).first();
    await expect(root).toBeVisible();

    const rendered = await root.evaluate((element, toneNames) => {
      const host = document.createElement('div');
      host.setAttribute('data-contrast-probe', 'badge-tones');
      host.style.position = 'absolute';
      host.style.insetInlineStart = '-10000px';
      host.style.insetBlockStart = '0';
      const results = [];
      for (const tone of toneNames) {
        const badge = document.createElement('span');
        badge.className = 'ns-badge';
        badge.dataset.tone = tone;
        badge.textContent = `${tone} status`;
        host.append(badge);
      }
      element.append(host);
      for (const badge of host.querySelectorAll('.ns-badge')) {
        const styles = getComputedStyle(badge);
        results.push({
          tone: badge.dataset.tone,
          color: styles.color,
          backgroundColor: styles.backgroundColor
        });
      }
      host.remove();
      return results;
    }, tones);

    expect(rendered).toHaveLength(tones.length);
    for (const state of rendered) {
      const ratio = contrastRatio(state.color, state.backgroundColor);
      expect(ratio, `${theme.label} ${state.tone}: ${state.color} on ${state.backgroundColor}`).toBeGreaterThanOrEqual(4.5);
    }
    expect(errors).toEqual([]);
  });
}
