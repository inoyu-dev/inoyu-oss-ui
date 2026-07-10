/**
 * ActionTypeService — Client-side service for Unomi action type discovery.
 *
 * Fetches action type definitions from the Unomi API via the CXS proxy.
 * Caches results for performance (action types rarely change at runtime).
 *
 * Usage:
 *   const service = new ActionTypeService();
 *   const types = await service.getAll();
 *   const type = await service.getById('setPropertyAction');
 */

import axios from 'axios';
import type { UnomiMetadata } from './unomi-types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActionTypeParameter {
  id: string;
  type: string;
  multivalued?: boolean;
  required?: boolean;
  defaultValue?: unknown;
  [key: string]: unknown;
}

export interface UnomiActionTypeRaw {
  itemId: string;
  itemType?: string;
  scope: string;
  version?: number;
  metadata?: UnomiMetadata;
  actionExecutor?: string;
  parameters?: ActionTypeParameter[];
  // Flat REST format
  id?: string;
  name?: string;
  description?: string;
  tags?: string[];
  systemTags?: string[];
  enabled?: boolean;
}

/**
 * Normalized action type for UI consumption.
 */
export interface NormalizedActionType {
  id: string;
  name: string;
  description: string;
  tags: string[];
  systemTags: string[];
  parameters: ActionTypeParameter[];
  actionExecutor: string;
  enabled: boolean;
  scope: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

let cache: NormalizedActionType[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function normalize(raw: Record<string, unknown>): NormalizedActionType {
  const metadata = raw.metadata as Record<string, unknown> | undefined;
  return {
    id: (metadata?.id ?? raw.id ?? raw.itemId ?? '') as string,
    name: (metadata?.name ?? raw.name ?? '') as string,
    description: (metadata?.description ?? raw.description ?? '') as string,
    tags: (metadata?.tags ?? raw.tags ?? []) as string[],
    systemTags: (metadata?.systemTags ?? raw.systemTags ?? []) as string[],
    parameters: (raw.parameters ?? []) as ActionTypeParameter[],
    actionExecutor: (raw.actionExecutor ?? '') as string,
    enabled: (metadata?.enabled ?? raw.enabled ?? true) as boolean,
    scope: (metadata?.scope ?? raw.scope ?? 'systemscope') as string,
  };
}

export class ActionTypeService {
  /**
   * Get all action types, with caching.
   */
  async getAll(forceRefresh = false): Promise<NormalizedActionType[]> {
    if (!forceRefresh && cache && Date.now() - cacheTimestamp < CACHE_TTL) {
      return cache;
    }

    const response = await axios.get('/api/cxs/definitions/actions', {
      headers: { 'Accept-Language': 'en' },
    });

    const data = Array.isArray(response.data) ? response.data : [];
    cache = data.map(normalize).sort((a, b) => a.name.localeCompare(b.name));
    cacheTimestamp = Date.now();
    return cache;
  }

  /**
   * Get a single action type by ID.
   */
  async getById(actionTypeId: string): Promise<NormalizedActionType | null> {
    const all = await this.getAll();
    return all.find((at) => at.id === actionTypeId) ?? null;
  }

  /**
   * Get action types filtered by tag.
   */
  async getByTag(tag: string): Promise<NormalizedActionType[]> {
    const all = await this.getAll();
    return all.filter(
      (at) => at.tags.includes(tag) || at.systemTags.includes(tag)
    );
  }

  /**
   * Clear the cache.
   */
  clearCache(): void {
    cache = null;
    cacheTimestamp = 0;
  }
}

/** Singleton instance */
export const actionTypeService = new ActionTypeService();
