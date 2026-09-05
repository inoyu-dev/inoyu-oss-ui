/**
 * Live-stack helpers for OSS UI Playwright e2e (real Unomi, no MSW).
 */

import { Page } from '@playwright/test';

export class AuthHelpers {
  static async waitForLoginOptions(page: Page, timeout = 10000): Promise<boolean> {
    const radios = page.getByTestId('login-type-admin');
    const bootstrap = page.getByText(/No tenants exist yet/i);
    await radios.or(bootstrap).first().waitFor({ state: 'visible', timeout });
    return (await radios.count()) > 0;
  }

  static async safeGoto(
    page: Page,
    path: string,
    { timeout = 15000, attempts = 3 }: { timeout?: number; attempts?: number } = {}
  ): Promise<void> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => undefined);
        await page.goto(path, { waitUntil: 'domcontentloaded', timeout });
        return;
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        const retryable =
          /NS_BINDING_ABORTED|NS_ERROR_FAILURE|NS_ERROR_CONNECTION_REFUSED|frame was detached|Navigation interrupted|net::ERR_ABORTED|ERR_CONNECTION_REFUSED|Target closed/i.test(
            msg
          );
        if (!retryable || attempt === attempts) {
          throw err;
        }
        const waitMs = /CONNECTION_REFUSED/i.test(msg) ? 1000 * attempt : 200 * attempt;
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
    throw lastError;
  }

  static async ensureActiveTenant(
    page: Page,
    preferredTenantId = process.env.E2E_TENANT_ID
  ): Promise<string | null> {
    const configRes = await page.request.get('/api/config/tenant');
    if (!configRes.ok()) {
      return null;
    }
    const config = (await configRes.json()) as {
      supportsTenants?: boolean;
      tenantAdminEnabled?: boolean;
      tenantId?: string | null;
      activeTenant?: { tenantId?: string; name?: string } | null;
    };

    if (!config.supportsTenants || !config.tenantAdminEnabled) {
      return config.activeTenant?.tenantId || config.tenantId || null;
    }

    if (config.activeTenant?.tenantId) {
      return config.activeTenant.tenantId;
    }

    const listRes = await page.request.get('/api/tenants');
    let tenants: Array<{ tenantId: string; name?: string }> = [];
    if (listRes.ok()) {
      tenants = await listRes.json();
    }

    let tenantId =
      (preferredTenantId &&
        tenants.find((t) => t.tenantId === preferredTenantId)?.tenantId) ||
      tenants[0]?.tenantId;

    if (!tenantId) {
      const createId = preferredTenantId || 'e2e-tenant';
      const createRes = await page.request.post('/api/tenants', {
        data: {
          requestedId: createId,
          name: 'E2E Tenant',
        },
      });
      if (!createRes.ok()) {
        const body = await createRes.text();
        throw new Error(`Failed to create E2E tenant (${createRes.status()}): ${body}`);
      }
      const created = (await createRes.json()) as { tenantId: string };
      tenantId = created.tenantId;
    }

    const loginAsRes = await page.request.post(
      `/api/tenants/${encodeURIComponent(tenantId)}/login-as`
    );
    if (!loginAsRes.ok()) {
      const body = await loginAsRes.text();
      throw new Error(`Failed to login-as tenant ${tenantId} (${loginAsRes.status()}): ${body}`);
    }
    const credentials = (await loginAsRes.json()) as {
      tenantId: string;
      publicApiKey: string;
      privateApiKey: string;
      name?: string;
    };

    const contextPayload = {
      tenantId: credentials.tenantId,
      publicApiKey: credentials.publicApiKey,
      privateApiKey: credentials.privateApiKey,
      name: credentials.name,
      switchedAt: new Date().toISOString(),
    };

    const origin = 'http://localhost:3131';
    let cookieUrl = origin;
    try {
      const current = page.url();
      if (current && current.startsWith('http')) {
        cookieUrl = new URL(current).origin;
      }
    } catch {
      /* keep default origin */
    }

    await page.context().addCookies([
      {
        name: 'admin_tenant_context',
        value: encodeURIComponent(JSON.stringify(contextPayload)),
        url: cookieUrl,
        httpOnly: true,
        sameSite: 'Lax',
      },
    ]);

    try {
      await page.waitForLoadState('domcontentloaded', { timeout: 5000 });
      await page.evaluate((creds) => {
        localStorage.setItem('admin_tenant_context', JSON.stringify(creds));
      }, contextPayload);
    } catch {
      await this.safeGoto(page, '/login');
      await page.evaluate((creds) => {
        localStorage.setItem('admin_tenant_context', JSON.stringify(creds));
      }, contextPayload);
    }

    return tenantId;
  }

  static async loginAsAdmin(
    page: Page,
    email = process.env.ADMIN_EMAIL || 'admin@inoyu.local',
    password = process.env.ADMIN_PASSWORD || 'admin'
  ): Promise<void> {
    await this.safeGoto(page, '/login');
    await this.waitForLoginOptions(page);

    const emailInput = page.getByTestId('login-email').or(page.getByLabel(/email address/i));
    const passwordInput = page.getByTestId('login-password').or(page.getByLabel(/password/i));
    const adminRadio = page.getByTestId('login-type-admin');
    const submitButton = page.getByTestId('login-submit').or(page.getByRole('button', { name: /sign in/i }));

    await emailInput.fill(email);
    await passwordInput.fill(password);
    if (await adminRadio.count()) {
      await adminRadio.click();
    }
    await submitButton.click();

    await page.waitForURL(
      (url) => {
        const path = url.pathname;
        return path === '/' || path === '/tenants';
      },
      { timeout: 15000 }
    );
    await page.waitForLoadState('domcontentloaded');

    await this.ensureActiveTenant(page);
    await this.safeGoto(page, '/');
    const dashboard = page.locator('[data-testid="dashboard"]');
    await dashboard.waitFor({ state: 'visible', timeout: 15000 });
  }

  static async logout(page: Page): Promise<void> {
    const logoutButton = page
      .locator('[data-testid="logout-button"]')
      .or(page.getByRole('button', { name: /logout|sign out/i }))
      .or(page.locator('a:has-text("Logout"), a:has-text("Sign out")'))
      .first();

    if (await logoutButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await logoutButton.click();
      await page.waitForURL('/login', { timeout: 15000, waitUntil: 'domcontentloaded' });
    } else {
      await this.safeGoto(page, '/api/auth/logout');
      await page.waitForURL('/login', { timeout: 15000, waitUntil: 'domcontentloaded' });
    }
  }

  static async isAuthenticated(page: Page): Promise<boolean> {
    try {
      const response = await page.request.get('/api/auth/user');
      return response.ok();
    } catch {
      return false;
    }
  }
}

