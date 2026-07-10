import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { SegmentGroup, SegmentCondition } from './segment-types';
import { SegmentConditionRow } from './SegmentConditionRow';

export interface SegmentConditionGroupProps {
  group: SegmentGroup;
  onOperatorChange: (operator: 'and' | 'or') => void;
  onRemoveCondition: (conditionId: string) => void;
  onUpdateCondition: (
    conditionId: string,
    updates: Partial<SegmentCondition>
  ) => void;
}

export function SegmentConditionGroup({
  group,
  onOperatorChange,
  onRemoveCondition,
  onUpdateCondition,
}: SegmentConditionGroupProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <span className="text-sm font-medium">Match profiles where</span>
        <Select
          value={group.operator}
          onValueChange={(value) => onOperatorChange(value as 'and' | 'or')}
        >
          <SelectTrigger className="w-[100px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="and">ALL</SelectItem>
            <SelectItem value="or">ANY</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm font-medium">of these conditions are true:</span>
      </div>

      {group.conditions.map((condition, index) => (
        <div key={condition.id}>
          {index > 0 && (
            <div className="flex justify-center my-2">
              <Badge variant="outline" className="px-3 py-1">
                {group.operator.toUpperCase()}
              </Badge>
            </div>
          )}
          <SegmentConditionRow
            condition={condition}
            onUpdate={onUpdateCondition}
            onRemove={onRemoveCondition}
          />
        </div>
      ))}
    </div>
  );
}
