import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UnomiCampaign, createCampaign, updateCampaign } from '@/services/client/UnomiClientService';
import { EntityBuilderDialog } from '@/components/shared/EntityBuilderDialog';
import { UnomiEntityBasicFields } from '@/components/shared/UnomiEntityBasicFields';
import { useSaveEntity } from '@/hooks/useSaveEntity';
import { Condition } from '@/services/shared/types';
import GoalSelector from '@/components/goals/GoalSelector';
import { useTranslation } from 'react-i18next';
import { ConditionBuilder, type ConditionBuilderProps } from '@/components/conditions';
import { useRegisteredComponent } from '@/plugins/useRegisteredComponent';

interface CampaignBuilderProps {
  campaign?: UnomiCampaign | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function CampaignBuilder({ campaign, isOpen, onClose, onSave }: CampaignBuilderProps) {
  const { t } = useTranslation();
  const ResolvedConditionBuilder = useRegisteredComponent<ConditionBuilderProps>('conditions/ConditionBuilder', ConditionBuilder);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [scope, setScope] = useState('systemscope');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [timezone, setTimezone] = useState('UTC');
  const [entryCondition, setEntryCondition] = useState<Condition | undefined>(campaign?.entryCondition);
  const [primaryGoal, setPrimaryGoal] = useState<string | undefined>(undefined);
  const [cost, setCost] = useState<number | undefined>(undefined);
  const [currency, setCurrency] = useState('USD');

  const { save, saving } = useSaveEntity<Record<string, unknown>>({
    entityName: 'Campaign',
    buildPayload: () => {
      const campaignData: Record<string, unknown> = {
        itemId: campaign?.itemId || name.toLowerCase().replace(/\s+/g, '-'),
        itemType: 'campaign',
        scope: scope,
        metadata: {
          id: campaign?.metadata.id || name.toLowerCase().replace(/\s+/g, '-'),
          name: name,
          description: description || undefined,
          scope: scope,
          enabled: enabled,
        },
      };
      if (startDate) campaignData.startDate = new Date(startDate).toISOString();
      if (endDate) campaignData.endDate = new Date(endDate).toISOString();
      if (timezone) campaignData.timezone = timezone;
      if (entryCondition) campaignData.entryCondition = entryCondition;
      if (primaryGoal) campaignData.primaryGoal = primaryGoal;
      if (cost !== undefined) {
        campaignData.cost = cost;
        campaignData.currency = currency;
      }
      return campaignData;
    },
    validate: () => (!name.trim() ? 'Campaign name is required' : null),
    create: createCampaign,
    update: updateCampaign,
    isEditing: !!campaign,
    entityId: campaign?.itemId,
    onSuccess: onSave,
  });

  useEffect(() => {
    if (campaign) {
      setName(campaign.metadata.name || '');
      setDescription(campaign.metadata.description || '');
      setEnabled(campaign.metadata.enabled ?? true);
      setScope(campaign.scope || 'systemscope');
      setStartDate(campaign.startDate ? new Date(campaign.startDate).toISOString().slice(0, 16) : '');
      setEndDate(campaign.endDate ? new Date(campaign.endDate).toISOString().slice(0, 16) : '');
      setTimezone(campaign.timezone || 'UTC');
      setEntryCondition(campaign.entryCondition);
      setPrimaryGoal(campaign.primaryGoal);
      setCost(campaign.cost);
      setCurrency(campaign.currency || 'USD');
    } else {
      setName('');
      setDescription('');
      setEnabled(true);
      setScope('systemscope');
      setStartDate('');
      setEndDate('');
      setTimezone('UTC');
      setEntryCondition(undefined);
      setPrimaryGoal(undefined);
      setCost(undefined);
      setCurrency('USD');
    }
  }, [campaign, isOpen]);

  return (
    <EntityBuilderDialog open={isOpen} onOpenChange={onClose} title={campaign ? t('Edit Campaign') : t('Create Campaign')} onSave={save} saving={saving} onCancel={onClose}>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList>
          <TabsTrigger value="basic">{t('Basic Info')}</TabsTrigger>
          <TabsTrigger value="scheduling">{t('Scheduling')}</TabsTrigger>
          <TabsTrigger value="conditions">{t('Conditions')}</TabsTrigger>
          <TabsTrigger value="goals">{t('Goals')}</TabsTrigger>
          <TabsTrigger value="cost">{t('Cost Tracking')}</TabsTrigger>
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
            entityLabel="Campaign"
          />
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">{t('Start Date')}</Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">{t('End Date')}</Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">{t('Timezone')}</Label>
            <Input
              id="timezone"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              placeholder="UTC"
            />
          </div>
        </TabsContent>

        <TabsContent value="conditions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('Entry Condition')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResolvedConditionBuilder
                value={entryCondition}
                onChange={setEntryCondition}
                label={t('Condition for campaign entry')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <GoalSelector
            value={primaryGoal}
            onChange={setPrimaryGoal}
            label={t('Primary Goal')}
          />
        </TabsContent>

        <TabsContent value="cost" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cost">{t('Cost')}</Label>
            <Input
              id="cost"
              type="number"
              value={cost !== undefined ? cost : ''}
              onChange={(e) => setCost(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="0.00"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">{t('Currency')}</Label>
            <Input
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="USD"
            />
          </div>
        </TabsContent>
        </Tabs>
    </EntityBuilderDialog>
  );
}
