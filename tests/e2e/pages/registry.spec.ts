import { test, expect } from '@playwright/test';
import { AuthHelpers } from '../helpers';

const OSS_REGISTRY_ROUTES = [
  '/scopes',
  '/campaigns',
  '/goals',
  '/personas',
  '/scoring',
  '/user-lists',
  '/action-types',
  '/condition-types',
  '/groovy-actions',
];

test.describe('OSS registry pages', () => {
  test.beforeEach(async ({ page }) => {
    await AuthHelpers.loginAsAdmin(page);
  });

  for (const route of OSS_REGISTRY_ROUTES) {
    test(`should load ${route}`, async ({ page }) => {
      await AuthHelpers.safeGoto(page, route);
      await expect(page).toHaveURL(route);
      await expect(page.getByTestId('layout')).toBeVisible({ timeout: 15000 });
    });
  }
});
