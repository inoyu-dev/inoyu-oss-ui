import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Target } from 'lucide-react';

export interface SegmentBasicInfoProps {
  name: string;
  description: string;
  enabled: boolean;
  onNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onEnabledChange: (value: boolean) => void;
}

export function SegmentBasicInfo({
  name,
  description,
  enabled,
  onNameChange,
  onDescriptionChange,
  onEnabledChange,
}: SegmentBasicInfoProps) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="w-5 h-5" />
          <span>Segment Information</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="segmentName">Segment Name *</Label>
            <Input
              id="segmentName"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., High-Value Customers"
            />
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="segmentEnabled"
              checked={enabled}
              onCheckedChange={onEnabledChange}
            />
            <Label htmlFor="segmentEnabled">Enabled</Label>
          </div>
        </div>
        <div>
          <Label htmlFor="segmentDescription">Description</Label>
          <Textarea
            id="segmentDescription"
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            placeholder="Describe who belongs to this segment..."
            rows={2}
          />
        </div>
      </CardContent>
    </Card>
  );
}
