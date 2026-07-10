/**
 * PluginRegistryProvider & usePluginRegistry hook
 *
 * Provides the PluginRegistry via React context so that any component
 * in the tree can access plugin extensions (components, pages,
 * navigation, services, config).
 */

import React, { createContext, useContext } from 'react';
import { PluginRegistry } from './PluginRegistry';

const PluginRegistryContext = createContext<PluginRegistry | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export interface PluginRegistryProviderProps {
  registry: PluginRegistry;
  children: React.ReactNode;
}

export function PluginRegistryProvider({
  registry,
  children,
}: PluginRegistryProviderProps) {
  return (
    <PluginRegistryContext.Provider value={registry}>
      {children}
    </PluginRegistryContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Access the PluginRegistry from any component inside the provider tree.
 * Throws if called outside of PluginRegistryProvider.
 */
export function usePluginRegistry(): PluginRegistry {
  const registry = useContext(PluginRegistryContext);
  if (!registry) {
    throw new Error(
      'usePluginRegistry must be used within a <PluginRegistryProvider>'
    );
  }
  return registry;
}
