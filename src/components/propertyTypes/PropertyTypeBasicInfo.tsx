import React from 'react';
import type { PropertyType } from '@/services/client/unomi-types';

export interface PropertyTypeBasicInfoProps {
  formData: Partial<PropertyType>;
  updateField: (field: string, value: unknown) => void;
  isEditing: boolean;
}

/**
 * Basic information editor for property types (name, description, value type).
 * Stub component — to be implemented.
 */
export default function PropertyTypeBasicInfo({ formData }: PropertyTypeBasicInfoProps) {
  return (
    <div className="space-y-4 text-sm text-muted-foreground">
      <p>Property type basic info editor — coming soon.</p>
      <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
        {JSON.stringify(formData, null, 2)}
      </pre>
    </div>
  );
}
