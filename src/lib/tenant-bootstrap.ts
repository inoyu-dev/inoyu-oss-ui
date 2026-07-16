import axios from 'axios';
import { getUnomiConfig, supportsTenants } from '@/lib/unomi-config';
import { isTenantAdminEnabled, isTenantAdminUiEnabled } from '@/lib/tenant-admin';

/**
 * True when Unomi has at least one tenant (tenant-user login is allowed).
 * On first bootstrap with zero tenants, only the system admin may sign in.
 */
export async function hasAnyTenants(): Promise<boolean> {
  if (!supportsTenants()) {
    return false;
  }

  try {
    const config = getUnomiConfig();
    const response = await axios.get(`${config.baseUrl}/cxs/tenants`, {
      auth: {
        username: config.systemUser,
        password: config.systemPassword,
      },
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });

    return Array.isArray(response.data) && response.data.length > 0;
  } catch (error) {
    console.error('Error checking for existing tenants:', error);
    return false;
  }
}

export type TenantUiCapabilities = {
  /** Unomi >= 3.1 */
  supportsTenants: boolean;
  /** Deployment allows tenant admin (on-prem), ignoring Unomi version */
  deploymentTenantAdmin: boolean;
  /** Show /tenants, switcher, banners (supportsTenants && deploymentTenantAdmin) */
  showTenantAdminUi: boolean;
  /** Tenant-user login form is allowed when tenants already exist */
  allowTenantLogin: boolean;
  /** Only system admin may sign in (no tenants yet, or tenants unsupported) */
  systemAdminOnly: boolean;
};

/**
 * Resolved UI/auth capabilities for the Unomi version × deployment matrix.
 * `tenantsExist` is the result of listing Unomi tenants (or false when unsupported).
 */
export function getTenantUiCapabilities(tenantsExist: boolean): TenantUiCapabilities {
  const tenantsSupported = supportsTenants();
  const deploymentTenantAdmin = isTenantAdminEnabled();
  const showTenantAdminUi = isTenantAdminUiEnabled();
  const allowTenantLogin = tenantsSupported && tenantsExist;

  return {
    supportsTenants: tenantsSupported,
    deploymentTenantAdmin,
    showTenantAdminUi,
    allowTenantLogin,
    systemAdminOnly: !allowTenantLogin,
  };
}
