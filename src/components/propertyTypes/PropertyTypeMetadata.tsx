import React from 'react';
import type { PropertyType } from '@/services/client/unomi-types';

export interface PropertyTypeMetadataProps {
  formData: Partial<PropertyType>;
  updateField: (field: string, value: unknown) => void;
  tagInput: string;
  setTagInput: (v: string) => void;
  systemTagInput: string;
  setSystemTagInput: (v: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onAddSystemTag: () => void;
  onRemoveSystemTag: (tag: string) => void;
}

/**
 * Metadata editor for property types (tags, system tags, scope).
 * Stub component — to be implemented.
 */
export default function PropertyTypeMetadata({ formData }: PropertyTypeMetadataProps) {
  return (
    <div className="space-y-4 text-sm text-muted-foreground">
      <p>Property type metadata editor — coming soon.</p>
      <pre className="bg-muted p-2 rounded text-xs overflow-auto max-h-40">
        {JSON.stringify(formData, null, 2)}
      </pre>
    </div>
  );
}
