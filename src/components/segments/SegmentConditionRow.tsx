import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import type { SegmentCondition, SegmentConditionOperator } from './segment-types';
import { FIELD_CATEGORIES, OPERATORS, getFieldType } from './segment-types';

interface SegmentConditionRowProps {
  condition: SegmentCondition;
  onUpdate: (conditionId: string, updates: Partial<SegmentCondition>) => void;
  onRemove: (conditionId: string) => void;
}

export function SegmentConditionRow({ condition, onUpdate, onRemove }: SegmentConditionRowProps) {
  const fieldType = getFieldType(condition.field);
  const operators = OPERATORS[fieldType] || OPERATORS.string;

  return (
    <div className="flex items-center gap-2 p-2 border rounded-md bg-card">
      {/* Field selector */}
      <Select
        value={condition.field}
        onValueChange={(value) => onUpdate(condition.id, { field: value })}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select field..." />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(FIELD_CATEGORIES).map(([key, cat]) => (
            <React.Fragment key={key}>
              {cat.fields.map((field) => (
                <SelectItem key={field.key} value={field.key}>
                  {field.label}
                </SelectItem>
              ))}
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>

      {/* Operator selector */}
      <Select
        value={condition.operator}
        onValueChange={(value) =>
          onUpdate(condition.id, { operator: value as SegmentConditionOperator })
        }
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Operator..." />
        </SelectTrigger>
        <SelectContent>
          {operators.map((op) => (
            <SelectItem key={op.value} value={op.value}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value input (skip for exists/notExists) */}
      {condition.operator !== 'exists' && condition.operator !== 'notExists' && (
        <Input
          className="flex-1"
          placeholder="Value..."
          value={typeof condition.value === 'string' ? condition.value : String(condition.value ?? '')}
          onChange={(e) => onUpdate(condition.id, { value: e.target.value })}
        />
      )}

      {/* Remove button */}
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"
        onClick={() => onRemove(condition.id)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
}
