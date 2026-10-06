import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers';

test.describe('Authorization', () => {
  test.describe.configure({ mode: 'serial' });

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

  test('should redirect to login when accessing protected route', async ({ page }) => {
    const protectedRoutes = [
      '/',
      '/profiles',
      '/segments',
      '/rules',
      '/json-schemas',
      '/property-types',
      '/settings',
      '/scopes',
      '/campaigns',
      '/goals',
      '/personas',
      '/scoring',
      '/user-lists',
    ];

    for (const route of protectedRoutes) {
      await AuthHelpers.safeGoto(page, route);
      await expect(page).toHaveURL('/login');
    }
  });

  test('should allow access to protected routes after login', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);

    const protectedRoutes = [
      '/',
      '/profiles',
      '/segments',
      '/rules',
    ];

    for (const route of protectedRoutes) {
      await AuthHelpers.safeGoto(page, route);
      await expect(page).toHaveURL(route, { timeout: 10000 });
    }
  });

  test('should maintain authentication across navigation', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);

    await AuthHelpers.safeGoto(page, '/profiles');
    await expect(page).toHaveURL('/profiles', { timeout: 10000 });

    await AuthHelpers.safeGoto(page, '/segments');
    await expect(page).toHaveURL('/segments', { timeout: 10000 });

    await AuthHelpers.safeGoto(page, '/rules');
    await expect(page).toHaveURL('/rules', { timeout: 10000 });

    const isAuthenticated = await AuthHelpers.isAuthenticated(page);
    expect(isAuthenticated).toBe(true);
  });

  test('should handle session expiration', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);

    await page.context().clearCookies();

    await AuthHelpers.safeGoto(page, '/profiles');
    await expect(page).toHaveURL('/login');
  });

  test('should allow access to login page when not authenticated', async ({ page }) => {
    await AuthHelpers.safeGoto(page, '/login');
    await expect(page).toHaveURL('/login');
    await expect(page.locator('[data-testid="login-email"]')).toBeVisible();
  });

  test('should prevent access to API endpoints without authentication', async ({ page }) => {
    const response = await page.request.get('/api/auth/user');
    expect(response.status()).toBe(401);
  });

  test('should allow access to API endpoints after authentication', async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
    const response = await page.request.get('/api/auth/user');
    expect(response.status()).toBe(200);
    const user = await response.json();
    expect(user).toHaveProperty('email');
  });
});
