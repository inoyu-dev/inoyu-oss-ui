import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Filter } from 'lucide-react';
import type { SegmentGroup, SegmentCondition } from './segment-types';
import { SegmentConditionGroup } from './SegmentConditionGroup';

export interface SegmentConditionBuilderProps {
  rootGroup: SegmentGroup;
  onRootGroupChange: (group: SegmentGroup | ((prev: SegmentGroup) => SegmentGroup)) => void;
  onAddCondition: (groupId: string, field?: string) => void;
  onRemoveCondition: (conditionId: string) => void;
  onUpdateCondition: (conditionId: string, updates: Partial<SegmentCondition>) => void;
}

export function SegmentConditionBuilder({
  rootGroup,
  onRootGroupChange,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
}: SegmentConditionBuilderProps) {
  const handleOperatorChange = (operator: 'and' | 'or') => {
    onRootGroupChange((prev) => ({ ...prev, operator }));
  };

  return (
    <Card className="flex-1 flex flex-col min-h-0">
      <CardHeader className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Conditions</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select onValueChange={(field) => onAddCondition('root', field)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Quick add..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="properties.email">Has Email</SelectItem>
                <SelectItem value="properties.totalOrders">Has Orders</SelectItem>
                <SelectItem value="properties.lastVisit">Recent Visitor</SelectItem>
                <SelectItem value="properties.country">From Country</SelectItem>
              </SelectContent>
            </Select>
            <Button
              onClick={() => onAddCondition('root')}
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Condition</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto min-h-0">
        {rootGroup.conditions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg">
            <Filter className="w-8 h-8 text-muted-text mb-2" />
            <p className="text-muted-foreground text-center">
              No conditions defined yet.
              <br />
              Add conditions to define who belongs to this segment.
            </p>
            <Button
              onClick={() => onAddCondition('root')}
              className="mt-3 flex items-center space-x-2"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Condition</span>
            </Button>
          </div>
        ) : (
          <SegmentConditionGroup
            group={rootGroup}
            onOperatorChange={handleOperatorChange}
            onRemoveCondition={onRemoveCondition}
            onUpdateCondition={onUpdateCondition}
          />
        )}
      </CardContent>
    </Card>
  );
}
