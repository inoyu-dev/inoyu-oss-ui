/**
 * useNavigationRegistry
 *
 * Convenience hook for accessing navigation extensions from plugins.
 *
 * Usage:
 *   const { getNavigationExtensions } = useNavigationRegistry();
 *   const { groups, items, removedItems } = getNavigationExtensions();
 */

import { useCallback } from 'react';
import { usePluginRegistry } from './usePluginRegistry';

export function useNavigationRegistry() {
  const registry = usePluginRegistry();

  // registry is stable (from context), so the callback reference is stable too.
  const getNavigationExtensions = useCallback(
    () => registry.getNavigationExtensions(),
    [registry]
  );

  return { getNavigationExtensions };
}
