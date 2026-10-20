import { test, expect } from '@playwright/test';

test('Studio tolerates one transient host 503 while loading bounded component authority', async ({ page }) => {
  let requests = 0;
  await page.route('**/packages/core/components/button.json', async (route) => {
    requests += 1;
    if (requests === 1) {
      await route.fulfill({ status: 503, contentType: 'text/plain', body: 'temporary host outage' });
      return;
    }
    await route.continue();
  });

  await page.goto('/');
  await expect(page.locator('body')).toHaveAttribute('data-studio-ready', 'true', { timeout: 30_000 });
  await expect(page.locator('#component-select option')).toHaveCount(50);
  await expect(page.locator('#preview-status')).toContainText('Ready');
  expect(requests).toBe(2);
});
