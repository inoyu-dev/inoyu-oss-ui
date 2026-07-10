import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { usePropertyTypes, getInputTypeForPropertyType, getOptionsForPropertyType } from '@/hooks/usePropertyTypes';
import { PropertyType } from '@/services/client/UnomiClientService';

interface PropertyTypeSelectorProps {
  target: 'profiles' | 'sessions';
  value?: string;
  onChange: (propertyTypeId: string) => void;
  placeholder?: string;
  label?: string;
  showTypeInfo?: boolean;
  filterByTags?: string[];
}

/**
 * Component for selecting a property type in condition builders and forms.
 * Automatically fetches and displays available property types for the specified target.
 */
export function PropertyTypeSelector({
  target,
  value,
  onChange,
  placeholder = 'Select a property...',
  label,
  showTypeInfo = false,
  filterByTags
}: PropertyTypeSelectorProps) {
  const { propertyTypes, loading } = usePropertyTypes({
    target,
    tags: filterByTags,
    enabled: true
  });

  const selectedPropertyType = propertyTypes.find(pt => pt.metadata.id === value);

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder={loading ? 'Loading properties...' : placeholder} />
        </SelectTrigger>
        <SelectContent>
          {propertyTypes.map((propertyType) => (
            <SelectItem key={propertyType.metadata.id} value={propertyType.metadata.id}>
              <div className="flex items-center justify-between w-full">
                <div>
                  <div className="font-medium">{propertyType.metadata.name || propertyType.metadata.id}</div>
                  {propertyType.metadata.description && (
                    <div className="text-xs text-muted-foreground">
                      {propertyType.metadata.description}
                    </div>
                  )}
                </div>
                {showTypeInfo && propertyType.type && (
                  <div className="ml-2 text-xs text-muted-foreground">
                    ({propertyType.type})
                  </div>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedPropertyType && (
        <div className="text-xs text-muted-foreground space-y-1">
          <div>
            <strong>Type:</strong> {selectedPropertyType.type || 'string'}
            {selectedPropertyType.multivalued && ' (multi-valued)'}
            {(selectedPropertyType.protected || selectedPropertyType.protekted) && ' (protected)'}
          </div>
          {selectedPropertyType.metadata.description && (
            <div>{selectedPropertyType.metadata.description}</div>
          )}
          {getOptionsForPropertyType(selectedPropertyType).length > 0 && (
            <div>
              <strong>Available values:</strong>{' '}
              {getOptionsForPropertyType(selectedPropertyType).map(opt => opt.label).join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Component for displaying property type information
 */
export function PropertyTypeInfo({ propertyType }: { propertyType: PropertyType }) {
  const inputType = getInputTypeForPropertyType(propertyType);
  const options = getOptionsForPropertyType(propertyType);

  return (
    <div className="space-y-2 text-sm">
      <div>
        <strong>ID:</strong> {propertyType.metadata.id}
      </div>
      <div>
        <strong>Name:</strong> {propertyType.metadata.name}
      </div>
      {propertyType.metadata.description && (
        <div>
          <strong>Description:</strong> {propertyType.metadata.description}
        </div>
      )}
      <div>
        <strong>Type:</strong> {propertyType.type || 'string'}
      </div>
      <div>
        <strong>Input Type:</strong> {inputType}
      </div>
      {propertyType.defaultValue !== undefined && (
        <div>
          <strong>Default Value:</strong> {String(propertyType.defaultValue)}
        </div>
      )}
      {propertyType.multivalued && (
        <div className="text-info">Multi-valued property</div>
      )}
      {(propertyType.protected || propertyType.protekted) && (
        <div className="text-warning">Protected (read-only)</div>
      )}
      {options.length > 0 && (
        <div>
          <strong>Available Options:</strong>
          <ul className="list-disc list-inside ml-2">
            {options.map((opt, idx) => (
              <li key={idx}>{opt.label} ({opt.value})</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
