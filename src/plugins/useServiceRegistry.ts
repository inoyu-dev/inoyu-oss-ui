/**
 * useServiceRegistry
 *
 * Convenience hook for resolving service classes from the PluginRegistry.
 *
 * Usage:
 *   const { getService } = useServiceRegistry();
 *   const ServiceClass = getService('UnomiClientService') || BaseService;
 */

import { useCallback } from 'react';
import { usePluginRegistry } from './usePluginRegistry';

export function useServiceRegistry() {
  const registry = usePluginRegistry();

  const getService = useCallback(
    <T = unknown>(
      serviceName: string,
      baseService?: new (...args: unknown[]) => T
    ): (new (...args: unknown[]) => T) | null => {
      return registry.getService<T>(serviceName, baseService);
    },
    [registry]
  );

  return { getService };
}
