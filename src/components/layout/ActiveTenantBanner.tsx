import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { Building2, LogOut, Settings2 } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useAdmin } from '@/hooks/useAdmin';

interface ActiveTenantInfo {
  tenantId: string;
  name?: string;
  source: 'context' | 'default' | 'session';
}

interface TenantConfigResponse {
  tenantId: string | null;
  supportsTenants?: boolean;
  tenantAdminEnabled?: boolean;
  activeTenant?: ActiveTenantInfo | null;
}

const ActiveTenantBanner: React.FC = () => {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { featureFlags, isLoading: flagsLoading } = useFeatureFlags();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [activeTenant, setActiveTenant] = useState<ActiveTenantInfo | null>(null);
  const [supportsTenants, setSupportsTenants] = useState(false);
  const [tenantAdminEnabled, setTenantAdminEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [exiting, setExiting] = useState(false);
  const redirectedRef = useRef(false);

  const loadActiveTenant = useCallback(async () => {
    try {
      const res = await fetch('/api/config/tenant');
      if (!res.ok) {
        setLoaded(true);
        return;
      }
      const data = (await res.json()) as TenantConfigResponse;
      setSupportsTenants(data.supportsTenants === true);
      setTenantAdminEnabled(data.tenantAdminEnabled === true);

      if (data.activeTenant) {
        setActiveTenant(data.activeTenant);
      } else if (data.tenantId) {
        setActiveTenant({ tenantId: data.tenantId, source: 'default' });
      } else {
        setActiveTenant(null);
      }
    } catch {
      // ignore
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!flagsLoading && featureFlags.tenantAdmin) {
      void loadActiveTenant();
    } else if (!flagsLoading) {
      setLoaded(true);
    }
  }, [featureFlags.tenantAdmin, flagsLoading, loadActiveTenant]);

  // On-prem 3.1+: redirect admins with no tenant to /tenants (once)
  useEffect(() => {
    if (!loaded || flagsLoading || adminLoading || redirectedRef.current) {
      return;
    }
    if (!supportsTenants || !tenantAdminEnabled || !featureFlags.tenantAdmin || !isAdmin) {
      return;
    }
    if (activeTenant?.tenantId) {
      return;
    }
    const path = router.pathname;
    if (path === '/tenants' || path === '/login') {
      return;
    }
    redirectedRef.current = true;
    void router.replace('/tenants');
  }, [
    loaded,
    flagsLoading,
    adminLoading,
    supportsTenants,
    tenantAdminEnabled,
    featureFlags.tenantAdmin,
    isAdmin,
    activeTenant,
    router,
  ]);

  const handleExitContext = async () => {
    try {
      setExiting(true);
      await fetch('/api/tenants/exit-context', { method: 'POST' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_tenant_context');
      }
      window.location.href = '/tenants';
    } catch (error) {
      console.error('Failed to exit tenant context', error);
    } finally {
      setExiting(false);
    }
  };

  if (flagsLoading || adminLoading || !featureFlags.tenantAdmin || !isAdmin) {
    return null;
  }

  if (!supportsTenants || !tenantAdminEnabled) {
    return null;
  }

  if (!activeTenant?.tenantId) {
    return (
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/30">
        <div className="flex items-center gap-2 text-sm text-amber-900 dark:text-amber-100">
          <Building2 className="h-4 w-4 shrink-0" />
          <span>{t('No active tenant selected. Choose a tenant to manage CDP data.')}</span>
        </div>
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          <Settings2 className="h-4 w-4" />
          {t('Manage tenants')}
        </Link>
      </div>
    );
  }

  const label = activeTenant.name || activeTenant.tenantId;
  const inContext = activeTenant.source === 'context';

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-950/30">
      <div className="flex items-center gap-2 text-sm text-blue-900 dark:text-blue-100">
        <Building2 className="h-4 w-4 shrink-0" />
        <span>
          {inContext ? t('Active tenant') : t('Default tenant')}:{' '}
          <code className="rounded bg-blue-100 px-1.5 py-0.5 text-xs dark:bg-blue-900">{label}</code>
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/tenants"
          className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-800 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950 dark:text-blue-100 dark:hover:bg-blue-900"
        >
          <Settings2 className="h-4 w-4" />
          {t('Switch tenant')}
        </Link>
        {inContext && (
          <button
            type="button"
            onClick={() => void handleExitContext()}
            disabled={exiting}
            className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <LogOut className="h-4 w-4" />
            {t('Exit tenant context')}
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveTenantBanner;
