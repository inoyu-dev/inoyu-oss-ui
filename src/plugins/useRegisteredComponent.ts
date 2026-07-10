/**
 * useRegisteredComponent — Convenience hook for resolving a single component
 * from the PluginRegistry with a fallback default.
 *
 * This is the simplest way to make a component plugin-replaceable:
 *
 *   const Editor = useRegisteredComponent('conditions/ConditionBuilder', ConditionBuilder);
 *   return <Editor value={condition} onChange={setCondition} />;
 *
 * If a plugin registers a replacement at the given path, that replacement
 * is used. Otherwise, the default component is returned.
 */

import { useMemo, type ComponentType } from 'react';
import { useComponentRegistry } from './useComponentRegistry';

/**
 * Resolve a component from the plugin registry.
 *
 * @param path     Registry path (e.g. 'conditions/ConditionBuilder')
 * @param Default  Fallback component when no plugin provides a replacement
 * @returns        The resolved component (plugin replacement or default)
 */
export function useRegisteredComponent<P = Record<string, unknown>>(
  path: string,
  Default: ComponentType<P>
): ComponentType<P> {
  const { getComponent } = useComponentRegistry();

  return useMemo(() => {
    const resolved = getComponent<P>(path, Default);
    return resolved ?? Default;
  }, [getComponent, path, Default]);
}
