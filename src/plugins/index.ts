/**
 * Plugin System — Public API
 *
 * Re-exports everything needed to build, register, and consume plugins.
 */

// Core types
export type { Plugin, PluginManifest, PluginExtension } from './types';

// Registry
export { PluginRegistry } from './PluginRegistry';

// Loader
export { PluginLoader } from './PluginLoader';

// React integration
export {
  PluginRegistryProvider,
  usePluginRegistry,
} from './usePluginRegistry';

// Convenience hooks
export { useComponentRegistry } from './useComponentRegistry';
export { useRegisteredComponent } from './useRegisteredComponent';
export { useNavigationRegistry } from './useNavigationRegistry';
export { usePageRegistry } from './usePageRegistry';
export { useServiceRegistry } from './useServiceRegistry';
export { useConfigRegistry } from './useConfigRegistry';

// Built-in plugins
export { corePlugin, CORE_ROUTES, CORE_COMPONENTS } from './core-plugin';
