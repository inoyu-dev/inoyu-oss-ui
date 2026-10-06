import { defineConfig, devices } from '@playwright/test';
import { playwrightChildEnv } from './scripts/playwright-child-env';

export default defineConfig({
  testDir: './tests/e2e',

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  use: {
    baseURL: 'http://localhost:3131',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  timeout: 30 * 1000,
  expect: {
    timeout: 10 * 1000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    ...(process.env.CI ? [] : [{ name: 'webkit', use: { ...devices['Desktop Safari'] } }]),
  ],

  webServer: {
    command: process.env.CI ? 'npx next start -p 3131' : 'npm run dev',
    url: 'http://localhost:3131',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: playwrightChildEnv({
      JWT_SECRET: process.env.JWT_SECRET || 'test-secret',
      ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@inoyu.local',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',
      UNOMI_URL: process.env.UNOMI_URL || 'http://localhost:8181',
      UNOMI_USER: process.env.UNOMI_USER || 'karaf',
      UNOMI_PASSWORD: process.env.UNOMI_PASSWORD || 'karaf',
      // Must match the live Unomi: 2.7 (< 4.0, no tenant UI) or 4.0+.
      UNOMI_VERSION: process.env.UNOMI_VERSION || '4.0',
      DEPLOYMENT_TYPE: process.env.DEPLOYMENT_TYPE || 'on-premise',
    }),
  },
});
