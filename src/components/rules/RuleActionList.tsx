/**
 * RuleActionList — Actions section: add (template selector + button), list of RuleActionEditor with separators.
 */

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Zap, ArrowRight } from 'lucide-react';
import type { RuleAction } from './rule-types';
import { ACTION_TEMPLATES } from './rule-types';
import { RuleActionEditor } from './RuleActionEditor';

export interface RuleActionListProps {
  actions: RuleAction[];
  onAddAction: (templateKey?: string) => void;
  onRemoveAction: (actionId: string) => void;
  onUpdateAction: (actionId: string, updates: Partial<RuleAction>) => void;
}

export function RuleActionList({
  actions,
  onAddAction,
  onRemoveAction,
  onUpdateAction,
}: RuleActionListProps) {
  return (
    <Card className="flex-1 flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Zap className="w-5 h-5" />
            <span>Actions to Perform</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Select onValueChange={(template) => onAddAction(template)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Quick add..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ACTION_TEMPLATES).map(([key, template]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <template.icon className="w-4 h-4" />
                      <span>{template.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => onAddAction()} className="flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Add Action</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {actions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-border rounded-lg">
            <Zap className="w-8 h-8 text-muted-text mb-2" />
            <p className="text-muted-foreground text-center">
              No actions defined yet.
              <br />
              Add actions to specify what happens when conditions are met.
            </p>
            <Button onClick={() => onAddAction()} variant="outline" className="mt-3">
              <Plus className="w-4 h-4 mr-1" />
              Add First Action
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {actions.map((action, index) => (
              <div key={action.id}>
                {index > 0 && (
                  <div className="flex justify-center my-2">
                    <ArrowRight className="w-4 h-4 text-muted-text" />
                  </div>
                )}
                <RuleActionEditor
                  action={action}
                  onUpdate={(updates) => onUpdateAction(action.id, updates)}
                  onRemove={() => onRemoveAction(action.id)}
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
