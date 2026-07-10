/**
 * useComponentRegistry
 *
 * Convenience hook for resolving components from the PluginRegistry.
 *
 * Usage:
 *   const { getComponent } = useComponentRegistry();
 *   const Editor = getComponent('conditions/ConditionEditor', JsonConditionEditor);
 */

import { useCallback } from 'react';
import type { ComponentType } from 'react';
import { usePluginRegistry } from './usePluginRegistry';

export function useComponentRegistry() {
  const registry = usePluginRegistry();

  const getComponent = useCallback(
    <P = Record<string, unknown>>(
      path: string,
      baseComponent?: ComponentType<P>
    ): ComponentType<P> | null => {
      return registry.getComponent(path, baseComponent) as ComponentType<P> | null;
    },
    [registry]
  );

  return { getComponent };
}
