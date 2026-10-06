import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
  });

  test('should load dashboard page', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/');
    await expect(page).toHaveURL('/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display metrics', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="dashboard-realtime-data"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test('should navigate to other pages from dashboard', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 10000 });

    await Promise.all([
      page
        .waitForResponse(
          (r) => r.url().includes('/api/cxs/profiles/search') && r.request().method() === 'POST',
          { timeout: 20000 }
        )
        .catch(() => null),
      AuthHelpers.safeGoto(page, '/profiles'),
    ]);
    await expect(page).toHaveURL('/profiles', { timeout: 10000 });
    await expect(page.getByText('Loading profiles...')).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByTestId('profiles-list')).toBeVisible({ timeout: 15000 });
  });
});
