/**
 * SegmentBuilder — Open-source JSON/Monaco editor for Unomi segments.
 *
 * Visual form builders live in Inoyu Pro UI and are registered via
 * PluginRegistry ('segments/SegmentBuilder').
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Save, Users, Code } from 'lucide-react';
import { UnomiSegment, createSegment, updateSegment } from '@/services/client/UnomiClientService';
import { SegmentBasicInfo } from './SegmentBasicInfo';
import { ConditionBuilder, type ConditionBuilderProps } from '@/components/conditions';
import { useRegisteredComponent } from '@/plugins/useRegisteredComponent';
import type { Condition } from '@/services/shared/types';

export interface SegmentBuilderProps {
  segment?: UnomiSegment;
  isOpen: boolean;
  onClose: () => void;
  onSave: (segment: UnomiSegment) => void;
}

export default function SegmentBuilder({ segment, isOpen, onClose, onSave }: SegmentBuilderProps) {
  const { t } = useTranslation('common');
  const ResolvedConditionBuilder = useRegisteredComponent<ConditionBuilderProps>(
    'conditions/ConditionBuilder',
    ConditionBuilder
  );
  const [segmentName, setSegmentName] = useState(segment?.metadata?.name || '');
  const [segmentDescription, setSegmentDescription] = useState(
    segment?.metadata?.description || ''
  );
  const [segmentEnabled, setSegmentEnabled] = useState(segment?.metadata?.enabled ?? true);
  const [rawCondition, setRawCondition] = useState<Condition | undefined>(segment?.condition);

  useEffect(() => {
    if (segment) {
      setSegmentName(segment.metadata?.name || '');
      setSegmentDescription(segment.metadata?.description || '');
      setSegmentEnabled(segment.metadata?.enabled ?? true);
      setRawCondition(segment.condition);
    } else {
      setSegmentName('');
      setSegmentDescription('');
      setSegmentEnabled(true);
      setRawCondition(undefined);
    }
  }, [segment, isOpen]);

  const handleSave = async () => {
    if (!segmentName.trim()) {
      toast({
        title: t('Missing Name'),
        description: t('Please enter a segment name.'),
        variant: 'destructive',
      });
      return;
    }

    if (!rawCondition) {
      toast({
        title: t('No Conditions'),
        description: t('Please add at least one condition to the segment.'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const segmentData = {
        metadata: {
          id: segment?.metadata?.id || `segment-${Date.now()}`,
          name: segmentName,
          description: segmentDescription,
          enabled: segmentEnabled,
          scope: 'systemScope',
        },
        condition: rawCondition,
      };

      let savedSegment: UnomiSegment;
      if (segment) {
        savedSegment = await updateSegment(segment.metadata.id, segmentData);
      } else {
        savedSegment = await createSegment(segmentData);
      }

      toast({
        title: t('Segment Saved'),
        description: t('Segment saved successfully', { name: segmentName }),
      });

      onSave(savedSegment);
      onClose();
    } catch {
      toast({
        title: t('Save Failed'),
        description: t('Could not save the segment.'),
        variant: 'destructive',
      });
    }
  };

  const handleConditionChange = useCallback((condition: Condition) => {
    setRawCondition(condition);
  }, []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col"
        data-testid="segment-builder-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>{segment ? t('Edit Segment') : t('Create New Segment')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          <SegmentBasicInfo
            name={segmentName}
            description={segmentDescription}
            enabled={segmentEnabled}
            onNameChange={setSegmentName}
            onDescriptionChange={setSegmentDescription}
            onEnabledChange={setSegmentEnabled}
          />

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="w-4 h-4" />
                {t('Condition JSON')}
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                {t('Edit the raw Unomi condition with JSON editing.')}
              </p>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ResolvedConditionBuilder
                value={rawCondition}
                onChange={handleConditionChange}
                systemTag="profileCondition"
                height={300}
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!segmentName.trim() || !rawCondition}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{segment ? t('Update Segment') : t('Create Segment')}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
