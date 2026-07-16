/**
 * API endpoint for feature flags configuration
 * Returns feature flags based on deployment type and environment variables
 */

import type { NextApiResponse } from 'next';
import { createHandler } from '@/lib/api-middleware';
import {
  DeploymentType,
  buildFeatureFlagEnvOverrides,
  mergeFeatureFlags,
} from '@/config/feature-flags';
import { DEFAULT_DEPLOYMENT_TYPE } from '@/config/env-defaults';
import { isTenantAdminUiEnabled } from '@/lib/tenant-admin';

export default createHandler({
  methods: ['GET'],
  handler: async (_req, res: NextApiResponse) => {
    const deploymentType = (process.env.DEPLOYMENT_TYPE || DEFAULT_DEPLOYMENT_TYPE) as DeploymentType;

    const envOverrides = {
      ...buildFeatureFlagEnvOverrides(),
      tenantAdmin: isTenantAdminUiEnabled(),
    };

    const featureFlags = mergeFeatureFlags(deploymentType, envOverrides);

    return res.status(200).json({
      deploymentType,
      features: featureFlags,
    });
  },
});
