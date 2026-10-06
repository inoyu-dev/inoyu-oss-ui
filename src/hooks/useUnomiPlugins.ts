/**
 * React hook for Unomi OSGi plugin presence (server-probed, 1m client cache).
 */

import { useCallback, useEffect, useState } from 'react';
import type { UnomiPluginPresenceMap, UnomiPluginsResponse } from '@/lib/unomi-plugin-registry';

let cached: UnomiPluginsResponse | null = null;
let cacheTimestamp = 0;
const CACHE_MS = 60_000;

async function fetchUnomiPlugins(force = false): Promise<UnomiPluginsResponse> {
  const now = Date.now();
  if (!force && cached && now - cacheTimestamp < CACHE_MS) {
    return cached;
  }

  const url = force ? '/api/config/unomi-plugins?refresh=1' : '/api/config/unomi-plugins';
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch Unomi plugins: ${response.statusText}`);
  }
  const data = (await response.json()) as UnomiPluginsResponse;
  cached = data;
  cacheTimestamp = now;
  return data;
}

export function useUnomiPlugins() {
  const [plugins, setPlugins] = useState<UnomiPluginPresenceMap>(cached?.plugins ?? {});
  const [isLoading, setIsLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);
  const [probedAt, setProbedAt] = useState<string | undefined>(cached?.probedAt);

  const refetch = useCallback(async (force = false) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchUnomiPlugins(force);
      setPlugins(data.plugins);
      setProbedAt(data.probedAt);
    } catch (err) {
      console.error('Error fetching Unomi plugin presence:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch Unomi plugins'));
      if (cached) {
        setPlugins(cached.plugins);
        setProbedAt(cached.probedAt);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch(false);
  }, [refetch]);

  return {
    plugins,
    isLoading,
    error,
    probedAt,
    refetch: () => refetch(true),
    /** True when we have finished at least one probe (success or fail with cache). */
    isReady: !isLoading,
  };
}

/**
 * Whether a specific Unomi plugin is present.
 * While loading, returns false so UI stays hidden until confirmed.
 */
export function useUnomiPlugin(pluginId: string): {
  present: boolean;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
} {
  const { plugins, isLoading, error, refetch } = useUnomiPlugins();
  return {
    present: !isLoading && Boolean(plugins[pluginId]),
    isLoading,
    error,
    refetch,
  };
}
