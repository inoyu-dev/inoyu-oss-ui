/**
 * Feature Flags Configuration
 * Controls which features are available based on deployment type.
 *
 * Controls which features are available based on deployment type.
 */

export interface FeatureFlags {
  // Advanced/Development Features
  groovyActions: boolean; // Hide in multi-tenant
  actionTypeDeployment: boolean; // Hide in multi-tenant (read-only allowed)
  conditionTypeDeployment: boolean; // Hide in multi-tenant (read-only allowed)
  advancedSettings: boolean; // System-level settings
  tenantAdmin: boolean; // Tenant management UI (/tenants) — on-prem only
}

export type DeploymentType = 'multi-tenant' | 'on-premise' | 'hybrid';

export interface DeploymentConfig {
  type: DeploymentType;
  features: FeatureFlags;
}

/**
 * Default feature flags for multi-tenant (restricted)
 */
export const defaultMultiTenantFlags: FeatureFlags = {
  groovyActions: false,
  actionTypeDeployment: false, // Read-only allowed
  conditionTypeDeployment: false, // Read-only allowed
  advancedSettings: false,
  tenantAdmin: false,
};

/**
 * Default feature flags for on-premise (full access)
 */
export const defaultOnPremiseFlags: FeatureFlags = {
  groovyActions: true,
  actionTypeDeployment: true,
  conditionTypeDeployment: true,
  advancedSettings: true,
  tenantAdmin: true,
};

/**
 * Get default feature flags based on deployment type
 */
export function getDefaultFeatureFlags(deploymentType: DeploymentType = 'multi-tenant'): FeatureFlags {
  if (deploymentType === 'on-premise') {
    return { ...defaultOnPremiseFlags };
  }
  return { ...defaultMultiTenantFlags };
}

/**
 * Merge environment variable overrides with defaults
 */
export function mergeFeatureFlags(
  deploymentType: DeploymentType,
  envOverrides?: Partial<FeatureFlags>
): FeatureFlags {
  const defaults = getDefaultFeatureFlags(deploymentType);

  if (!envOverrides) {
    return defaults;
  }

  return {
    ...defaults,
    ...envOverrides,
  };
}
