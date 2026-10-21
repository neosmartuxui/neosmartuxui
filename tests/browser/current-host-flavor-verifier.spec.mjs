import { test, expect } from '@playwright/test';
import { inspectFlavorPage, OFFICIAL_FLAVORS } from '../../tooling/proof/live-flavor-inspection.mjs';

for (const flavor of OFFICIAL_FLAVORS) {
  test(`current-host verifier checks browser Light and Dark evidence for ${flavor}`, async ({ page }) => {
    const evidence = await inspectFlavorPage(page, 'http://127.0.0.1:4173', flavor);
    expect(evidence.httpStatus).toBe(200);
    expect(evidence.url).toBe(`http://127.0.0.1:4173/flavors/${flavor}/`);
    expect(evidence.light).toBe(true);
    expect(evidence.dark).toBe(true);
    expect(evidence.title).toBe(`${flavor.charAt(0).toUpperCase() + flavor.slice(1)} Light`);
    expect(evidence.found).toBe(true);
  });
}

test('Flavor verifier rejects wrong Theme identity and missing Dark evidence', async ({ page }) => {
  await page.route('**/flavors/hardline/', route => route.fulfill({
    status: 200, contentType: 'text/html',
    body: '<main class="ns-theme-soft-light"><h1>Hardline Light</h1></main>'
  }));
  const evidence = await inspectFlavorPage(page, 'http://127.0.0.1:4173', 'hardline');
  expect(evidence.httpStatus).toBe(200);
  expect(evidence.light).toBe(false);
  expect(evidence.dark).toBe(false);
  expect(evidence.found).toBe(false);
});

test('Flavor verifier refuses unofficial paths before navigation', async ({ page }) => {
  await expect(inspectFlavorPage(page, 'http://127.0.0.1:4173', '../outside'))
    .rejects.toThrow(/Unrecognized Flavor/);
});
