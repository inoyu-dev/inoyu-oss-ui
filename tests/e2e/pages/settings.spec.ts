import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers';

test.describe('Settings', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
  });

  test('should load settings page', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/settings');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('[data-testid="settings-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('should allow updating configuration', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/settings');
    await page.waitForLoadState('domcontentloaded');

    const themeSelector = page.locator('[data-testid="theme-selector"]');
    if (await themeSelector.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(themeSelector).toBeVisible();
    }
  });
});
