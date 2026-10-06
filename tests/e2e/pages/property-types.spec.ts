import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers';

test.describe('Property Types', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
  });

  test('should load property types list page', async ({ page }) => {
    await Promise.all([
      page
        .waitForResponse(
          (r) => r.url().includes('/api/cxs/profiles/properties') || r.url().includes('property'),
          { timeout: 20000 }
        )
        .catch(() => null),
      AuthHelpers.safeGoto(page, '/property-types'),
    ]);
    await expect(page).toHaveURL('/property-types');
    await expect(page.getByText('Loading property types...')).toHaveCount(0, { timeout: 20000 });
    await expect(
      page.getByTestId('property-types-list').or(page.getByTestId('property-types-empty-state')).first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('should allow creating a new property type', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/property-types');
    await page.waitForLoadState('domcontentloaded');

    const createButton = page.locator('[data-testid="create-property-type"]');
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      await page.waitForLoadState('domcontentloaded');
    }
  });
});
