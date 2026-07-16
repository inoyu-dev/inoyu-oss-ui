import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'next-i18next/pages';
import { Building2, Check, ChevronDown, LogOut, Settings2 } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useAdmin } from '@/hooks/useAdmin';

interface TenantListItem {
  tenantId: string;
  name?: string;
}

interface ActiveTenantInfo {
  tenantId: string;
  name?: string;
  source: 'context' | 'default' | 'session';
}

interface LoginAsResponse {
  tenantId: string;
  publicApiKey: string;
  privateApiKey: string;
  name?: string;
}

interface TenantSwitcherProps {
  isCollapsed: boolean;
}

/**
 * Sidebar tenant switcher for Unomi 3.1+ on-prem (managed multi-tenant) admins only.
 * Hidden for SaaS and Unomi &lt; 3.1 (featureFlags.tenantAdmin already encodes that).
 */
const TenantSwitcher: React.FC<TenantSwitcherProps> = ({ isCollapsed }) => {
  const { t } = useTranslation('common');
  const { featureFlags, isLoading: flagsLoading } = useFeatureFlags();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const [open, setOpen] = useState(false);
  const [tenants, setTenants] = useState<TenantListItem[]>([]);
  const [activeTenant, setActiveTenant] = useState<ActiveTenantInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [switching, setSwitching] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const configRes = await fetch('/api/config/tenant');
      if (configRes.ok) {
        const config = await configRes.json();
        if (config.activeTenant) {
          setActiveTenant(config.activeTenant);
        } else if (config.tenantId) {
          setActiveTenant({ tenantId: config.tenantId, source: 'default' });
        } else {
          setActiveTenant(null);
        }
      }

      const listRes = await fetch('/api/tenants');
      if (listRes.ok) {
        const list = (await listRes.json()) as TenantListItem[];
        setTenants(Array.isArray(list) ? list : []);
      } else {
        setTenants([]);
      }
    } catch {
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!flagsLoading && featureFlags.tenantAdmin && isAdmin) {
      void load();
    }
  }, [flagsLoading, featureFlags.tenantAdmin, isAdmin, load]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const handleSwitch = async (tenant: TenantListItem) => {
    try {
      setSwitching(true);
      const res = await fetch(`/api/tenants/${encodeURIComponent(tenant.tenantId)}/login-as`, {
        method: 'POST',
      });
      if (!res.ok) {
        throw new Error('Failed to switch tenant');
      }
      const credentials = (await res.json()) as LoginAsResponse;
      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'admin_tenant_context',
          JSON.stringify({
            tenantId: credentials.tenantId,
            publicApiKey: credentials.publicApiKey,
            privateApiKey: credentials.privateApiKey,
            name: credentials.name || tenant.name,
            switchedAt: new Date().toISOString(),
          })
        );
      }
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to switch tenant', error);
      setSwitching(false);
    }
  };

  const handleExit = async () => {
    try {
      setSwitching(true);
      await fetch('/api/tenants/exit-context', { method: 'POST' });
      if (typeof window !== 'undefined') {
        localStorage.removeItem('admin_tenant_context');
      }
      window.location.href = '/tenants';
    } catch (error) {
      console.error('Failed to exit tenant context', error);
      setSwitching(false);
    }
  };

  if (flagsLoading || adminLoading || !featureFlags.tenantAdmin || !isAdmin) {
    return null;
  }

  const label = activeTenant?.name || activeTenant?.tenantId || t('No tenant');
  const inContext = activeTenant?.source === 'context';

  if (isCollapsed) {
    return (
      <div className="px-2 pb-2" title={label}>
        <Link
          href="/tenants"
          className="flex h-9 w-full items-center justify-center rounded-lg border border-sidebar-border bg-sidebar-icon-bg text-sidebar-text hover:bg-sidebar-icon-bg-hover"
          aria-label={t('Manage tenants')}
        >
          <Building2 className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="relative border-t border-sidebar-border px-2 py-2" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        disabled={switching}
        className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-icon-bg px-2.5 py-2 text-left text-sm text-sidebar-text hover:bg-sidebar-icon-bg-hover disabled:opacity-50"
        data-testid="tenant-switcher"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Building2 className="h-4 w-4 shrink-0" />
        <span className="min-w-0 flex-1 truncate font-medium">{label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-2 right-2 z-50 mb-1 max-h-64 overflow-y-auto rounded-lg border border-sidebar-border bg-white shadow-lg dark:bg-gray-900"
          role="listbox"
        >
          {loading ? (
            <div className="px-3 py-2 text-xs text-gray-500">{t('Loading...')}</div>
          ) : tenants.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-500">{t('No tenants yet')}</div>
          ) : (
            tenants.map(tenant => {
              const selected = activeTenant?.tenantId === tenant.tenantId;
              return (
                <button
                  key={tenant.tenantId}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={switching}
                  onClick={() => void handleSwitch(tenant)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  <span className="min-w-0 flex-1 truncate">{tenant.name || tenant.tenantId}</span>
                  {selected && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                </button>
              );
            })
          )}
          <div className="border-t border-gray-200 dark:border-gray-700">
            <Link
              href="/tenants"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
              onClick={() => setOpen(false)}
            >
              <Settings2 className="h-4 w-4" />
              {t('Manage tenants')}
            </Link>
            {inContext && (
              <button
                type="button"
                disabled={switching}
                onClick={() => void handleExit()}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                {t('Exit tenant context')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantSwitcher;
