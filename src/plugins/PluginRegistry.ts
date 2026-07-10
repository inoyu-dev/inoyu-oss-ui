/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * PluginRegistry
 *
 * Unified registry for all plugin extensions: components, pages,
 * navigation, services, and configuration. Everything goes through
 * this single registry — no separate registries needed.
 *
 * Key behaviours:
 * - Plugins are sorted by priority (lower first, higher later)
 * - For replacements, highest-priority plugin wins
 * - For wrappers, lower-priority wraps first (inner), higher wraps last (outer)
 * - For config, all values are merged (later priority overwrites keys)
 * - Registering `null` removes/hides a component, page, or nav item
 *
 * Note: `any` is used intentionally — the registry stores arbitrary
 * component types, service constructors, and config shapes.
 */

import type { ComponentType } from 'react';
import type { NavGroupProps } from '@/components/layout/NavGroup';
import type { NavItemProps } from '@/components/layout/NavItem';
import type { Plugin } from './types';

export class PluginRegistry {
  private plugins = new Map<string, Plugin>();

  // -----------------------------------------------------------------------
  // Plugin lifecycle
  // -----------------------------------------------------------------------

  /**
   * Register a plugin. Throws if any declared dependency is missing.
   */
  register(plugin: Plugin): void {
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin "${plugin.id}" requires dependency "${dep}" which is not registered`
          );
        }
      }
    }

    this.plugins.set(plugin.id, plugin);
    plugin.onRegister?.();
  }

  /**
   * Unregister a plugin by its id.
   */
  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      plugin.onUnregister?.();
      this.plugins.delete(pluginId);
    }
  }

  // -----------------------------------------------------------------------
  // Plugin queries
  // -----------------------------------------------------------------------

  getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  // -----------------------------------------------------------------------
  // Internal: priority-sorted iteration
  // -----------------------------------------------------------------------

  /**
   * Return plugins sorted ascending by priority (lower first).
   */
  private getPluginsByPriority(): Plugin[] {
    return Array.from(this.plugins.values()).sort(
      (a, b) => (a.priority ?? 0) - (b.priority ?? 0)
    );
  }

  /**
   * DRY helper: scan plugins from highest to lowest priority and return
   * the first value for which `extractor` returns a defined result.
   */
  private findHighestPriority<T>(
    extractor: (ext: Plugin['extensions']) => T | undefined
  ): T | undefined {
    const sorted = this.getPluginsByPriority();
    for (let i = sorted.length - 1; i >= 0; i--) {
      const value = extractor(sorted[i].extensions);
      if (value !== undefined) return value;
    }
    return undefined;
  }

  // -----------------------------------------------------------------------
  // Component registry
  // -----------------------------------------------------------------------

  /**
   * Resolve a component by path.
   *
   * 1. Check for direct replacement/removal (highest-priority plugin wins).
   * 2. If replacement is `null`, return `null` (component removed).
   * 3. If a replacement exists, apply wrappers and return.
   * 4. Otherwise, use `baseComponent` (if provided), apply wrappers, return.
   * 5. If nothing found, return `null`.
   */
  getComponent(
    path: string,
    baseComponent?: ComponentType<any>
  ): ComponentType<any> | null {
    const component = this.findHighestPriority<ComponentType<any> | null>(
      (ext) => ext.components && path in ext.components ? ext.components[path] : undefined
    );

    // Explicit removal
    if (component === null) {
      return null;
    }

    // Use replacement or fall back to base
    const resolved = component ?? baseComponent;
    if (!resolved) {
      return null;
    }

    return this.applyComponentWrappers(path, resolved);
  }

  /**
   * Apply all registered component wrappers for a given path.
   * Wrappers are applied in ascending priority order (lower wraps first).
   */
  private applyComponentWrappers(
    path: string,
    component: ComponentType<any>
  ): ComponentType<any> {
    let wrapped = component;
    for (const plugin of this.getPluginsByPriority()) {
      const wrapper = plugin.extensions.componentWrappers?.[path];
      if (wrapper) {
        wrapped = wrapper(wrapped);
      }
    }
    return wrapped;
  }

  // -----------------------------------------------------------------------
  // Page registry
  // -----------------------------------------------------------------------

  /**
   * Resolve a page component by route.
   * Returns the highest-priority replacement, or `basePage`, or `null`.
   * A `null` registration explicitly removes the page.
   */
  getPage(
    route: string,
    basePage?: ComponentType<any>
  ): ComponentType<any> | null {
    const page = this.findHighestPriority<ComponentType<any> | null>(
      (ext) => ext.pages && route in ext.pages ? ext.pages[route] : undefined
    );
    return page !== undefined ? page : (basePage ?? null);
  }

  // -----------------------------------------------------------------------
  // Navigation registry
  // -----------------------------------------------------------------------

  /**
   * Collect all navigation extensions across plugins.
   * Returns groups to append, items to add/replace, and items to remove.
   */
  getNavigationExtensions(): {
    groups: NavGroupProps[];
    items: Record<string, NavItemProps>;
    removedItems: Set<string>;
  } {
    const groups: NavGroupProps[] = [];
    const items: Record<string, NavItemProps> = {};
    const removedItems = new Set<string>();

    for (const plugin of this.getPluginsByPriority()) {
      const nav = plugin.extensions.navigation;
      if (!nav) continue;

      // Collect groups (additive)
      if (nav.groups) {
        groups.push(...nav.groups);
      }

      // Process items (last wins for replacements, null = remove)
      if (nav.items) {
        for (const [key, item] of Object.entries(nav.items)) {
          if (item === null) {
            removedItems.add(key);
            delete items[key];
          } else {
            items[key] = item;
            removedItems.delete(key); // re-added after earlier removal
          }
        }
      }
    }

    // Final cleanup: remove anything in removedItems that snuck back in
    const finalItems: Record<string, NavItemProps> = {};
    for (const [key, item] of Object.entries(items)) {
      if (!removedItems.has(key)) {
        finalItems[key] = item;
      }
    }

    return { groups, items: finalItems, removedItems };
  }

  // -----------------------------------------------------------------------
  // Service registry
  // -----------------------------------------------------------------------

  /**
   * Resolve a service class by name.
   * Returns the highest-priority replacement, or `baseService`, or `null`.
   */
  getService<T = any>(
    serviceName: string,
    baseService?: new (...args: any[]) => T
  ): (new (...args: any[]) => T) | null {
    const svc = this.findHighestPriority(
      (ext) => ext.services?.[serviceName]
    );
    return (svc as (new (...args: any[]) => T) | undefined) ?? baseService ?? null;
  }

  // -----------------------------------------------------------------------
  // Config registry
  // -----------------------------------------------------------------------

  /**
   * Merge all plugin configs for a given key.
   * Later (higher priority) plugins overwrite earlier keys.
   */
  getConfig(configKey: string): Record<string, unknown> {
    const merged: Record<string, unknown> = {};
    for (const plugin of this.getPluginsByPriority()) {
      const cfg = plugin.extensions.config?.[configKey];
      if (cfg) {
        Object.assign(merged, cfg);
      }
    }
    return merged;
  }
}
