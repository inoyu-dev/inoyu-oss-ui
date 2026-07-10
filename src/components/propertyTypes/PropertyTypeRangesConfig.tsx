import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import type { PropertyType, NumericRange, DateRange, IpRange } from '@/services/client/UnomiClientService';

interface PropertyTypeRangesConfigProps {
  formData: Partial<PropertyType>;
  onAddNumericRange: () => void;
  onUpdateNumericRange: (index: number, field: keyof NumericRange, value: string | number | undefined) => void;
  onRemoveNumericRange: (index: number) => void;
  onAddDateRange: () => void;
  onUpdateDateRange: (index: number, field: keyof DateRange, value: string | undefined) => void;
  onRemoveDateRange: (index: number) => void;
  onAddIpRange: () => void;
  onUpdateIpRange: (index: number, field: keyof IpRange, value: string | undefined) => void;
  onRemoveIpRange: (index: number) => void;
}

const PropertyTypeRangesConfig: React.FC<PropertyTypeRangesConfigProps> = ({
  formData,
  onAddNumericRange,
  onUpdateNumericRange,
  onRemoveNumericRange,
  onAddDateRange,
  onUpdateDateRange,
  onRemoveDateRange,
  onAddIpRange,
  onUpdateIpRange,
  onRemoveIpRange,
}) => {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Numeric Ranges</Label>
          <Button type="button" onClick={onAddNumericRange} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Range
          </Button>
        </div>
        <div className="space-y-2">
          {formData.numericRanges?.map((range, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 border rounded">
              <Input
                placeholder="Key"
                value={range.key}
                onChange={(e) => onUpdateNumericRange(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="From"
                value={range.from ?? ''}
                onChange={(e) =>
                  onUpdateNumericRange(
                    index,
                    'from',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="To"
                value={range.to ?? ''}
                onChange={(e) =>
                  onUpdateNumericRange(
                    index,
                    'to',
                    e.target.value ? parseFloat(e.target.value) : undefined
                  )
                }
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => onRemoveNumericRange(index)}
                size="sm"
                variant="outline"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>Date Ranges</Label>
          <Button type="button" onClick={onAddDateRange} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Range
          </Button>
        </div>
        <div className="space-y-2">
          {formData.dateRanges?.map((range, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 border rounded">
              <Input
                placeholder="Key"
                value={range.key}
                onChange={(e) => onUpdateDateRange(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                type="date"
                placeholder="From"
                value={range.from || ''}
                onChange={(e) => onUpdateDateRange(index, 'from', e.target.value || undefined)}
                className="flex-1"
              />
              <Input
                type="date"
                placeholder="To"
                value={range.to || ''}
                onChange={(e) => onUpdateDateRange(index, 'to', e.target.value || undefined)}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => onRemoveDateRange(index)}
                size="sm"
                variant="outline"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <Label>IP Ranges</Label>
          <Button type="button" onClick={onAddIpRange} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Range
          </Button>
        </div>
        <div className="space-y-2">
          {formData.ipRanges?.map((range, index) => (
            <div key={index} className="flex items-center space-x-2 p-2 border rounded">
              <Input
                placeholder="Key"
                value={range.key}
                onChange={(e) => onUpdateIpRange(index, 'key', e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="From IP"
                value={range.from || ''}
                onChange={(e) => onUpdateIpRange(index, 'from', e.target.value || undefined)}
                className="flex-1"
              />
              <Input
                placeholder="To IP"
                value={range.to || ''}
                onChange={(e) => onUpdateIpRange(index, 'to', e.target.value || undefined)}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={() => onRemoveIpRange(index)}
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

export default PropertyTypeRangesConfig;