export class DataHelpers {
  static async ensureLiveProfile(
    page: Page,
    overrides: { itemId?: string; properties?: Record<string, string> } = {}
  ): Promise<string> {
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await this.createAndAwaitLiveProfile(page, overrides);
      } catch (err) {
        lastError = err;
        const msg = err instanceof Error ? err.message : String(err);
        if (!/\(401\)|Unauthorized/i.test(msg) || attempt === maxAttempts) {
          throw err;
        }
        await AuthHelpers.loginAsAdmin(page);
      }
    }
    throw lastError;
  }

  private static async createAndAwaitLiveProfile(
    page: Page,
    overrides: { itemId?: string; properties?: Record<string, string> } = {}
  ): Promise<string> {
    const configRes = await page.request.get('/api/config/tenant');
    if (!configRes.ok()) {
      throw new Error(`Cannot seed live profile: tenant config ${configRes.status()}`);
    }
    const config = (await configRes.json()) as { supportsTenants?: boolean };

    let tenantId: string | undefined;
    let unomiHeaders: { Authorization: string; 'Content-Type': string; Accept: string };

    if (config.supportsTenants) {
      tenantId = (await AuthHelpers.ensureActiveTenant(page)) || undefined;
      if (!tenantId) {
        throw new Error('Cannot seed live profile: no active tenant');
      }

      const loginAsRes = await page.request.post(
        `/api/tenants/${encodeURIComponent(tenantId)}/login-as`
      );
      if (!loginAsRes.ok()) {
        const body = await loginAsRes.text();
        throw new Error(`login-as failed before profile seed (${loginAsRes.status()}): ${body}`);
      }
      const creds = (await loginAsRes.json()) as {
        tenantId: string;
        privateApiKey: string;
        publicApiKey: string;
        name?: string;
      };
      if (!creds.privateApiKey) {
        throw new Error('login-as response missing privateApiKey');
      }

      const contextPayload = {
        tenantId: creds.tenantId,
        publicApiKey: creds.publicApiKey,
        privateApiKey: creds.privateApiKey,
        name: creds.name,
        switchedAt: new Date().toISOString(),
      };
      const origin = 'http://localhost:3131';
      let cookieUrl = origin;
      try {
        const current = page.url();
        if (current && current.startsWith('http')) {
          cookieUrl = new URL(current).origin;
        }
      } catch {
        /* keep default */
      }
      await page.context().addCookies([
        {
          name: 'admin_tenant_context',
          value: encodeURIComponent(JSON.stringify(contextPayload)),
          url: cookieUrl,
          httpOnly: true,
          sameSite: 'Lax',
        },
      ]);

      tenantId = creds.tenantId;
      unomiHeaders = {
        Authorization: `Basic ${Buffer.from(`${creds.tenantId}:${creds.privateApiKey}`).toString('base64')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
    } else {
      const user = process.env.UNOMI_USER || 'karaf';
      const password = process.env.UNOMI_PASSWORD || 'karaf';
      unomiHeaders = {
        Authorization: `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      };
    }

    const itemId =
      overrides.itemId || `e2e-live-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
    const properties = {
      firstName: 'E2E',
      lastName: 'Profile',
      email: `${itemId}@example.com`,
      e2eTouchedAt: new Date().toISOString(),
      ...(overrides.properties || {}),
    };
    const payload = {
      itemId,
      itemType: 'profile',
      properties,
      ...(tenantId ? { tenantId } : {}),
    };

    const unomiUrl = (process.env.UNOMI_URL || 'http://localhost:8181').replace(/\/$/, '');

    let createdBody: { itemId?: string } | null = null;
    let lastStatus = 0;
    let lastText = '';
    for (const path of ['/cxs/profiles/', '/cxs/profiles']) {
      const res = await fetch(`${unomiUrl}${path}`, {
        method: 'POST',
        headers: unomiHeaders,
        body: JSON.stringify(payload),
      });
      lastStatus = res.status;
      lastText = await res.text();
      if (res.ok) {
        try {
          createdBody = JSON.parse(lastText) as { itemId?: string };
        } catch {
          createdBody = {};
        }
        break;
      }
    }
    if (!createdBody) {
      throw new Error(`Failed to create live E2E profile (${lastStatus}): ${lastText}`);
    }
    const id =
      createdBody.itemId && createdBody.itemId !== 'null' ? createdBody.itemId : itemId;

    const getRes = await fetch(`${unomiUrl}/cxs/profiles/${encodeURIComponent(id)}`, {
      headers: unomiHeaders,
    });
    if (!getRes.ok) {
      const body = await getRes.text();
      throw new Error(`Created profile ${id} but GET failed (${getRes.status}): ${body}`);
    }

    const deadline = Date.now() + 30000;
    while (Date.now() < deadline) {
      const searchRes = await fetch(`${unomiUrl}/cxs/profiles/search`, {
        method: 'POST',
        headers: unomiHeaders,
        body: JSON.stringify({
          condition: {
            type: 'idsCondition',
            parameterValues: { ids: [id], match: true },
          },
          offset: 0,
          limit: 1,
        }),
      });
      if (searchRes.ok) {
        const body = (await searchRes.json()) as {
          list?: Array<{ itemId?: string }>;
          totalSize?: number;
        };
        if ((body.list || []).some((p) => p.itemId === id) || (body.totalSize ?? 0) > 0) {
          return id;
        }
      }
      await new Promise((r) => setTimeout(r, 400));
    }
    throw new Error(`Created profile ${id} but it did not appear in profiles/search within 30s`);
  }
}
