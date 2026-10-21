import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

test('Foundry keeps its artifact URLs at the site root when served under /foundry/', async ({ page }) => {
  const attrs = await readFile(resolve('.gitattributes'), 'utf8');
  expect(attrs).toContain('apps/foundry/src/index.html text eol=lf');
  const authored = await readFile(resolve('apps/foundry/src/index.html'), 'utf8');
  expect(authored).not.toContain('\r\n');
  const html = await readFile(resolve('dist/foundry/index.html'), 'utf8');
  expect(html).not.toContain('<base href="/">');
  await page.goto('/');
  const assets = await page.locator('link[rel="stylesheet"], link[rel="icon"], script[src]').evaluateAll(elements =>
    elements.map(element => ({ tag: element.tagName, url: element.getAttribute('href') || element.getAttribute('src') }))
  );
  expect(assets.length).toBeGreaterThanOrEqual(50);
  for (const asset of assets) {
    expect(asset.url, `unrooted Foundry ${asset.tag} artifact`).toMatch(/^\/(?!\/)/);
    const hosted = new URL(asset.url, 'https://neosmartuxui.github.io/foundry/');
    expect(hosted.pathname.startsWith('/foundry/'), `bad nested-host asset ${asset.url}`).toBe(false);
    expect(hosted.origin).toBe('https://neosmartuxui.github.io');
  }
  const localAnchor = page.locator('#tooltip-target');
  await expect(localAnchor).toHaveAttribute('href', '#principles');
  const hostedAnchor = new URL(await localAnchor.getAttribute('href'),
    'https://neosmartuxui.github.io/foundry/');
  expect(hostedAnchor.pathname).toBe('/foundry/');
  expect(hostedAnchor.hash).toBe('#principles');
  const bodyWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(bodyWidth).toBeGreaterThan(0);
});
