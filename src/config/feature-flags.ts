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
export function getDefaultFeatureFlags(deploymentType: DeploymentType = 'on-premise'): FeatureFlags {
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

/**
 * Parse an optional boolean env override.
 * Unset → undefined (keep deployment default).
 * "true" / "false" → explicit override.
 */
export function parseFeatureFlagEnv(value: string | undefined): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

/**
 * Build env overrides from process.env, omitting unset flags so deployment
 * defaults (e.g. groovyActions=true on-prem) are preserved.
 */
export function buildFeatureFlagEnvOverrides(
  env: Record<string, string | undefined> = process.env
): Partial<FeatureFlags> {
  const overrides: Partial<FeatureFlags> = {};

  const groovyActions = parseFeatureFlagEnv(env.FEATURE_GROOVY_ACTIONS);
  if (groovyActions !== undefined) {
    overrides.groovyActions = groovyActions;
  }

  const actionTypeDeployment = parseFeatureFlagEnv(env.FEATURE_ACTION_TYPE_DEPLOYMENT);
  if (actionTypeDeployment !== undefined) {
    overrides.actionTypeDeployment = actionTypeDeployment;
  }

  const conditionTypeDeployment = parseFeatureFlagEnv(env.FEATURE_CONDITION_TYPE_DEPLOYMENT);
  if (conditionTypeDeployment !== undefined) {
    overrides.conditionTypeDeployment = conditionTypeDeployment;
  }

  const advancedSettings = parseFeatureFlagEnv(env.FEATURE_ADVANCED_SETTINGS);
  if (advancedSettings !== undefined) {
    overrides.advancedSettings = advancedSettings;
  }

  return overrides;
}
