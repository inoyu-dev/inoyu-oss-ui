/**
 * ConditionTypeService — Client-side service for Unomi condition type discovery.
 *
 * Fetches condition type definitions from the Unomi API via the CXS proxy.
 * Caches results for performance (condition types rarely change at runtime).
 *
 * Usage:
 *   const service = new ConditionTypeService();
 *   const types = await service.getAll();
 *   const type = await service.getById('profilePropertyCondition');
 */

import axios from 'axios';
import type { UnomiMetadata } from './unomi-types';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ConditionTypeParameter {
  id: string;
  type: string;
  multivalued?: boolean;
  required?: boolean;
  defaultValue?: unknown;
  allowedValues?: unknown[];
  [key: string]: unknown;
}

export interface UnomiConditionType {
  itemId: string;
  itemType?: string;
  scope: string;
  version?: number;
  metadata: UnomiMetadata;
  conditionEvaluator?: string;
  queryBuilder?: string;
  parameters: ConditionTypeParameter[];
  /** Which object types this condition applies to (profiles, sessions, events) */
  tags?: string[];
  systemTags?: string[];
}

/**
 * Normalized condition type for UI consumption.
 * Merges both nested metadata and flat REST formats into one structure.
 */
export interface NormalizedConditionType {
  id: string;
  name: string;
  description: string;
  tags: string[];
  systemTags: string[];
  parameters: ConditionTypeParameter[];
  enabled: boolean;
  scope: string;
}

// ─── Service ────────────────────────────────────────────────────────────────

let cache: NormalizedConditionType[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Normalize a condition type from either the nested or flat API format.
 */
function normalize(raw: Record<string, unknown>): NormalizedConditionType {
  const metadata = raw.metadata as Record<string, unknown> | undefined;
  return {
    id: (metadata?.id ?? raw.id ?? raw.itemId ?? '') as string,
    name: (metadata?.name ?? raw.name ?? '') as string,
    description: (metadata?.description ?? raw.description ?? '') as string,
    tags: (metadata?.tags ?? raw.tags ?? []) as string[],
    systemTags: (metadata?.systemTags ?? raw.systemTags ?? []) as string[],
    parameters: (raw.parameters ?? []) as ConditionTypeParameter[],
    enabled: (metadata?.enabled ?? raw.enabled ?? true) as boolean,
    scope: (metadata?.scope ?? raw.scope ?? 'systemscope') as string,
  };
}

export class ConditionTypeService {
  /**
   * Get all condition types, with caching.
   */
  async getAll(forceRefresh = false): Promise<NormalizedConditionType[]> {
    if (!forceRefresh && cache && Date.now() - cacheTimestamp < CACHE_TTL) {
      return cache;
    }

    const response = await axios.get('/api/cxs/definitions/conditions', {
      headers: { 'Accept-Language': 'en' },
    });

    const data = Array.isArray(response.data) ? response.data : [];
    cache = data.map(normalize).sort((a, b) => a.name.localeCompare(b.name));
    cacheTimestamp = Date.now();
    return cache;
  }

  /**
   * Get a single condition type by ID.
   */
  async getById(conditionTypeId: string): Promise<NormalizedConditionType | null> {
    const all = await this.getAll();
    return all.find((ct) => ct.id === conditionTypeId) ?? null;
  }

  /**
   * Get condition types filtered by tag.
   */
  async getByTag(tag: string): Promise<NormalizedConditionType[]> {
    const all = await this.getAll();
    return all.filter(
      (ct) => ct.tags.includes(tag) || ct.systemTags.includes(tag)
    );
  }

  /**
   * Get condition types suitable for a specific target (profileCondition, sessionCondition, eventCondition).
   */
  async getBySystemTag(systemTag: string): Promise<NormalizedConditionType[]> {
    const all = await this.getAll();
    return all.filter((ct) => ct.systemTags.includes(systemTag));
  }

  /**
   * Clear the cache (e.g., after deploying new plugins).
   */
  clearCache(): void {
    cache = null;
    cacheTimestamp = 0;
  }
}

/** Singleton instance */
export const conditionTypeService = new ConditionTypeService();
