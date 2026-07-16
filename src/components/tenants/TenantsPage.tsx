import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import {
  Users,
  Plus,
  Trash2,
  Key,
  LogIn,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Eye,
  EyeOff,
  Download,
} from 'lucide-react';
import Layout from '@/components/layout/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import { tenantService, Tenant, TenantRequest, TenantKeys } from '@/services/client/TenantService';

const TENANT_KEYS_VAULT = 'tenant_api_keys_vault';

type TenantKeysVault = Record<
  string,
  { publicApiKey: string; privateApiKey: string; savedAt: string }
>;

function readKeysVault(): TenantKeysVault {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const raw = localStorage.getItem(TENANT_KEYS_VAULT);
    return raw ? (JSON.parse(raw) as TenantKeysVault) : {};
  } catch {
    return {};
  }
}

function writeKeysVaultEntry(tenantId: string, keys: TenantKeys): void {
  if (typeof window === 'undefined') {
    return;
  }
  const vault = readKeysVault();
  vault[tenantId] = {
    publicApiKey: keys.publicApiKey,
    privateApiKey: keys.privateApiKey,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(TENANT_KEYS_VAULT, JSON.stringify(vault));
}

function downloadKeysFile(tenantId: string, keys: TenantKeys): void {
  const contents = [
    `# Unomi tenant API keys for ${tenantId}`,
    `# Generated ${new Date().toISOString()}`,
    `UNOMI_TENANT_ID=${tenantId}`,
    `UNOMI_PUBLIC_API_KEY=${keys.publicApiKey}`,
    `UNOMI_PRIVATE_API_KEY=${keys.privateApiKey}`,
    '',
  ].join('\n');
  const blob = new Blob([contents], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${tenantId}-api-keys.env`;
  anchor.click();
  URL.revokeObjectURL(url);
}

const TenantsPage: NextPage = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ tenant: Tenant } | null>(null);
  const [showKeysModal, setShowKeysModal] = useState<{
    tenant: Tenant;
    keys: TenantKeys;
    saved: boolean;
  } | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState<Record<string, boolean>>({});
  const [savedKeyTenantIds, setSavedKeyTenantIds] = useState<Set<string>>(new Set());
  const [newTenant, setNewTenant] = useState<TenantRequest>({
    requestedId: '',
    name: '',
  });
  const [processing, setProcessing] = useState(false);
  const [inTenantContext, setInTenantContext] = useState(false);

  useEffect(() => {
    void loadTenants();
    if (typeof window !== 'undefined') {
      setInTenantContext(localStorage.getItem('admin_tenant_context') !== null);
      setSavedKeyTenantIds(new Set(Object.keys(readKeysVault())));
    }
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantService.listTenants();
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async () => {
    if (!newTenant.requestedId.trim()) {
      setError('Tenant ID is required');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      await tenantService.createTenant(newTenant);
      setSuccess('Tenant created successfully');
      setShowCreateModal(false);
      setNewTenant({ requestedId: '', name: '' });
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create tenant');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    try {
      setProcessing(true);
      setError(null);
      await tenantService.deleteTenant(tenant.tenantId);
      setSuccess('Tenant deleted successfully');
      setShowDeleteModal(null);
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete tenant');
    } finally {
      setProcessing(false);
    }
  };

  const handleGenerateKeys = async (tenant: Tenant) => {
    try {
      setProcessing(true);
      setError(null);
      const keys = await tenantService.generateApiKeys(tenant.tenantId);
      writeKeysVaultEntry(tenant.tenantId, keys);
      setSavedKeyTenantIds((prev) => new Set(prev).add(tenant.tenantId));
      setShowKeysModal({ tenant, keys, saved: keys.saved !== false });
      setSuccess(`API keys generated and saved for ${tenant.tenantId}`);
      await loadTenants();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate API keys');
    } finally {
      setProcessing(false);
    }
  };

  const handleViewSavedKeys = (tenant: Tenant) => {
    const saved = readKeysVault()[tenant.tenantId];
    if (!saved) {
      setError('No saved keys for this tenant. Generate new keys first.');
      return;
    }
    setShowKeysModal({
      tenant,
      keys: {
        publicApiKey: saved.publicApiKey,
        privateApiKey: saved.privateApiKey,
      },
      saved: true,
    });
  };

  const handleLoginAs = async (tenant: Tenant) => {
    try {
      setProcessing(true);
      setError(null);
      const credentials = await tenantService.loginAsTenant(tenant.tenantId);

      if (typeof window !== 'undefined') {
        localStorage.setItem(
          'admin_tenant_context',
          JSON.stringify({
            tenantId: credentials.tenantId,
            publicApiKey: credentials.publicApiKey,
            privateApiKey: credentials.privateApiKey,
            name: credentials.name,
            switchedAt: new Date().toISOString(),
          })
        );
        setInTenantContext(true);
      }

      setSuccess(`Switched to tenant: ${credentials.name || credentials.tenantId}`);

      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to switch tenant context');
    } finally {
      setProcessing(false);
    }
  };

  const handleExitAdminMode = async () => {
    try {
      await fetch('/api/tenants/exit-context', { method: 'POST' });
    } catch (err) {
      console.error('Failed to clear tenant context cookie:', err);
    }

    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_tenant_context');
      setInTenantContext(false);
    }
    setSuccess('Exited tenant context, returning to admin mode');
    setTimeout(() => {
      window.location.href = '/';
    }, 1000);
  };

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const checkTenantContext = () => {
        setInTenantContext(localStorage.getItem('admin_tenant_context') !== null);
      };

      checkTenantContext();
      window.addEventListener('storage', checkTenantContext);

      return () => {
        window.removeEventListener('storage', checkTenantContext);
      };
    }
  }, []);

  return (
    <ProtectedRoute>
      <ProtectedAdminRoute>
        <Layout>
          <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Users className="h-8 w-8" />
                  Tenant Management
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Manage tenants and switch between tenant contexts
                </p>
              </div>
              <div className="flex gap-2">
                {inTenantContext && (
                  <button
                    type="button"
                    onClick={() => void handleExitAdminMode()}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    Exit Tenant Context
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Create Tenant
                </button>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800 dark:text-red-200">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-green-800 dark:text-green-200">{success}</span>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Tenant ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Has API Keys
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {tenants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          No tenants found
                        </td>
                      </tr>
                    ) : (
                      tenants.map((tenant) => (
                        <tr key={tenant.tenantId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                            {tenant.tenantId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {tenant.name || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-2">
                              {(tenant.publicApiKey && tenant.privateApiKey) ||
                              (tenant.apiKeys?.some((key) => key.type === 'PUBLIC' && !key.revoked) &&
                                tenant.apiKeys.some(
                                  (key) => key.type === 'PRIVATE' && !key.revoked
                                )) ? (
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                              ) : (
                                <XCircle className="h-5 w-5 text-gray-400" />
                              )}
                              {savedKeyTenantIds.has(tenant.tenantId) && (
                                <span className="text-xs text-green-700 dark:text-green-300">
                                  Saved locally
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => void handleLoginAs(tenant)}
                                disabled={processing}
                                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                                title="Login as this tenant"
                              >
                                <LogIn className="h-4 w-4" />
                                <span className="hidden lg:inline">Login as</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleGenerateKeys(tenant)}
                                disabled={processing}
                                className="text-purple-600 hover:text-purple-900 dark:text-purple-400 dark:hover:text-purple-300 flex items-center gap-1"
                                title="Generate and save new API keys"
                              >
                                <Key className="h-4 w-4" />
                                <span className="hidden lg:inline">Generate keys</span>
                              </button>
                              {savedKeyTenantIds.has(tenant.tenantId) && (
                                <button
                                  type="button"
                                  onClick={() => handleViewSavedKeys(tenant)}
                                  disabled={processing}
                                  className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                                  title="View saved API keys"
                                >
                                  <Eye className="h-4 w-4" />
                                  <span className="hidden lg:inline">View keys</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => setShowDeleteModal({ tenant })}
                                disabled={processing}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                                title="Delete tenant"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {showCreateModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Create New Tenant</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tenant ID *
                      </label>
                      <input
                        type="text"
                        value={newTenant.requestedId}
                        onChange={(e) => setNewTenant({ ...newTenant, requestedId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., acme-corp"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Name (optional)
                      </label>
                      <input
                        type="text"
                        value={newTenant.name || ''}
                        onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white"
                        placeholder="e.g., Acme Corporation"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowCreateModal(false);
                        setNewTenant({ requestedId: '', name: '' });
                      }}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleCreateTenant()}
                      disabled={processing || !newTenant.requestedId.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showDeleteModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Delete Tenant</h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Are you sure you want to delete tenant <strong>{showDeleteModal.tenant.tenantId}</strong>?
                    This action cannot be undone and will delete all tenant data.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(null)}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTenant(showDeleteModal.tenant)}
                      disabled={processing}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {showKeysModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    API Keys for {showKeysModal.tenant.tenantId}
                  </h2>
                  {showKeysModal.saved && (
                    <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-800 dark:text-green-200">
                      Keys are saved for login-as on this server (7 days) and in this browser.
                    </div>
                  )}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Public API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={showKeysModal.keys.publicApiKey}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            void navigator.clipboard.writeText(showKeysModal.keys.publicApiKey)
                          }
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Private API Key
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type={showPrivateKey[showKeysModal.tenant.tenantId] ? 'text' : 'password'}
                          value={showKeysModal.keys.privateApiKey}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 dark:text-white font-mono text-sm"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowPrivateKey({
                              ...showPrivateKey,
                              [showKeysModal.tenant.tenantId]:
                                !showPrivateKey[showKeysModal.tenant.tenantId],
                            })
                          }
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                        >
                          {showPrivateKey[showKeysModal.tenant.tenantId] ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            void navigator.clipboard.writeText(showKeysModal.keys.privateApiKey)
                          }
                          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Warning:</strong> Download or copy these keys now. Unomi only returns
                      masked keys on later reads.
                    </p>
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    <button
                      type="button"
                      onClick={() =>
                        downloadKeysFile(showKeysModal.tenant.tenantId, showKeysModal.keys)
                      }
                      className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download .env
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowKeysModal(null)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Layout>
      </ProtectedAdminRoute>
    </ProtectedRoute>
  );
};

export default TenantsPage;
