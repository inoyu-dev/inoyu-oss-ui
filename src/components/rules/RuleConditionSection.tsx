/**
 * RuleConditionSection — Visual condition list for the Rule builder.
 *
 * Provides a simplified visual interface for adding/editing rule conditions
 * using the internal RuleCondition data model.
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Filter } from 'lucide-react';
import type { RuleCondition } from './rule-types';
import { EVENT_TYPES } from './rule-types';

interface RuleConditionSectionProps {
  conditions: RuleCondition[];
  onAddCondition: () => void;
  onRemoveCondition: (conditionId: string) => void;
  onUpdateCondition: (conditionId: string, updates: Partial<RuleCondition>) => void;
}

const CONDITION_TYPES = [
  { value: 'eventCondition', label: 'Event Condition' },
  { value: 'profilePropertyCondition', label: 'Profile Property' },
  { value: 'sessionPropertyCondition', label: 'Session Property' },
  { value: 'booleanCondition', label: 'Boolean (AND/OR)' },
];

const OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'notEquals', label: 'Not Equals' },
  { value: 'greaterThan', label: 'Greater Than' },
  { value: 'lessThan', label: 'Less Than' },
  { value: 'contains', label: 'Contains' },
  { value: 'startsWith', label: 'Starts With' },
  { value: 'endsWith', label: 'Ends With' },
  { value: 'exists', label: 'Exists' },
  { value: 'missing', label: 'Missing' },
];

export function RuleConditionSection({
  conditions,
  onAddCondition,
  onRemoveCondition,
  onUpdateCondition,
}: RuleConditionSectionProps) {
  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Trigger Conditions
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onAddCondition}>
            <Plus className="h-3 w-3 mr-1" />
            Add Condition
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {conditions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No conditions defined. Add a condition to trigger this rule.
          </div>
        ) : (
          conditions.map((condition, index) => (
            <div key={condition.id}>
              {index > 0 && (
                <div className="text-center text-xs font-semibold text-primary py-1">AND</div>
              )}
              <Card className="border">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-2">
                      <div>
                        <Label className="text-xs">Type</Label>
                        <select
                          value={condition.type}
                          onChange={(e) =>
                            onUpdateCondition(condition.id, {
                              type: e.target.value as RuleCondition['type'],
                            })
                          }
                          className="mt-1 w-full px-2 py-1.5 text-xs border border-input rounded-md bg-background"
                        >
                          {CONDITION_TYPES.map((ct) => (
                            <option key={ct.value} value={ct.value}>
                              {ct.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Field</Label>
                        {condition.type === 'eventCondition' ? (
                          <select
                            value={condition.field}
                            onChange={(e) =>
                              onUpdateCondition(condition.id, { field: e.target.value })
                            }
                            className="mt-1 w-full px-2 py-1.5 text-xs border border-input rounded-md bg-background"
                          >
                            <option value="">Select event type...</option>
                            {EVENT_TYPES.map((et) => (
                              <option key={et.value} value={et.value}>
                                {et.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Input
                            value={condition.field}
                            onChange={(e) =>
                              onUpdateCondition(condition.id, { field: e.target.value })
                            }
                            placeholder="properties.email"
                            className="mt-1 text-xs h-7"
                          />
                        )}
                      </div>
                      <div>
                        <Label className="text-xs">Operator</Label>
                        <select
                          value={condition.operator}
                          onChange={(e) =>
                            onUpdateCondition(condition.id, { operator: e.target.value })
                          }
                          className="mt-1 w-full px-2 py-1.5 text-xs border border-input rounded-md bg-background"
                        >
                          {OPERATORS.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Value</Label>
                        <Input
                          value={String(condition.value)}
                          onChange={(e) =>
                            onUpdateCondition(condition.id, { value: e.target.value })
                          }
                          placeholder="value"
                          className="mt-1 text-xs h-7"
                        />
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveCondition(condition.id)}
                      className="h-7 w-7 p-0 text-destructive mt-5"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
