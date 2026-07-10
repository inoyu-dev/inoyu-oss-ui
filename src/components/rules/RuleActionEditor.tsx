/**
 * RuleActionEditor — Single action card: type display, remove button, and type-specific parameter fields.
 */

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { JsonEditor } from '@/components/json';
import { Settings, X } from 'lucide-react';
import type { RuleAction } from './rule-types';
import { ACTION_TEMPLATES } from './rule-types';

export interface RuleActionEditorProps {
  action: RuleAction;
  onUpdate: (updates: Partial<RuleAction>) => void;
  onRemove: () => void;
}

export function RuleActionEditor({ action, onUpdate, onRemove }: RuleActionEditorProps) {
  const template = Object.values(ACTION_TEMPLATES).find((t) => t.type === action.type);
  const IconComponent = template?.icon ?? Settings;

  const updateParams = (params: Record<string, unknown>) => {
    onUpdate({ parameters: { ...action.parameters, ...params } });
  };

  return (
    <Card className="p-4 mb-3 border-l-4 border-l-purple-500">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <IconComponent className="w-4 h-4 text-secondary" />
          <div>
            <span className="font-medium text-sm">{action.displayName}</span>
            {action.description != null && action.description !== '' && (
              <p className="text-xs text-muted-foreground">{action.description}</p>
            )}
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive-dark"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {action.type === 'setPropertyAction' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Property Name</Label>
              <Input
                placeholder="e.g., properties.segment"
                value={String(action.parameters.propertyName ?? '')}
                onChange={(e) => updateParams({ propertyName: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Property Value</Label>
              <Input
                placeholder="Value to set"
                value={String(action.parameters.propertyValue ?? '')}
                onChange={(e) => updateParams({ propertyValue: e.target.value })}
              />
            </div>
          </div>
        )}

        {action.type === 'copyPropertiesAction' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">From Property</Label>
              <Input
                placeholder="Source property"
                value={String(action.parameters.fromPropertyName ?? '')}
                onChange={(e) => updateParams({ fromPropertyName: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">To Property</Label>
              <Input
                placeholder="Destination property"
                value={String(action.parameters.toPropertyName ?? '')}
                onChange={(e) => updateParams({ toPropertyName: e.target.value })}
              />
            </div>
          </div>
        )}

        {action.type === 'sendEventAction' && (
          <>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Event Type</Label>
              <Input
                placeholder="e.g., segmentUpdated"
                value={String(action.parameters.eventType ?? '')}
                onChange={(e) => updateParams({ eventType: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Event Data (JSON)</Label>
              <JsonEditor
                value={JSON.stringify(action.parameters.eventData ?? {}, null, 2)}
                onChange={(val) => {
                  try {
                    const eventData = JSON.parse(val);
                    updateParams({ eventData });
                  } catch {
                    // Invalid JSON, keep editing
                  }
                }}
                height={120}
              />
            </div>
          </>
        )}

        {action.type === 'sendEmailAction' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Template ID</Label>
                <Input
                  placeholder="Email template ID"
                  value={String(action.parameters.templateId ?? '')}
                  onChange={(e) => updateParams({ templateId: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1">Subject</Label>
                <Input
                  placeholder="Email subject"
                  value={String(action.parameters.subject ?? '')}
                  onChange={(e) => updateParams({ subject: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={Boolean(action.parameters.personalizeContent ?? true)}
                onCheckedChange={(checked) => updateParams({ personalizeContent: checked })}
              />
              <Label className="text-sm">Personalize content</Label>
            </div>
          </>
        )}

        {action.type === 'webhookAction' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">URL</Label>
              <Input
                placeholder="https://api.example.com/webhook"
                value={String(action.parameters.url ?? '')}
                onChange={(e) => updateParams({ url: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Method</Label>
              <Select
                value={String(action.parameters.method ?? 'POST')}
                onValueChange={(value) => updateParams({ method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {action.type === 'updateSegmentAction' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Segment ID</Label>
              <Input
                placeholder="Segment ID"
                value={String(action.parameters.segmentId ?? '')}
                onChange={(e) => updateParams({ segmentId: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground mb-1">Action</Label>
              <Select
                value={String(action.parameters.action ?? 'add')}
                onValueChange={(value) => updateParams({ action: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="add">Add</SelectItem>
                  <SelectItem value="remove">Remove</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
