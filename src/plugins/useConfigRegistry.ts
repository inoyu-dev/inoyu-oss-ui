/**
 * useConfigRegistry
 *
 * Convenience hook for accessing merged configuration from plugins.
 *
 * Usage:
 *   const { getConfig } = useConfigRegistry();
 *   const appConfig = getConfig('app');
 */

import { useCallback } from 'react';
import { usePluginRegistry } from './usePluginRegistry';

export function useConfigRegistry() {
  const registry = usePluginRegistry();

  const getConfig = useCallback(
    (configKey: string): Record<string, unknown> => registry.getConfig(configKey),
    [registry]
  );

  return { getConfig };
}
