/** Unomi system / shared tenants that must not be used as a SaaS data-plane scope. */
const PLACEHOLDER_TENANT_IDS = new Set(['default', 'system', 'systemscope']);

export function isPlaceholderTenantId(tenantId: string | undefined | null): boolean {
  if (!tenantId || !tenantId.trim()) {
    return true;
  }
  return PLACEHOLDER_TENANT_IDS.has(tenantId.trim().toLowerCase());
}
