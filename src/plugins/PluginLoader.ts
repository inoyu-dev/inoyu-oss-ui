/**
 * PluginLoader
 *
 * Loads plugins into a PluginRegistry. Supports:
 * - Direct registration of Plugin objects
 * - Loading from a list of plugin module paths (dynamic import)
 * - Dependency checking before registration
 */

import { PluginRegistry } from './PluginRegistry';
import type { Plugin } from './types';

export class PluginLoader {
  private registry: PluginRegistry;

  constructor(registry: PluginRegistry) {
    this.registry = registry;
  }

  /**
   * Register a plugin object directly.
   */
  registerPlugin(plugin: Plugin): void {
    this.registry.register(plugin);
  }

  /**
   * Dynamically import and register a plugin from a module path.
   * The module must have a default export conforming to the Plugin interface.
   */
  async loadPlugin(pluginPath: string): Promise<void> {
    try {
      const pluginModule = await import(/* webpackIgnore: true */ pluginPath);
      const plugin: Plugin = pluginModule.default ?? pluginModule;

      if (!plugin.id || !plugin.extensions) {
        throw new Error(
          `Module at "${pluginPath}" does not export a valid Plugin`
        );
      }

      this.registry.register(plugin);
    } catch (error) {
      console.error(`[PluginLoader] Failed to load plugin "${pluginPath}":`, error);
      throw error;
    }
  }

  /**
   * Load multiple plugins from an ordered list of module paths.
   * Plugins are loaded sequentially (order matters for dependencies).
   * Errors are logged but do not stop the remaining plugins from loading.
   */
  async loadPluginsFromPaths(pluginPaths: string[]): Promise<void> {
    for (const path of pluginPaths) {
      try {
        await this.loadPlugin(path);
      } catch {
        // Error already logged in loadPlugin
      }
    }
  }

  /**
   * Register multiple plugin objects directly, sorted by priority.
   */
  registerPlugins(plugins: Plugin[]): void {
    // Sort by priority ascending so lower-priority registers first
    const sorted = [...plugins].sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
    );
    for (const plugin of sorted) {
      try {
        this.registry.register(plugin);
      } catch (error) {
        console.error(
          `[PluginLoader] Failed to register plugin "${plugin.id}":`,
          error
        );
      }
    }
  }
}
