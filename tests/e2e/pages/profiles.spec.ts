import { test, expect } from '@playwright/test';
import { AuthHelpers, DataHelpers } from '../helpers';

test.describe('Profiles', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
  });

  test('should load profiles list page', async ({ page }) => {
    await Promise.all([
      page
        .waitForResponse(
          (r) => r.url().includes('/api/cxs/profiles/search') && r.request().method() === 'POST',
          { timeout: 20000 }
        )
        .catch(() => null),
      AuthHelpers.safeGoto(page, '/profiles'),
    ]);
    await expect(page).toHaveURL('/profiles');

    await expect(page.getByText('Loading profiles...')).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByTestId('profiles-list')).toBeVisible({ timeout: 10000 });
  });

  test('should display profile list', async ({ page }) => {
    const liveProfileId = await DataHelpers.ensureLiveProfile(page);
    await Promise.all([
      page
        .waitForResponse(
          (r) => r.url().includes('/api/cxs/profiles/search') && r.request().method() === 'POST',
          { timeout: 20000 }
        )
        .catch(() => null),
      AuthHelpers.safeGoto(page, '/profiles'),
    ]);

    await expect(page.getByText('Loading profiles...')).toHaveCount(0, { timeout: 20000 });
    await expect(page.getByTestId('profiles-table')).toBeVisible({ timeout: 15000 });
    await expect(page.getByTestId(`profile-item-${liveProfileId}`)).toBeVisible({ timeout: 15000 });
  });

  test('should allow searching profiles', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/profiles');
    await expect(page.getByText('Loading profiles...')).toHaveCount(0, { timeout: 20000 });

    const searchButton = page.getByTestId('search-profiles-button');
    await expect(searchButton).toBeVisible({ timeout: 15000 });
    await searchButton.click();
    await expect(page.getByTestId('profiles-list')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to profile detail page', async ({ page }) => {
    const liveProfileId = await DataHelpers.ensureLiveProfile(page);
    await AuthHelpers.safeGoto(page, '/profiles');
    await expect(page.getByText('Loading profiles...')).toHaveCount(0, { timeout: 20000 });

    const viewButton = page.getByTestId(`view-profile-${liveProfileId}`);
    await expect(viewButton).toBeVisible({ timeout: 15000 });
    await viewButton.click();
    await page.waitForURL(new RegExp(`/profiles/${liveProfileId}`), { timeout: 10000 });
    expect(page.url()).toContain(`/profiles/${liveProfileId}`);
  });

  test('should display profile detail page', async ({ page }) => {
    const liveProfileId = await DataHelpers.ensureLiveProfile(page);
    await AuthHelpers.safeGoto(page, `/profiles/${liveProfileId}`);
    await expect(page.locator('[data-testid="profile-detail"]')).toBeVisible({ timeout: 20000 });
  });
});
