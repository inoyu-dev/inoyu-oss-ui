import { useState, useEffect, useCallback } from 'react';
import {
  getAllPropertyTypes,
  getPropertyTypesByTarget,
  getPropertyTypesByTags,
  PropertyType
} from '@/services/client/UnomiClientService';

/**
 * Hook to fetch and manage property types for use in UIs
 * Useful for condition builders, form generators, and property selectors
 */
export function usePropertyTypes(options?: {
  target?: 'profiles' | 'sessions' | 'all';
  tags?: string[];
  enabled?: boolean;
}) {
  const { target = 'all', tags, enabled = true } = options || {};
  
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPropertyTypes = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      let data: PropertyType[] = [];
      
      if (target === 'all') {
        const allTypes = await getAllPropertyTypes();
        data = [
          ...(allTypes.profiles || []),
          ...(allTypes.sessions || [])
        ];
      } else {
        data = await getPropertyTypesByTarget(target);
      }
      
      // Filter by tags if provided
      if (tags && tags.length > 0) {
        const taggedTypes = await getPropertyTypesByTags(tags);
        const dataIds = new Set(data.map(pt => pt.metadata.id));
        data = taggedTypes.filter(pt => dataIds.has(pt.metadata.id));
      }
      
      setPropertyTypes(data);
    } catch (err) {
      console.error('Error fetching property types:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch property types');
    } finally {
      setLoading(false);
    }
  }, [target, tags, enabled]);

  useEffect(() => {
    fetchPropertyTypes();
  }, [fetchPropertyTypes]);

  return {
    propertyTypes,
    loading,
    error,
    refetch: fetchPropertyTypes
  };
}

/**
 * Get property type by ID from a list of property types
 */
export function getPropertyTypeById(
  propertyTypes: PropertyType[],
  id: string
): PropertyType | undefined {
  return propertyTypes.find(pt => pt.metadata.id === id);
}

/**
 * Get property types grouped by target
 */
export function groupPropertyTypesByTarget(
  propertyTypes: PropertyType[]
): { profiles: PropertyType[]; sessions: PropertyType[]; other: PropertyType[] } {
  const grouped = {
    profiles: [] as PropertyType[],
    sessions: [] as PropertyType[],
    other: [] as PropertyType[]
  };

  propertyTypes.forEach(pt => {
    if (pt.target === 'profiles') {
      grouped.profiles.push(pt);
    } else if (pt.target === 'sessions') {
      grouped.sessions.push(pt);
    } else {
      grouped.other.push(pt);
    }
  });

  return grouped;
}

/**
 * Get property types grouped by tag
 */
export function groupPropertyTypesByTag(
  propertyTypes: PropertyType[]
): Record<string, PropertyType[]> {
  const grouped: Record<string, PropertyType[]> = {};

  propertyTypes.forEach(pt => {
    const tags = pt.metadata.tags || [];
    if (tags.length === 0) {
      if (!grouped['_untagged']) {
        grouped['_untagged'] = [];
      }
      grouped['_untagged'].push(pt);
    } else {
      tags.forEach(tag => {
        if (!grouped[tag]) {
          grouped[tag] = [];
        }
        grouped[tag].push(pt);
      });
    }
  });

  return grouped;
}

/**
 * Get property types sorted by rank (for display order)
 */
export function sortPropertyTypesByRank(
  propertyTypes: PropertyType[]
): PropertyType[] {
  return [...propertyTypes].sort((a, b) => {
    const rankA = typeof a.rank === 'number' ? a.rank : typeof a.rank === 'string' ? parseFloat(a.rank) : 999;
    const rankB = typeof b.rank === 'number' ? b.rank : typeof b.rank === 'string' ? parseFloat(b.rank) : 999;
    return rankA - rankB;
  });
}

/**
 * Get input type for a property type (for form generation)
 */
export function getInputTypeForPropertyType(propertyType: PropertyType): string {
  const valueType = propertyType.type || propertyType.valueTypeId;
  
  if (propertyType.multivalued) {
    return 'multiselect';
  }
  
  switch (valueType) {
    case 'integer':
    case 'long':
      return 'number';
    case 'float':
      return 'number';
    case 'date':
      return 'date';
    case 'boolean':
      return 'checkbox';
    case 'email':
      return 'email';
    case 'set':
      return 'object';
    default:
      return 'text';
  }
}

/**
 * Get options for select/multiselect based on property type ranges
 */
export function getOptionsForPropertyType(propertyType: PropertyType): Array<{ value: string; label: string }> {
  const options: Array<{ value: string; label: string }> = [];
  
  if (propertyType.numericRanges && propertyType.numericRanges.length > 0) {
    propertyType.numericRanges.forEach(range => {
      let label = range.key;
      if (range.from !== undefined && range.to !== undefined) {
        label = `${range.from} - ${range.to}`;
      } else if (range.from !== undefined) {
        label = `${range.from}+`;
      } else if (range.to !== undefined) {
        label = `up to ${range.to}`;
      }
      options.push({ value: range.key, label });
    });
  }
  
  if (propertyType.dateRanges && propertyType.dateRanges.length > 0) {
    propertyType.dateRanges.forEach(range => {
      let label = range.key;
      if (range.from && range.to) {
        label = `${range.from} - ${range.to}`;
      } else if (range.from) {
        label = `from ${range.from}`;
      } else if (range.to) {
        label = `until ${range.to}`;
      }
      options.push({ value: range.key, label });
    });
  }
  
  return options;
}

/**
 * Check if a property type is editable (not protected)
 */
export function isPropertyTypeEditable(propertyType: PropertyType): boolean {
  return !(propertyType.protected || propertyType.protekted || propertyType.metadata.readOnly);
}

/**
 * Get display name for a property type
 */
export function getPropertyTypeDisplayName(propertyType: PropertyType): string {
  return propertyType.metadata.name || propertyType.metadata.id;
}
