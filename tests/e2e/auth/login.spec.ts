import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await AuthHelpers.safeGoto(page, '/login');
    await page.evaluate(() => {
      try {
        localStorage.clear();
      } catch {
        // ignore
      }
    });
  });

  test('should display login page', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await expect(page.getByTestId('login-email')).toBeVisible();
    await expect(page.getByTestId('login-password')).toBeVisible();
  });

  test('should successfully login as admin', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/login');
    await AuthHelpers.waitForLoginOptions(page);
    const email = process.env.ADMIN_EMAIL || 'admin@inoyu.local';
    const password = process.env.ADMIN_PASSWORD || 'admin';
    await page.getByTestId('login-email').fill(email);
    await page.getByTestId('login-password').fill(password);
    const adminRadio = page.getByTestId('login-type-admin');
    if (await adminRadio.count()) {
      await adminRadio.click();
    }
    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL(
      (url) => url.pathname === '/' || url.pathname === '/tenants',
      { timeout: 15000 }
    );
    await page.waitForLoadState('domcontentloaded');
    const isAuthenticated = await AuthHelpers.isAuthenticated(page);
    expect(isAuthenticated).toBe(true);

    await AuthHelpers.ensureActiveTenant(page);
    await AuthHelpers.safeGoto(page, '/');
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 15000 });
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/login');
    await AuthHelpers.waitForLoginOptions(page);
    await page.getByTestId('login-email').fill('wrong@example.com');
    await page.getByTestId('login-password').fill('wrongpassword');
    const adminRadio = page.getByTestId('login-type-admin');
    if (await adminRadio.count()) {
      await adminRadio.click();
    }
    await page.getByTestId('login-submit').click();

    await expect(page.getByTestId('login-error')).toBeVisible({ timeout: 5000 });
  });

  test('should persist authentication after page reload', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL('/');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 15000 });
    const isAuthenticated = await AuthHelpers.isAuthenticated(page);
    expect(isAuthenticated).toBe(true);
  });

  test('should successfully logout', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
    await AuthHelpers.logout(page);
    await expect(page).toHaveURL('/login');
    const isAuthenticated = await AuthHelpers.isAuthenticated(page);
    expect(isAuthenticated).toBe(false);
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/profiles');
    await expect(page).toHaveURL('/login');
  });

  test('should allow tenant login type selection', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/login');
    const hasTenantLogin = await AuthHelpers.waitForLoginOptions(page);
    test.skip(!hasTenantLogin, 'Tenant login options hidden until tenants exist');

    const adminRadio = page.getByTestId('login-type-admin');
    await expect(adminRadio).toBeChecked();

    await page.getByTestId('login-type-tenant').click();
    await expect(page.getByTestId('login-type-tenant')).toBeChecked();
    await expect(page.getByTestId('login-tenant-id')).toBeVisible();
  });

  test('should require tenant ID for tenant login', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/login');
    const hasTenantLogin = await AuthHelpers.waitForLoginOptions(page);
    test.skip(!hasTenantLogin, 'Tenant login options hidden until tenants exist');

    const tenantRadio = page.getByTestId('login-type-tenant');
    await tenantRadio.click();
    await page.getByTestId('login-email').fill('user@example.com');
    await page.getByTestId('login-password').fill('password');

    await page.getByTestId('login-submit').click();
    await expect(page).toHaveURL('/login');
  });
});
