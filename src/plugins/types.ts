/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Plugin System Types
 *
 * Defines the core interfaces for the unified PluginRegistry system.
 * All extensions (components, pages, navigation, services, config)
 * are registered through plugins using these types.
 *
 * Note: `any` is used intentionally throughout this file. A plugin registry
 * must accept arbitrary component props, service constructors, and config
 * shapes — it is inherently a boundary where strict typing yields to
 * runtime flexibility.
 */

import type { ComponentType } from 'react';
import type { NavGroupProps } from '@/components/layout/NavGroup';
import type { NavItemProps } from '@/components/layout/NavItem';

// ---------------------------------------------------------------------------
// Plugin Manifest (metadata)
// ---------------------------------------------------------------------------

export interface PluginManifest {
  /** Unique identifier for the plugin (e.g. 'unomi-core') */
  id: string;
  /** Human-readable name */
  name: string;
  /** Semver version string */
  version: string;
  /** Optional description */
  description?: string;
  /** Optional author */
  author?: string;
  /** Optional license identifier */
  license?: string;
  /** IDs of plugins that must be registered before this one */
  dependencies?: string[];
}

// ---------------------------------------------------------------------------
// Plugin Extension (what a plugin registers)
// ---------------------------------------------------------------------------

export interface PluginExtension {
  /**
   * Component extensions keyed by path (e.g. 'conditions/ConditionEditor').
   * - ComponentType: replaces/adds the component at that path
   * - null: removes the component (getComponent returns null)
   */
  components?: Record<string, ComponentType<any> | null>;

  /**
   * Component wrappers keyed by path.
   * Receives the base (or replaced) component and returns an enhanced one.
   * Applied in priority order (lower priority wraps first).
   */
  componentWrappers?: Record<
    string,
    (BaseComponent: ComponentType<any>) => ComponentType<any>
  >;

  /**
   * Page extensions keyed by route (e.g. '/segments').
   * - ComponentType: replaces/adds the page at that route
   * - null: removes the page
   */
  pages?: Record<string, ComponentType<any> | null>;

  /**
   * Navigation extensions.
   */
  navigation?: {
    /** New navigation groups to append */
    groups?: NavGroupProps[];
    /**
     * Items keyed by their unique key.
     * - NavItemProps: adds or replaces the item
     * - null: removes the item
     */
    items?: Record<string, NavItemProps | null>;
  };

  /**
   * Service extensions keyed by service name.
   * The value is a class constructor that replaces the base service.
   */
  services?: Record<string, new (...args: any[]) => any>;

  /**
   * Configuration extensions keyed by config key (e.g. 'app').
   * Configs from all plugins are merged (later priority wins for conflicts).
   */
  config?: Record<string, Record<string, unknown>>;
}

// ---------------------------------------------------------------------------
// Plugin (manifest + extensions + priority + lifecycle)
// ---------------------------------------------------------------------------

export interface Plugin extends PluginManifest {
  extensions: PluginExtension;
  /**
   * Priority controls load order and conflict resolution.
   * Higher priority = loaded later = wins in conflicts/replacements.
   * Default: 0
   */
  priority?: number;
  /** Called after plugin is registered */
  onRegister?: () => void | Promise<void>;
  /** Called when plugin is unregistered */
  onUnregister?: () => void | Promise<void>;
}
