import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnomiGoal, createGoal, updateGoal } from '@/services/client/UnomiClientService';
import { EntityBuilderDialog } from '@/components/shared/EntityBuilderDialog';
import { UnomiEntityBasicFields } from '@/components/shared/UnomiEntityBasicFields';
import { useSaveEntity } from '@/hooks/useSaveEntity';
import { Condition } from '@/services/shared/types';
import { useTranslation } from 'react-i18next';
import { ConditionBuilder, type ConditionBuilderProps } from '@/components/conditions';
import { useRegisteredComponent } from '@/plugins/useRegisteredComponent';

interface GoalBuilderProps {
  goal?: UnomiGoal | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function GoalBuilder({ goal, isOpen, onClose, onSave }: GoalBuilderProps) {
  const { t } = useTranslation();
  const ResolvedConditionBuilder = useRegisteredComponent<ConditionBuilderProps>('conditions/ConditionBuilder', ConditionBuilder);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [scope, setScope] = useState('systemscope');
  const [startEvent, setStartEvent] = useState<Condition | undefined>(goal?.startEvent);
  const [targetEvent, setTargetEvent] = useState<Condition | undefined>(goal?.targetEvent);
  const [campaignId, setCampaignId] = useState<string | undefined>(undefined);

  const { save, saving } = useSaveEntity<Record<string, unknown>>({
    entityName: 'Goal',
    isEditing: !!goal,
    entityId: goal?.itemId,
    validate: () => (!name.trim() ? 'Goal name is required' : null),
    buildPayload: () => {
      const goalData: Record<string, unknown> = {
        itemId: goal?.itemId || name.toLowerCase().replace(/\s+/g, '-'),
        itemType: 'goal',
        scope: scope,
        metadata: {
          id: goal?.metadata.id || name.toLowerCase().replace(/\s+/g, '-'),
          name: name,
          description: description || undefined,
          scope: scope,
          enabled: enabled,
        },
      };
      if (startEvent) goalData.startEvent = startEvent;
      if (targetEvent) goalData.targetEvent = targetEvent;
      if (campaignId) goalData.campaignId = campaignId;
      return goalData;
    },
    create: createGoal,
    update: (id, payload) => updateGoal(id, payload),
    onSuccess: onSave,
  });

  useEffect(() => {
    if (goal) {
      setName(goal.metadata.name || '');
      setDescription(goal.metadata.description || '');
      setEnabled(goal.metadata.enabled ?? true);
      setScope(goal.scope || 'systemscope');
      setStartEvent(goal.startEvent);
      setTargetEvent(goal.targetEvent);
      setCampaignId(goal.campaignId);
    } else {
      setName('');
      setDescription('');
      setEnabled(true);
      setScope('systemscope');
      setStartEvent(undefined);
      setTargetEvent(undefined);
      setCampaignId(undefined);
    }
  }, [goal, isOpen]);

  return (
    <EntityBuilderDialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={goal ? t('Edit Goal') : t('Create Goal')}
      onSave={save}
      saving={saving}
      onCancel={onClose}
    >
      <Tabs defaultValue="basic" className="w-full">
          <TabsList>
            <TabsTrigger value="basic">{t('Basic Info')}</TabsTrigger>
            <TabsTrigger value="events">{t('Events')}</TabsTrigger>
            <TabsTrigger value="campaign">{t('Campaign')}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <UnomiEntityBasicFields
              name={name}
              onNameChange={setName}
              description={description}
              onDescriptionChange={setDescription}
              enabled={enabled}
              onEnabledChange={setEnabled}
              scope={scope}
              onScopeChange={setScope}
              entityLabel="Goal"
            />
          </TabsContent>

          <TabsContent value="events" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('Start Event Condition')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResolvedConditionBuilder
                  value={startEvent}
                  onChange={setStartEvent}
                  systemTag="eventCondition"
                  label={t('Condition for when the goal starts')}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('Target Event Condition')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResolvedConditionBuilder
                  value={targetEvent}
                  onChange={setTargetEvent}
                  systemTag="eventCondition"
                  label={t('Condition for when the goal is completed')}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="campaign" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="campaignId">{t('Campaign ID')} (Optional)</Label>
              <Input
                id="campaignId"
                value={campaignId || ''}
                onChange={(e) => setCampaignId(e.target.value || undefined)}
                placeholder={t('Enter campaign ID to link this goal')}
              />
              <p className="text-xs text-muted-foreground">
                {t('Link this goal to a campaign for tracking')}
              </p>
            </div>
          </TabsContent>
        </Tabs>
    </EntityBuilderDialog>
  );
}
