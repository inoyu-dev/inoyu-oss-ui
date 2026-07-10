/**
 * API endpoint for feature flags configuration
 * Returns feature flags based on deployment type and environment variables
 */

import type { NextApiResponse } from 'next';
import { createHandler } from '@/lib/api-middleware';
import { DeploymentType, type FeatureFlags, mergeFeatureFlags } from '@/config/feature-flags';
import { isTenantAdminEnabled } from '@/lib/tenant-admin';

export default createHandler({
  methods: ['GET'],
  handler: async (_req, res: NextApiResponse) => {
    const deploymentType = (process.env.DEPLOYMENT_TYPE || 'multi-tenant') as DeploymentType;

    const envOverrides: Partial<FeatureFlags> = {
      groovyActions: process.env.FEATURE_GROOVY_ACTIONS === 'true',
      actionTypeDeployment: process.env.FEATURE_ACTION_TYPE_DEPLOYMENT === 'true',
      conditionTypeDeployment: process.env.FEATURE_CONDITION_TYPE_DEPLOYMENT === 'true',
      advancedSettings: process.env.FEATURE_ADVANCED_SETTINGS === 'true',
      tenantAdmin: isTenantAdminEnabled(),
    };

    Object.keys(envOverrides).forEach(key => {
      if (envOverrides[key as keyof FeatureFlags] === undefined) {
        delete envOverrides[key as keyof FeatureFlags];
      }
    });

    const featureFlags = mergeFeatureFlags(deploymentType, Object.keys(envOverrides).length > 0 ? envOverrides : undefined);

    return res.status(200).json({
      deploymentType,
      features: featureFlags
    });
  }
});
