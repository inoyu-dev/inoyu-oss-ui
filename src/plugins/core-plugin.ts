/**
 * Core Plugin — Inoyu OSS UI Open Source Features
 *
 * Declares all features that belong to the open-source "Inoyu OSS UI" tier.
 * These are features that use the Unomi REST API directly and don't
 * require custom storage backends.
 *
 * This plugin:
 * - Registers core navigation groups (sidebar items)
 * - Registers core feature metadata via `config`
 * - Has priority 0 (base layer, can be extended by additional plugins)
 */

import {
  House,
  Users,
  Layers,
  Settings,
  Globe,
  FileJson,
  Tag,
  Target,
  Megaphone,
  UserCircle,
  List,
  Zap,
  Code,
  LayoutDashboard,
  Database,
} from 'lucide-react';
import type { Plugin } from './types';
import { navIcon } from './nav-utils';

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Routes that belong to the open-source core.
 * These pages use only the Unomi API — no custom storage.
 */
export const CORE_ROUTES = [
  '/segments',
  '/rules',
  '/goals',
  '/campaigns',
  '/scoring',
  '/personas',
  '/user-lists',
  '/property-types',
  '/json-schemas',
  '/condition-types',
  '/action-types',
  '/groovy-actions',
  '/scopes',
  '/profiles',
  '/tenants',
] as const;

/**
 * Component paths that belong to the open-source core.
 */
export const CORE_COMPONENTS = [
  'segments/SegmentList',
  'segments/SegmentBuilder',
  'rules/RulesList',
  'rules/RuleBuilder',
  'goals/GoalList',
  'goals/GoalBuilder',
  'campaigns/CampaignList',
  'campaigns/CampaignBuilder',
  'scoring/ScoringList',
  'scoring/ScoringBuilder',
  'personas/PersonaList',
  'user-lists/UserListList',
  'property-types/PropertyTypeList',
  'property-types/PropertyTypeEditor',
  'json-schemas/JsonSchemaList',
  'json-schemas/JsonSchemaEditor',
  'condition-types/ConditionTypeList',
  'action-types/ActionTypeList',
  'groovy-actions/GroovyActionList',
  'scopes/ScopeList',
  'profiles/ProfileList',
  'profiles/Profile',
] as const;

// ─── Core Navigation ─────────────────────────────────────────────────────────

/**
 * Navigation groups registered by the core plugin.
 * These form the base sidebar. Plugins can add additional groups.
 */
/**
 * Navigation groups for Inoyu OSS UI.
 * Only Unomi-native features. Plugins can extend with additional groups.
 */
export const CORE_NAVIGATION_GROUPS = [
  {
    id: 'overview',
    label: 'Overview',
    icon: navIcon(LayoutDashboard, 'md'),
    defaultExpanded: true,
    items: [
      { href: '/', icon: navIcon(House), label: 'Home' },
    ],
  },
  {
    id: 'customer-data',
    label: 'Customer Data',
    icon: navIcon(Users, 'md'),
    defaultExpanded: true,
    items: [
      { href: '/profiles', icon: navIcon(Users), label: 'Profiles' },
      { href: '/segments', icon: navIcon(Layers), label: 'Segments' },
      { href: '/personas', icon: navIcon(UserCircle), label: 'Personas' },
      { href: '/user-lists', icon: navIcon(List), label: 'User Lists' },
    ],
  },
  {
    id: 'automation',
    label: 'Automation',
    icon: navIcon(Zap, 'md'),
    defaultExpanded: true,
    items: [
      { href: '/rules', icon: navIcon(Settings), label: 'Rules' },
      { href: '/goals', icon: navIcon(Target), label: 'Goals' },
      { href: '/campaigns', icon: navIcon(Megaphone), label: 'Campaigns' },
      { href: '/scoring', icon: navIcon(Target), label: 'Scoring' },
    ],
  },
  {
    id: 'configuration',
    label: 'Configuration',
    icon: navIcon(Settings, 'md'),
    defaultExpanded: false,
    items: [
      { href: '/property-types', icon: navIcon(Tag), label: 'Property Types' },
      { href: '/json-schemas', icon: navIcon(FileJson), label: 'JSON Schemas' },
      { href: '/scopes', icon: navIcon(Globe), label: 'Scopes' },
      {
        href: '/condition-types',
        icon: navIcon(Database),
        label: 'Condition Types',
        featureFlag: 'conditionTypeDeployment' as const,
      },
      {
        href: '/action-types',
        icon: navIcon(Code),
        label: 'Action Types',
        featureFlag: 'actionTypeDeployment' as const,
      },
      {
        href: '/groovy-actions',
        icon: navIcon(Code),
        label: 'Groovy Actions',
        featureFlag: 'groovyActions' as const,
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    icon: navIcon(Settings, 'md'),
    defaultExpanded: false,
    items: [
      {
        href: '/tenants',
        icon: navIcon(Users),
        label: 'Tenant Management',
        adminOnly: true,
        featureFlag: 'tenantAdmin' as const,
      },
      { href: '/settings', icon: navIcon(Settings), label: 'Settings' },
    ],
  },
];

// ─── Plugin Definition ───────────────────────────────────────────────────────

export const corePlugin: Plugin = {
  id: 'unomi-core',
  name: 'Inoyu OSS UI Core',
  version: '1.0.0',
  description: 'Core Inoyu OSS UI features — open source, Apache 2.0 licensed',
  author: 'Inoyu',
  license: 'Apache-2.0',
  priority: 0,

  extensions: {
    navigation: {
      groups: CORE_NAVIGATION_GROUPS,
    },
    config: {
      'feature-tiers': {
        core: {
          routes: CORE_ROUTES,
          components: CORE_COMPONENTS,
          description: 'Open-source Inoyu OSS UI features using Unomi REST API',
        },
      },
      'app': {
        appName: 'Inoyu OSS UI',
        tier: 'core',
      },
    },
  },

  onRegister() {
    if (typeof window !== 'undefined') {
      console.debug('[Plugin] Unomi Core registered — %d navigation groups', CORE_NAVIGATION_GROUPS.length);
    }
  },
};

export default corePlugin;
