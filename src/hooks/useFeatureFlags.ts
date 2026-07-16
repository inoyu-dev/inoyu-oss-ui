/**
 * React hook for accessing feature flags
 */

import { useEffect, useState, useCallback } from 'react';
import { FeatureFlags, DeploymentType, defaultOnPremiseFlags } from '@/config/feature-flags';
import { FeatureFlagsResponse, getFeatureFlags } from '@/services/client/FeatureFlagsService';

// Cache for feature flags to avoid repeated requests
let cachedFlags: FeatureFlagsResponse | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

export function useFeatureFlags() {
  const [data, setData] = useState<FeatureFlagsResponse | null>(cachedFlags);
  const [isLoading, setIsLoading] = useState(!cachedFlags);
  const [error, setError] = useState<Error | null>(null);

  const fetchFeatureFlags = useCallback(async () => {
    // Use cache if it's still valid
    const now = Date.now();
    if (cachedFlags && (now - cacheTimestamp) < CACHE_DURATION) {
      setData(cachedFlags);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const flags = await getFeatureFlags();
      cachedFlags = flags;
      cacheTimestamp = now;
      setData(flags);
    } catch (err) {
      console.error('Error fetching feature flags:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch feature flags'));
      // Use cached data if available, even if expired
      if (cachedFlags) {
        setData(cachedFlags);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatureFlags();
  }, [fetchFeatureFlags]);

  return {
    featureFlags: data?.features || defaultOnPremiseFlags,
    deploymentType: (data?.deploymentType || 'on-premise') as DeploymentType,
    isLoading,
    error,
    refetch: fetchFeatureFlags,
  };
}

/**
 * Check if a specific feature is enabled
 */
export function useFeatureEnabled(feature: keyof FeatureFlags): boolean {
  const { featureFlags } = useFeatureFlags();
  return featureFlags[feature] || false;
}
