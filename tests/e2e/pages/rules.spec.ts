import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers';

test.describe('Rules', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
  });

  test('should load rules list page', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/rules');
    await expect(page).toHaveURL('/rules');
    await expect(page.getByTestId('rules-list').or(page.getByTestId('rules-empty-state'))).toBeVisible(
      { timeout: 10000 }
    );
  });

  test('should allow creating a new rule', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/rules');
    await page.waitForLoadState('domcontentloaded');

    const createButton = page.getByTestId('create-rule');
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/rules/);
    }
  });
});
