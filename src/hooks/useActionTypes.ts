/**
 * useActionTypes — React hook for fetching Unomi action types.
 *
 * Provides action type discovery from the Unomi API with caching,
 * loading states, and error handling. Supports plugin replacement
 * via the ServiceRegistry.
 *
 * Usage:
 *   const { types, loading, error, refresh } = useActionTypes();
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ActionTypeService,
  actionTypeService,
  type NormalizedActionType,
} from '@/services/client/ActionTypeService';
import { useServiceRegistry } from '@/plugins/useServiceRegistry';

interface UseActionTypesOptions {
  /** Filter by tag */
  tag?: string;
  /** Skip initial fetch */
  skip?: boolean;
}

interface UseActionTypesResult {
  types: NormalizedActionType[];
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

export function useActionTypes(
  options: UseActionTypesOptions = {}
): UseActionTypesResult {
  const { tag, skip = false } = options;
  const [types, setTypes] = useState<NormalizedActionType[]>([]);
  const [loading, setLoading] = useState(!skip);
  const [error, setError] = useState<string | null>(null);

  // Resolve service from plugin registry (or fall back to default singleton)
  const { getService } = useServiceRegistry();
  const service = useMemo(() => {
    const ServiceClass = getService<ActionTypeService>('ActionTypeService', ActionTypeService);
    if (ServiceClass && ServiceClass !== ActionTypeService) {
      return new ServiceClass();
    }
    return actionTypeService;
  }, [getService]);

  const fetch = useCallback(
    async (forceRefresh = false) => {
      try {
        setLoading(true);
        setError(null);

        let result: NormalizedActionType[];

        if (tag) {
          result = await service.getByTag(tag);
        } else {
          result = await service.getAll(forceRefresh);
        }

        setTypes(result);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load action types'
        );
      } finally {
        setLoading(false);
      }
    },
    [tag, service]
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
