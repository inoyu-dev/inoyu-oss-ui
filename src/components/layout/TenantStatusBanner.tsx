import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';

interface TenantStatus {
  tenantId: string | null;
  version: string;
  isV3: boolean;
  hasCredentials: boolean;
  tenantAvailable: boolean;
  tenantExists?: boolean; // Whether the tenant actually exists in Unomi
  error?: string;
}

const TenantStatusBanner: React.FC = () => {
  const { t } = useTranslation('common');
  const [tenantStatus, setTenantStatus] = useState<TenantStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch tenant status
    fetch('/api/config/tenant')
      .then(res => res.json())
      .then(data => {
        const isV3 = data.isV3 || false;
        const tenantId = data.tenantId;
        const tenantExists = data.tenantExists !== false; // Default to true if not specified
        const hasCredentials = data.hasCredentials || false;
        const tenantAvailable = data.tenantAvailable !== false;
        
        // Determine error message based on specific issue
        let error: string | undefined;
        if (isV3 && !tenantAvailable) {
          if (!tenantId) {
            error = t('Tenant is not configured. Please set UNOMI_TENANT_ID.');
          } else if (!tenantExists) {
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
          isV3,
          hasCredentials,
          tenantAvailable,
          tenantExists,
          error
        });
        setLoading(false);
      })
      .catch(() => {
        // On error, assume V2 (no tenant required) to avoid showing error banner
        setTenantStatus({
          tenantId: null,
          version: 'unknown',
          isV3: false,
          hasCredentials: false,
          tenantAvailable: true, // Default to available to avoid showing error
          error: undefined
        });
        setLoading(false);
      });
  }, []);

  // Don't show anything while loading
  if (loading) {
    return null;
  }

  // Don't show banner for V2 (tenants don't exist in V2)
  if (!tenantStatus || !tenantStatus.isV3) {
    return null;
  }

  // Only show banner if tenant is not available (V3 only)
  if (tenantStatus.tenantAvailable) {
    return null;
  }

  // Use the error message from the API response
  const errorMessage = tenantStatus.error || t('Tenant is not available');

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
            {errorMessage}
          </p>
          <p className="mt-1 text-sm text-destructive">
            {t('Some features may not work correctly. Please check your Unomi V3 configuration.')}
            {tenantStatus.isV3 && tenantStatus.tenantId && (
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
