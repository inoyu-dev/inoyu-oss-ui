/**
 * UnomiEntityBasicFields — Shared form fields for Unomi entity builders.
 *
 * DRY: GoalBuilder, CampaignBuilder, ScoringBuilder all repeat identical
 * Name + Description + Scope + Enabled fields. This component extracts
 * that common set.
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useTranslation } from 'react-i18next';

export interface UnomiEntityBasicFieldsProps {
  name: string;
  onNameChange: (value: string) => void;
  description: string;
  onDescriptionChange: (value: string) => void;
  enabled: boolean;
  onEnabledChange: (value: boolean) => void;
  /** Scope field (optional — some builders like RuleBuilder don't show scope) */
  scope?: string;
  onScopeChange?: (value: string) => void;
  /** Entity type for label customisation (e.g. "Goal", "Campaign") */
  entityLabel?: string;
}

export function UnomiEntityBasicFields({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  enabled,
  onEnabledChange,
  scope,
  onScopeChange,
  entityLabel = 'Entity',
}: UnomiEntityBasicFieldsProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="entity-name">{t(`${entityLabel} Name`)} *</Label>
        <Input
          id="entity-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={t(`Enter ${entityLabel.toLowerCase()} name`)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="entity-description">{t('Description')}</Label>
        <Textarea
          id="entity-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={t(`Enter ${entityLabel.toLowerCase()} description`)}
          rows={3}
        />
      </div>

      {scope !== undefined && onScopeChange && (
        <div className="space-y-2">
          <Label htmlFor="entity-scope">{t('Scope')}</Label>
          <Input
            id="entity-scope"
            value={scope}
            onChange={(e) => onScopeChange(e.target.value)}
            placeholder="systemscope"
          />
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Switch
          id="entity-enabled"
          checked={enabled}
          onCheckedChange={onEnabledChange}
        />
        <Label htmlFor="entity-enabled">{t('Enabled')}</Label>
      </div>
    </div>
  );
}
