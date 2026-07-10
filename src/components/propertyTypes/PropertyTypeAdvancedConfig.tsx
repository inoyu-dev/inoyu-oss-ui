import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { PropertyType } from '@/services/client/UnomiClientService';
import { MERGE_STRATEGIES, type UpdateFieldFn } from './property-type-types';

interface PropertyTypeAdvancedConfigProps {
  formData: Partial<PropertyType>;
  updateField: UpdateFieldFn;
  onAddAutomaticMapping: () => void;
  onUpdateAutomaticMapping: (index: number, value: string) => void;
  onRemoveAutomaticMapping: (index: number) => void;
}

const PropertyTypeAdvancedConfig: React.FC<PropertyTypeAdvancedConfigProps> = ({
  formData,
  updateField,
  onAddAutomaticMapping,
  onUpdateAutomaticMapping,
  onRemoveAutomaticMapping,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="mergeStrategy">Merge Strategy</Label>
        <select
          id="mergeStrategy"
          value={formData.mergeStrategy || 'defaultMergeStrategy'}
          onChange={(e) => updateField('mergeStrategy', e.target.value)}
          className="w-full mt-1 px-3 py-2 border rounded-md"
        >
          {MERGE_STRATEGIES.map((strategy) => (
            <option key={strategy} value={strategy}>
              {strategy}
            </option>
          ))}
        </select>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Automatic Mappings From</Label>
          <Button type="button" onClick={onAddAutomaticMapping} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Mapping
          </Button>
        </div>
        <div className="space-y-2">
          {formData.automaticMappingsFrom?.map((mapping, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                placeholder="Property name"
                value={mapping}
                onChange={(e) => onUpdateAutomaticMapping(index, e.target.value)}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => onRemoveAutomaticMapping(index)}
                size="sm"
                variant="outline"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PropertyTypeAdvancedConfig;
