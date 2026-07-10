import React from 'react';
import { PropertyType } from '@/services/client/UnomiClientService';
import { PropertyDisplayType, PropertyDisplayMapping } from './propertyDisplayMappings';

/**
 * Maps Unomi property types to display types for event property rendering.
 * This bridges the gap between property type definitions and display configurations.
 */

/**
 * Maps a Unomi property type to a PropertyDisplayType.
 */
export function mapPropertyTypeToDisplayType(propertyType: PropertyType): PropertyDisplayType {
  const type = propertyType.type || propertyType.valueTypeId || 'string';

  switch (type.toLowerCase()) {
    case 'string':
      // Check if it's a special string type based on name/description
      const name = propertyType.metadata.name?.toLowerCase() || '';
      const description = propertyType.metadata.description?.toLowerCase() || '';
      
      if (name.includes('url') || description.includes('url')) {
        return 'url';
      }
      if (name.includes('email') || description.includes('email')) {
        return 'email';
      }
      if (name.includes('color') || description.includes('color')) {
        return 'color';
      }
      if (name.includes('code') || description.includes('code')) {
        return 'code';
      }
      return 'text';

    case 'integer':
    case 'long':
    case 'float':
      return 'number';

    case 'date':
      return 'date';

    case 'boolean':
      return 'boolean';

    case 'geoPoint':
      return 'location';

    case 'set':
      // For sets, we might want to show as badges or a list
      return 'badge';

    default:
      return 'text';
  }
}

/**
 * Creates PropertyDisplayMapping from a PropertyType.
 */
export function createDisplayMappingFromPropertyType(
  propertyType: PropertyType,
  propertyPath: string
): PropertyDisplayMapping {
  const displayType = mapPropertyTypeToDisplayType(propertyType);
  
  const mapping: PropertyDisplayMapping = {
    path: propertyPath,
    displayType,
    label: propertyType.metadata.name || propertyType.metadata.id
  };

  // Add format function for numeric types with ranges
  if (displayType === 'number' && propertyType.numericRanges && propertyType.numericRanges.length > 0) {
    mapping.format = (value) => {
      if (typeof value === 'number') {
        // Find which range the value falls into
        const range = propertyType.numericRanges?.find(r => {
          const from = r.from ?? -Infinity;
          const to = r.to ?? Infinity;
          return value >= from && value <= to;
        });
        
        if (range) {
          return `${new Intl.NumberFormat('en-US').format(value)} (${range.key})`;
        }
        return new Intl.NumberFormat('en-US').format(value);
      }
      return String(value);
    };
  }

  // Add format function for date types with ranges
  if (displayType === 'date' && propertyType.dateRanges && propertyType.dateRanges.length > 0) {
    mapping.format = (value) => {
      if (value instanceof Date) {
        const dateStr = value.toISOString();
        const range = propertyType.dateRanges?.find(r => {
          const from = r.from ? new Date(r.from) : new Date(-Infinity);
          const to = r.to ? new Date(r.to) : new Date(Infinity);
          const date = new Date(dateStr);
          return date >= from && date <= to;
        });
        
        if (range) {
          return `${value.toLocaleString()} (${range.key})`;
        }
        return value.toLocaleString();
      }
      if (typeof value === 'string') {
        try {
          const date = new Date(value);
          const range = propertyType.dateRanges?.find(r => {
            const from = r.from ? new Date(r.from) : new Date(-Infinity);
            const to = r.to ? new Date(r.to) : new Date(Infinity);
            return date >= from && date <= to;
          });
          
          if (range) {
            return `${date.toLocaleString()} (${range.key})`;
          }
          return date.toLocaleString();
        } catch {
          return String(value);
        }
      }
      return String(value);
    };
  }

  // Add format function for boolean types
  if (displayType === 'boolean') {
    mapping.format = (value) => {
      return value ? 'Yes' : 'No';
    };
  }

  // Add format function for multivalued properties
  if (propertyType.multivalued) {
    const originalFormat = mapping.format;
    mapping.format = (value): React.ReactNode => {
      if (Array.isArray(value)) {
        if (value.length === 0) return 'Empty';
        if (value.length === 1) {
          return originalFormat ? originalFormat(value[0]) : String(value[0]);
        }
        // Show as badges for multiple values using React.createElement
        return React.createElement(
          'div',
          { className: 'flex flex-wrap gap-1' },
          value.map((item: unknown, index: number) =>
            React.createElement(
              'span',
              {
                key: index,
                className: 'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info-light text-info-dark'
              },
              originalFormat ? String(originalFormat(item)) : String(item)
            )
          )
        );
      }
      return originalFormat ? originalFormat(value) : String(value);
    };
  }

  return mapping;
}

/**
 * Creates display mappings from an array of property types.
 * Useful for bulk conversion of property types to display mappings.
 */
export function createDisplayMappingsFromPropertyTypes(
  propertyTypes: PropertyType[],
  pathPrefix: string = 'properties'
): PropertyDisplayMapping[] {
  return propertyTypes.map(pt => {
    const propertyPath = `${pathPrefix}.${pt.metadata.id}`;
    return createDisplayMappingFromPropertyType(pt, propertyPath);
  });
}

/**
 * Finds a property type by property path/name.
 */
export function findPropertyTypeByPath(
  propertyTypes: PropertyType[],
  propertyPath: string
): PropertyType | null {
  // Extract property name from path (e.g., "properties.email" -> "email")
  const pathParts = propertyPath.split('.');
  const propertyName = pathParts[pathParts.length - 1];

  return propertyTypes.find(pt => 
    pt.metadata.id === propertyName || 
    pt.metadata.name === propertyName ||
    pt.metadata.id.toLowerCase() === propertyName.toLowerCase()
  ) || null;
}

/**
 * Gets display type for a property path using property types.
 * Falls back to schema-based detection if property type not found.
 */
export function getDisplayTypeFromPropertyType(
  propertyTypes: PropertyType[],
  propertyPath: string,
  fallbackType?: PropertyDisplayType
): PropertyDisplayType {
  const propertyType = findPropertyTypeByPath(propertyTypes, propertyPath);
  
  if (propertyType) {
    return mapPropertyTypeToDisplayType(propertyType);
  }
  
  return fallbackType || 'text';
}

/**
 * Merges property type mappings with custom mappings.
 * Property type mappings take precedence unless overridden by custom mappings.
 */
export function mergePropertyTypeMappings(
  propertyTypeMappings: PropertyDisplayMapping[],
  customMappings: PropertyDisplayMapping[]
): PropertyDisplayMapping[] {
  const merged = [...propertyTypeMappings];

  // Add custom mappings that override property type mappings
  customMappings.forEach(custom => {
    const index = merged.findIndex(m => m.path === custom.path);
    if (index >= 0) {
      // Replace existing mapping
      merged[index] = custom;
    } else {
      // Add new mapping
      merged.push(custom);
    }
  });

  return merged;
}
