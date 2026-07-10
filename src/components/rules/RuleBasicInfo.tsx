/**
 * RuleBasicInfo — Basic rule metadata fields (name, description, priority, enabled).
 * Presentational; state is controlled via props and callbacks.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Settings } from 'lucide-react';

export interface RuleBasicInfoProps {
  name: string;
  description: string;
  priority: number;
  enabled: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onPriorityChange: (value: number) => void;
  onEnabledChange: (value: boolean) => void;
}

export function RuleBasicInfo({
  name,
  description,
  priority,
  enabled,
  onNameChange,
  onDescriptionChange,
  onPriorityChange,
  onEnabledChange,
}: RuleBasicInfoProps) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="w-5 h-5" />
          <span>Rule Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="ruleName">Rule Name *</Label>
            <Input
              id="ruleName"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., Welcome Email for New Users"
            />
          </div>
          <div>
            <Label htmlFor="rulePriority">Priority</Label>
            <Input
              id="rulePriority"
              type="number"
              min={1}
              max={100}
              value={priority}
              onChange={(e) => onPriorityChange(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-3">
            <Label htmlFor="ruleDescription">Description</Label>
            <Textarea
              id="ruleDescription"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe what this rule does..."
              rows={2}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="ruleEnabled"
              checked={enabled}
              onCheckedChange={onEnabledChange}
            />
            <Label htmlFor="ruleEnabled">Enabled</Label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
