import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers';
import { e2eSupportsTenants } from '../unomi-matrix';

test.describe('Unomi version matrix', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
  });

  test('tenant config matches Unomi < 3.1 vs >= 3.1', async ({ page }) => {
    const res = await page.request.get('/api/config/tenant');
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as {
      supportsTenants?: boolean;
      tenantAdminEnabled?: boolean;
    };
    const expectTenants = e2eSupportsTenants();
    expect(body.supportsTenants).toBe(expectTenants);
    expect(body.tenantAdminEnabled).toBe(expectTenants);
  });

  test('tenant management route follows Unomi line', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/tenants');
    if (e2eSupportsTenants()) {
      await expect(page).toHaveURL('/tenants');
      await expect(page.getByTestId('tenants-page')).toBeVisible({ timeout: 15000 });
    } else {
      await expect(page).toHaveURL('/');
    }
  });

  test('tenant switcher follows Unomi line', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/');
    await expect(page.getByTestId('dashboard')).toBeVisible({ timeout: 15000 });
    const switcher = page.getByTestId('tenant-switcher');
    if (e2eSupportsTenants()) {
      await expect(switcher).toBeVisible();
    } else {
      await expect(switcher).toHaveCount(0);
    }
  });

  test('tenant APIs follow Unomi line', async ({ page }) => {
    const res = await page.request.get('/api/tenants');
    if (e2eSupportsTenants()) {
      expect(res.ok()).toBe(true);
      const tenants = (await res.json()) as unknown[];
      expect(Array.isArray(tenants)).toBe(true);
    } else {
      expect(res.status()).toBe(404);
    }
  });
});
