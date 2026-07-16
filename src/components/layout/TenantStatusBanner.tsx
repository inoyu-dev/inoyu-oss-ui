import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';

interface TenantStatus {
  tenantId: string | null;
  version: string;
  isV3: boolean;
  supportsTenants: boolean;
  tenantAdminEnabled: boolean;
  hasCredentials: boolean;
  tenantAvailable: boolean;
  tenantExists?: boolean;
  error?: string;
}

/**
 * Destructive banner for on-prem Unomi 3.1+ when a configured tenant is broken.
 * Hidden for Unomi &lt; 3.1, SaaS (JWT), and on-prem setup (no tenant yet — ActiveTenantBanner handles that).
 */
const TenantStatusBanner: React.FC = () => {
  const { t } = useTranslation('common');
  const [tenantStatus, setTenantStatus] = useState<TenantStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch('/api/config/tenant')
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) {
          return;
        }
        const supportsTenantsFlag = data.supportsTenants === true;
        const tenantAdminEnabled = data.tenantAdminEnabled === true;
        const tenantId = data.tenantId as string | null;
        const tenantExists = data.tenantExists !== false;
        const hasCredentials = data.hasCredentials || false;
        const tenantAvailable = data.tenantAvailable !== false;

        let error: string | undefined;

        // Only surface misconfiguration for on-prem when a tenant id is set but invalid
        if (supportsTenantsFlag && tenantAdminEnabled && tenantId && !tenantAvailable) {
          if (!tenantExists) {
            error = t('Tenant does not exist in Unomi', { tenantId });
          } else if (!hasCredentials) {
            error = t('Tenant credentials are missing', { tenantId });
          } else {
            error = t('Tenant is not available');
          }
        }

        setTenantStatus({
          tenantId,
          version: data.version,
          isV3: data.isV3 || false,
          supportsTenants: supportsTenantsFlag,
          tenantAdminEnabled,
          hasCredentials,
          tenantAvailable,
          tenantExists,
          error,
        });
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setTenantStatus({
          tenantId: null,
          version: 'unknown',
          isV3: false,
          supportsTenants: false,
          tenantAdminEnabled: false,
          hasCredentials: false,
          tenantAvailable: true,
          error: undefined,
        });
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // Fetch once on mount; `t` is intentionally omitted (unstable identity from i18n).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading || !tenantStatus) {
    return null;
  }

  // Pre-3.1 and SaaS: no tenant status banner
  if (!tenantStatus.supportsTenants || !tenantStatus.tenantAdminEnabled) {
    return null;
  }

  if (!tenantStatus.error) {
    return null;
  }

  return (
    <div className="bg-destructive-lighter border-l-4 border-destructive p-4 mb-4">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-destructive"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-destructive-dark font-medium">
            {tenantStatus.error}
          </p>
          <p className="mt-1 text-sm text-destructive">
            {t('Some features may not work correctly. Please check your Unomi V3 configuration.')}
            {tenantStatus.tenantId && (
              <span className="block mt-1">
                {t('Configured tenant')}: <code className="bg-destructive-light px-1 rounded">{tenantStatus.tenantId}</code>
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TenantStatusBanner;
