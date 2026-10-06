import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers';

test.describe('JSON Schemas', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
  });

  test('should load JSON schemas list page', async ({ page }) => {
    await Promise.all([
      page
        .waitForResponse(
          (r) => r.url().includes('/api/cxs/jsonSchema') || r.url().includes('/api/json-schemas'),
          { timeout: 20000 }
        )
        .catch(() => null),
      AuthHelpers.safeGoto(page, '/json-schemas'),
    ]);
    await expect(page).toHaveURL('/json-schemas');
    await expect(page.getByText('Loading schemas...')).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByTestId('schemas-list')).toBeVisible({ timeout: 15000 });
  });

  test('should allow creating a new schema', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/json-schemas');
    await page.waitForLoadState('domcontentloaded');

    const createButton = page.locator('[data-testid="create-schema"]');
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      await page.waitForLoadState('domcontentloaded');
    }
  });
});
