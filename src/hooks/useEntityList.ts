/**
 * useEntityList — Generic hook for entity list state, fetch, search, filter, expansion, and delete.
 *
 * Eliminates repeated patterns across GoalList, CampaignList, UserListList, and other list components.
 * Handles: loading/error state, fetch on mount, search by configurable fields, enabled/disabled filter,
 * expand/collapse by id, refresh, and optional delete with confirmation.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/** Options for configuring the entity list hook. */
export interface EntityListOptions<T extends { id: string }> {
  /** Async function to fetch the list of items */
  fetchFn: () => Promise<T[]>;
  /** Fields to search within. Default: ['name', 'description', 'id'] */
  searchFields?: (keyof T & string)[];
  /** Field that indicates enabled/disabled status. Default: 'enabled' */
  enabledField?: keyof T & string;
  /** Optional delete function. If omitted, handleDelete is a no-op */
  deleteFn?: (id: string) => Promise<void>;
  /** Confirmation message for delete. Default: translated "Are you sure you want to delete this item?" */
  deleteConfirmMessage?: string;
}

/** Return type of useEntityList. */
export interface EntityListReturn<T extends { id: string }> {
  /** All items (unfiltered) */
  items: T[];
  /** Items after search + filter */
  filteredItems: T[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string | null;
  /** Set error message (e.g. from detail fetch or edit) */
  setError: (message: string | null) => void;
  /** Clear the error */
  clearError: () => void;
  /** Search term */
  searchTerm: string;
  /** Update search term */
  setSearchTerm: (term: string) => void;
  /** Filter state: null = all, true = enabled, false = disabled */
  filterEnabled: boolean | null;
  /** Cycle through filter states: all → enabled → disabled → all */
  cycleFilter: () => void;
  /** Set of expanded item IDs */
  expandedItems: Set<string>;
  /** Toggle expansion for an item */
  toggleExpansion: (id: string) => void;
  /** Re-fetch items */
  refresh: () => Promise<void>;
  /** Delete an item (with confirm dialog). No-op if deleteFn was not provided */
  handleDelete: (id: string) => Promise<void>;
}

const DEFAULT_SEARCH_FIELDS = ['name', 'description', 'id'] as const;
const DEFAULT_ENABLED_FIELD = 'enabled';

/**
 * Generic hook for entity list: fetch, search, filter, expansion, and optional delete.
 *
 * @param options - Configuration for fetch, search fields, enabled field, and optional delete
 * @returns List state, filtered items, and handlers for search, filter, expansion, refresh, delete
 */
export function useEntityList<T extends { id: string }>(
  options: EntityListOptions<T>
): EntityListReturn<T> {
  const {
    fetchFn,
    searchFields = DEFAULT_SEARCH_FIELDS as unknown as (keyof T & string)[],
    enabledField = DEFAULT_ENABLED_FIELD as keyof T & string,
    deleteFn,
    deleteConfirmMessage,
  } = options;

  const { t } = useTranslation();
  const defaultConfirmMessage = t('Are you sure you want to delete this item?');

  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEnabled, setFilterEnabled] = useState<boolean | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchFn();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch items');
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const cycleFilter = useCallback(() => {
    setFilterEnabled((prev) =>
      prev === null ? true : prev === true ? false : null
    );
  }, []);

  const toggleExpansion = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!deleteFn) {
        return;
      }
      const message = deleteConfirmMessage ?? defaultConfirmMessage;
      if (!confirm(message)) {
        return;
      }
      try {
        await deleteFn(id);
        await refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete');
        console.error('Error deleting item:', err);
      }
    },
    [deleteFn, deleteConfirmMessage, defaultConfirmMessage, refresh]
  );

  const filteredItems = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return items.filter((item) => {
      const matchesSearch = searchFields.some((field) => {
        const value = (item as Record<string, unknown>)[field];
        return String(value ?? '').toLowerCase().includes(term);
      });
      const enabledValue = (item as Record<string, unknown>)[enabledField];
      const matchesFilter =
        filterEnabled === null || (enabledValue === filterEnabled);
      return matchesSearch && matchesFilter;
    });
  }, [items, searchTerm, filterEnabled, searchFields, enabledField]);

  return {
    items,
    filteredItems,
    loading,
    error,
    setError,
    clearError,
    searchTerm,
    setSearchTerm,
    filterEnabled,
    cycleFilter,
    expandedItems,
    toggleExpansion,
    refresh,
    handleDelete,
  };
}
