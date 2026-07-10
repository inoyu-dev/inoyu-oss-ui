/**
 * Shared types and constants for property type components.
 * Re-exports from services and defines editor-specific constants.
 */

import type { PropertyType, NumericRange, DateRange, IpRange } from '@/services/client/UnomiClientService';

export type { PropertyType, NumericRange, DateRange, IpRange };

export const VALUE_TYPES = [
  'string',
  'integer',
  'long',
  'float',
  'date',
  'boolean',
  'email',
  'geoPoint',
  'set',
] as const;

export const MERGE_STRATEGIES = [
  'defaultMergeStrategy',
  'mostRecentMergeStrategy',
  'oldestMergeStrategy',
  'addMergeStrategy',
  'nonEmptyMergeStrategy',
] as const;

export interface PropertyTypeEditorProps {
  propertyType?: PropertyType;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export type UpdateFieldFn = (field: string, value: unknown) => void;
