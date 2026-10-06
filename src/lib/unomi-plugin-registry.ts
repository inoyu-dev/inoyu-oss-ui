/**
 * Unomi OSGi plugin presence — registry + probe helpers.
 *
 * Commercial UIs gate nav/pages with `unomiPlugin` + `useUnomiPlugin()` /
 * `<UnomiPluginGate />`. Presence is **deployment-based**: prefer the live
 * Unomi catalog (`GET /cxs/plugins/inoyu/catalog`) over a hardcoded probe list.
 * Static `registerUnomiPlugin` entries are fallbacks (core Unomi extensions,
 * or when the catalog bundle is not deployed).
 */

import axios from 'axios';
import type { NextApiRequest } from 'next';
import { getUnomiConfig, getAuthCredentials, isUnomiV3, hasV3Credentials } from '@/lib/unomi-config';

export interface UnomiPluginProbe {
  /** Stable id used in nav (`unomiPlugin`) and hooks */
  id: string;
  /** Human label for logs / unavailable UI */
  label: string;
  method: 'GET' | 'POST' | 'HEAD';
  /** Absolute path on Unomi, e.g. `/cxs/groovyActions` or `/cxs/plugins/inoyu/accounts/search` */
  path: string;
  body?: unknown;
}

export interface UnomiCatalogPlugin {
  id: string;
  label?: string;
  healthPath?: string;
}

export type UnomiPluginPresenceMap = Record<string, boolean>;

export interface UnomiPluginsResponse {
  plugins: UnomiPluginPresenceMap;
  probedAt: string;
  /** How presence was resolved for this response */
  source?: 'catalog' | 'probes' | 'mixed';
}

const registry = new Map<string, UnomiPluginProbe>();

/** Register (or replace) a plugin probe. Safe to call at module load. */
export function registerUnomiPlugin(probe: UnomiPluginProbe): void {
  registry.set(probe.id, probe);
}

export function getRegisteredUnomiPlugins(): UnomiPluginProbe[] {
  return Array.from(registry.values());
}

/**
 * HTTP statuses that mean the JAX-RS resource is installed.
 * 404 / 405 typically mean the route is missing (bundle not deployed).
 */
function isPresentStatus(status: number): boolean {
  if (status === 404 || status === 405) {
    return false;
  }
  // 2xx / 3xx / 401 / 403 / 400 / 409 → endpoint exists
  return status >= 200 && status < 500;
}

async function unomiAuth(
  path: string,
  req?: NextApiRequest
): Promise<{ username: string; password: string } | undefined> {
  const config = getUnomiConfig(req);
  if (isUnomiV3() && hasV3Credentials(req)) {
    return (await getAuthCredentials(path, req)) ?? undefined;
  }
  return {
    username: config.systemUser,
    password: config.systemPassword,
  };
}

/**
 * Probe a single Unomi plugin endpoint using the same auth as CXS/plugins proxies.
 */
export async function probeUnomiPlugin(
  probe: UnomiPluginProbe,
  req?: NextApiRequest
): Promise<boolean> {
  const config = getUnomiConfig(req);
  const url = `${config.baseUrl}${probe.path}`;

  try {
    const auth = await unomiAuth(probe.path, req);
    const response = await axios.request({
      method: probe.method,
      url,
      data: probe.method === 'POST' ? probe.body ?? {} : undefined,
      headers: { 'Content-Type': 'application/json' },
      auth,
      timeout: 8_000,
      validateStatus: () => true,
    });

    return isPresentStatus(response.status);
  } catch (error) {
    console.warn(
      `[unomi-plugins] probe failed for ${probe.id} (${probe.path}):`,
      error instanceof Error ? error.message : error
    );
    return false;
  }
}

/**
 * Fetch the deployment catalog from Unomi when the catalog bundle is installed.
 * Returns null if the catalog endpoint is missing or unreachable.
 */
export async function fetchUnomiPluginCatalog(
  req?: NextApiRequest
): Promise<UnomiCatalogPlugin[] | null> {
  const config = getUnomiConfig(req);
  const path = '/cxs/plugins/inoyu/catalog';
  const url = `${config.baseUrl}${path}`;

  try {
    const auth = await unomiAuth(path, req);
    const response = await axios.get(url, {
      headers: { 'Content-Type': 'application/json' },
      auth,
      timeout: 8_000,
      validateStatus: () => true,
    });

    if (!isPresentStatus(response.status) || response.status === 404) {
      return null;
    }

    const plugins = response.data?.plugins;
    if (!Array.isArray(plugins)) {
      return null;
    }

    return plugins
      .filter((p): p is UnomiCatalogPlugin => p && typeof p.id === 'string' && p.id.length > 0)
      .map((p) => ({
        id: p.id,
        label: typeof p.label === 'string' ? p.label : undefined,
        healthPath: typeof p.healthPath === 'string' ? p.healthPath : undefined,
      }));
  } catch (error) {
    console.warn(
      '[unomi-plugins] catalog fetch failed:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * Resolve plugin presence from deployment.
 * 1. Prefer Unomi catalog (JAR deployed ⇒ listed ⇒ present).
 * 2. Merge registered static probes (core extensions / legacy fallbacks).
 * Catalog ids win when both exist.
 */
export async function probeAllUnomiPlugins(
  req?: NextApiRequest
): Promise<UnomiPluginPresenceMap> {
  const { plugins } = await probeAllUnomiPluginsWithMeta(req);
  return plugins;
}

/**
 * Richer probe used by the Pro API so clients can see discovery source.
 */
export async function probeAllUnomiPluginsWithMeta(
  req?: NextApiRequest
): Promise<Omit<UnomiPluginsResponse, 'probedAt'>> {
  const result: UnomiPluginPresenceMap = {};
  const catalog = await fetchUnomiPluginCatalog(req);

  if (catalog !== null) {
    // Listing in the catalog means the OSGi descriptor (hence the bundle) is deployed.
    for (const plugin of catalog) {
      result[plugin.id] = true;
    }
  }

  const probes = getRegisteredUnomiPlugins();
  const probeResults = await Promise.all(
    probes.map(async (probe) => {
      if (result[probe.id] === true) {
        return [probe.id, true] as const;
      }
      const present = await probeUnomiPlugin(probe, req);
      return [probe.id, present] as const;
    })
  );

  for (const [id, present] of probeResults) {
    if (result[id] !== true) {
      result[id] = present;
    }
  }

  const hasCatalog = catalog !== null;
  const hasProbes = probes.length > 0;
  let source: UnomiPluginsResponse['source'] = 'probes';
  if (hasCatalog && hasProbes) {
    source = 'mixed';
  } else if (hasCatalog) {
    source = 'catalog';
  }

  return { plugins: result, source };
}

// ─── Built-in core Unomi extension probes (not Inoyu commercial catalog) ─────

registerUnomiPlugin({
  id: 'groovyActions',
  label: 'Groovy Actions',
  method: 'GET',
  path: '/cxs/groovyActions/',
});
