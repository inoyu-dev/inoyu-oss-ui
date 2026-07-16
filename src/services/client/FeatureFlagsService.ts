/**
 * Feature Flags Service
 * Client-side service for accessing feature flags
 */

import { FeatureFlags, DeploymentType, defaultOnPremiseFlags } from '@/config/feature-flags';

export interface FeatureFlagsResponse {
  deploymentType: DeploymentType;
  features: FeatureFlags;
}

/**
 * Fetch feature flags from the API
 */
export async function getFeatureFlags(): Promise<FeatureFlagsResponse> {
  try {
    const response = await fetch('/api/config/feature-flags');
    if (!response.ok) {
      throw new Error(`Failed to fetch feature flags: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    // Return safe defaults on error
    return {
      deploymentType: 'on-premise',
      features: { ...defaultOnPremiseFlags },
    };
  }
}
