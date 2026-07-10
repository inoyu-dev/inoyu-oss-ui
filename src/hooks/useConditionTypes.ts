/**
 * useConditionTypes — React hook for fetching Unomi condition types.
 *
 * Provides condition type discovery from the Unomi API with caching,
 * loading states, and error handling. Supports plugin replacement
 * via the ServiceRegistry — if a plugin registers a 'ConditionTypeService',
 * that service is used instead of the default.
 *
 * Usage:
 *   const { types, loading, error, refresh } = useConditionTypes();
 *   const { types: profileTypes } = useConditionTypes({ systemTag: 'profileCondition' });
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ConditionTypeService,
  conditionTypeService,
  type NormalizedConditionType,
} from '@/services/client/ConditionTypeService';
import { useServiceRegistry } from '@/plugins/useServiceRegistry';

interface UseConditionTypesOptions {
  /** Filter by system tag (e.g. 'profileCondition', 'sessionCondition', 'eventCondition') */
  systemTag?: string;
  /** Filter by tag */
  tag?: string;
  /** Skip initial fetch */
  skip?: boolean;
}

interface UseConditionTypesResult {
  types: NormalizedConditionType[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useConditionTypes(
  options: UseConditionTypesOptions = {}
): UseConditionTypesResult {
  const { systemTag, tag, skip = false } = options;
  const [types, setTypes] = useState<NormalizedConditionType[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  // Resolve service from plugin registry (or fall back to default singleton)
  const { getService } = useServiceRegistry();
  const service = useMemo(() => {
    const ServiceClass = getService<ConditionTypeService>('ConditionTypeService', ConditionTypeService);
    if (ServiceClass && ServiceClass !== ConditionTypeService) {
      return new ServiceClass();
    }
    return conditionTypeService;
  }, [getService]);

  const fetch = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        let result: NormalizedConditionType[];

        if (systemTag) {
          result = await service.getBySystemTag(systemTag);
        } else if (tag) {
          result = await service.getByTag(tag);
        } else {
          result = await service.getAll(forceRefresh);
        }

        setTypes(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load condition types'
        );
      } finally {
        setLoading(false);
      }
    },
    [systemTag, tag, service]
  );

  useEffect(() => {
    if (!skip) {
      fetch();
    }
  }, [fetch, skip]);

  const refresh = useCallback(() => {
    service.clearCache();
    fetch(true);
  }, [fetch, service]);

  return { types, loading, error, refresh };
}
