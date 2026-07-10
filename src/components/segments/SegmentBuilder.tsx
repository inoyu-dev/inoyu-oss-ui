import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { Save, Eye, Users, Code, Sparkles, RefreshCw, CheckCircle2, Activity } from 'lucide-react';
import { UnomiSegment, createSegment, updateSegment } from '@/services/client/UnomiClientService';
import type { SegmentCondition, SegmentGroup } from './segment-types';
import { getFieldLabel } from './segment-types';
import { SegmentBasicInfo } from './SegmentBasicInfo';
import { SegmentConditionBuilder } from './SegmentConditionBuilder';
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
  const ResolvedConditionBuilder = useRegisteredComponent<ConditionBuilderProps>('conditions/ConditionBuilder', ConditionBuilder);
  const [segmentName, setSegmentName] = useState(segment?.metadata?.name || '');
  const [segmentDescription, setSegmentDescription] = useState(
    segment?.metadata?.description || ''
  );
  const [segmentEnabled, setSegmentEnabled] = useState(segment?.metadata?.enabled ?? true);
  const [rootGroup, setRootGroup] = useState<SegmentGroup>({
    id: 'root',
    name: 'Root',
    operator: 'and',
    conditions: [],
  });
  /** Raw Unomi condition — used in Advanced/JSON tab for direct editing */
  const [rawCondition, setRawCondition] = useState<Condition | undefined>(segment?.condition);
  /** Track which tab was last edited so save uses the right source */
  const [lastEditedTab, setLastEditedTab] = useState<'builder' | 'advanced'>('builder');
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('builder');

  // Initialize from existing segment
  useEffect(() => {
    if (segment) {
      setSegmentName(segment.metadata?.name || '');
      setSegmentDescription(segment.metadata?.description || '');
      setSegmentEnabled(segment.metadata?.enabled ?? true);
      setRawCondition(segment.condition);

      if (segment.condition) {
        setRootGroup({
          id: 'root',
          name: 'Root',
          operator: 'and',
          conditions: [
            {
              id: 'condition-1',
              type: 'profileProperty',
              field: 'properties.email',
              operator: 'exists',
              value: '',
              displayName: 'Has Email',
            },
          ],
        });
      }
    }
  }, [segment]);

  const addCondition = useCallback((groupId: string, field?: string) => {
    const newCondition: SegmentCondition = {
      id: `condition-${Date.now()}`,
      type: 'profileProperty',
      field: field || '',
      operator: 'equals',
      value: '',
      displayName: field ? getFieldLabel(field) : '',
    };

    setLastEditedTab('builder');
    setRootGroup((prev) => ({
      ...prev,
      conditions: [...prev.conditions, newCondition],
    }));
  }, []);

  const removeCondition = useCallback((conditionId: string) => {
    setRootGroup((prev) => ({
      ...prev,
      conditions: prev.conditions.filter((c) => c.id !== conditionId),
    }));
  }, []);

  const updateCondition = useCallback((conditionId: string, updates: Partial<SegmentCondition>) => {
    setRootGroup((prev) => ({
      ...prev,
      conditions: prev.conditions.map((c) =>
        c.id === conditionId ? { ...c, ...updates } : c
      ),
    }));
  }, []);

  const previewSegment = async () => {
    if (rootGroup.conditions.length === 0) {
      toast({
        title: t('No Conditions'),
        description: t('Add at least one condition to preview the segment.'),
        variant: 'destructive',
      });
      return;
    }

    setIsPreviewLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const simulatedCount = Math.floor(Math.random() * 10000) + 100;
      setPreviewCount(simulatedCount);

      toast({
        title: t('Preview Generated'),
        description: t('Found profiles matching segment', { total: simulatedCount.toLocaleString() }),
      });
    } catch {
      toast({
        title: t('Preview Failed'),
        description: t('Could not generate segment preview.'),
        variant: 'destructive',
      });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const generateJson = useCallback(() => {
    const unomiCondition = {
      type: 'booleanCondition',
      parameterValues: {
        operator: rootGroup.operator.toUpperCase(),
        subConditions: rootGroup.conditions.map((condition) => ({
          type: condition.type + 'Condition',
          parameterValues: {
            propertyName: condition.field,
            comparisonOperator: condition.operator,
            propertyValue: condition.value,
          },
        })),
      },
    };

    return JSON.stringify(unomiCondition, null, 2);
  }, [rootGroup]);

  // Sync: when switching to advanced tab, push visual builder state into rawCondition
  useEffect(() => {
    if (activeTab === 'json' && lastEditedTab === 'builder' && rootGroup.conditions.length > 0) {
      try {
        setRawCondition(JSON.parse(generateJson()));
      } catch {
        // ignore parse errors
      }
    }
  }, [activeTab, lastEditedTab, generateJson, rootGroup.conditions.length]);

  const handleRawConditionChange = useCallback((condition: Condition) => {
    setLastEditedTab('advanced');
    setRawCondition(condition);
  }, []);

  const handleSave = async () => {
    if (!segmentName.trim()) {
      toast({
        title: t('Missing Name'),
        description: t('Please enter a segment name.'),
        variant: 'destructive',
      });
      return;
    }

    // When using advanced/JSON tab, rawCondition is the source of truth
    const useRawCondition = lastEditedTab === 'advanced' && rawCondition;

    if (!useRawCondition && rootGroup.conditions.length === 0) {
      toast({
        title: t('No Conditions'),
        description: t('Please add at least one condition to the segment.'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const condition = useRawCondition ? rawCondition : JSON.parse(generateJson());
      const segmentData = {
        metadata: {
          id: segment?.metadata?.id || `segment-${Date.now()}`,
          name: segmentName,
          description: segmentDescription,
          enabled: segmentEnabled,
          scope: 'systemScope',
        },
        condition,
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl max-h-[90vh] flex flex-col"
        data-testid="segment-builder-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>{segment ? t('Edit Segment') : t('Create New Segment')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 flex flex-col min-h-0"
          >
            <TabsList className="grid w-full grid-cols-3 flex-shrink-0">
              <TabsTrigger value="builder" className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>{t('Visual Builder')}</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>{t('Preview')}</span>
                {previewCount !== null && (
                  <Badge variant="secondary" className="ml-1">
                    {previewCount.toLocaleString()}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="json" className="flex items-center space-x-2">
                <Code className="w-4 h-4" />
                <span>JSON</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 mt-4 overflow-hidden flex flex-col min-h-0">
              <TabsContent
                value="builder"
                className="flex-1 overflow-y-auto space-y-4 data-[state=active]:flex data-[state=active]:flex-col min-h-0"
              >
                <SegmentBasicInfo
                  name={segmentName}
                  description={segmentDescription}
                  enabled={segmentEnabled}
                  onNameChange={setSegmentName}
                  onDescriptionChange={setSegmentDescription}
                  onEnabledChange={setSegmentEnabled}
                />

                <SegmentConditionBuilder
                  rootGroup={rootGroup}
                  onRootGroupChange={setRootGroup}
                  onAddCondition={addCondition}
                  onRemoveCondition={removeCondition}
                  onUpdateCondition={updateCondition}
                />
              </TabsContent>

              <TabsContent
                value="preview"
                className="flex-1 overflow-y-auto min-h-0 p-1"
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <Eye className="w-5 h-5" />
                        <span>{t('Segment Preview')}</span>
                      </CardTitle>
                      <Button
                        onClick={previewSegment}
                        disabled={
                          isPreviewLoading || rootGroup.conditions.length === 0
                        }
                        className="flex items-center space-x-2"
                      >
                        <RefreshCw
                          className={`w-4 h-4 ${isPreviewLoading ? 'animate-spin' : ''}`}
                        />
                        <span>{t('Generate Preview')}</span>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {previewCount !== null ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <Card className="p-4 bg-info-lighter">
                            <div className="flex items-center space-x-2">
                              <Users className="w-5 h-5 text-info" />
                              <div>
                                <p className="text-sm text-info">{t('Total Profiles')}</p>
                                <p className="text-2xl font-bold text-info-dark">
                                  {previewCount.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          </Card>
                          <Card className="p-4 bg-success-lighter">
                            <div className="flex items-center space-x-2">
                              <CheckCircle2 className="w-5 h-5 text-success" />
                              <div>
                                <p className="text-sm text-success">{t('Match Rate')}</p>
                                <p className="text-2xl font-bold text-success-dark">
                                  {((previewCount / 50000) * 100).toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </Card>
                          <Card className="p-4 bg-secondary-light">
                            <div className="flex items-center space-x-2">
                              <Activity className="w-5 h-5 text-secondary" />
                              <div>
                                <p className="text-sm text-secondary">{t('Est. Growth')}</p>
                                <p className="text-2xl font-bold text-secondary-dark">
                                  +{Math.floor(Math.random() * 20) + 5}%
                                </p>
                              </div>
                            </div>
                          </Card>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">{t('Segment Breakdown')}</h3>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center p-2 bg-muted rounded">
                              <span>{t('Active in last 30 days')}</span>
                              <span className="font-medium">
                                {Math.floor(previewCount * 0.7).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-muted rounded">
                              <span>{t('Has made purchases')}</span>
                              <span className="font-medium">
                                {Math.floor(previewCount * 0.4).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-2 bg-muted rounded">
                              <span>{t('Email subscribers')}</span>
                              <span className="font-medium">
                                {Math.floor(previewCount * 0.8).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-64">
                        <Eye className="w-12 h-12 text-muted-text mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          {t('No Preview Generated')}
                        </h3>
                        <p className="text-muted-foreground text-center mb-4">
                          {t('Generate a preview to see how many profiles match your segment conditions.')}
                        </p>
                        {rootGroup.conditions.length === 0 && (
                          <p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                            {t('Add at least one condition to preview the segment.')}
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="json"
                className="flex-1 overflow-y-auto min-h-0 p-1"
              >
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">{t('Advanced Condition Editor')}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t('Edit the raw Unomi condition directly with visual or JSON editing.')}
                    </p>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ResolvedConditionBuilder
                      value={rawCondition}
                      onChange={handleRawConditionChange}
                      systemTag="profileCondition"
                      height={300}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            {rootGroup.conditions.length > 0 && (
              <>
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>
                  {rootGroup.conditions.length} condition
                  {rootGroup.conditions.length !== 1 ? 's' : ''} defined
                </span>
              </>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !segmentName.trim() || rootGroup.conditions.length === 0
              }
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{segment ? t('Update Segment') : t('Create Segment')}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
