/**
 * usePageRegistry
 *
 * Convenience hook for resolving page components from the PluginRegistry.
 *
 * Usage:
 *   const { getPageComponent } = usePageRegistry();
 *   const Page = getPageComponent('/segments') || DefaultSegmentList;
 */

import { useCallback } from 'react';
import type { ComponentType } from 'react';
import { usePluginRegistry } from './usePluginRegistry';

export function usePageRegistry() {
  const registry = usePluginRegistry();

  const getPageComponent = useCallback(
    <P = Record<string, unknown>>(
      route: string,
      basePage?: ComponentType<P>
    ): ComponentType<P> | null => {
      return registry.getPage(route, basePage) as ComponentType<P> | null;
    },
    [registry]
  );

  return { getPageComponent };
}
