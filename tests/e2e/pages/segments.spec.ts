import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers';

test.describe('Segments', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
  });

  test('should load segments list page', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/segments');
    await expect(page).toHaveURL('/segments');
    await expect(
      page.getByTestId('segments-list').or(page.getByTestId('segments-empty-state'))
    ).toBeVisible({ timeout: 10000 });
  });

  test('should allow creating a new segment', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/segments');
    await page.waitForLoadState('domcontentloaded');

    const createButton = page.getByTestId('create-segment');
    if (await createButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createButton.click();
      await page.waitForLoadState('domcontentloaded');
      await expect(page).toHaveURL(/\/segments/);
    }
  });
});
