/**
 * RuleBuilder — Open-source JSON/Monaco editor for Unomi rules.
 *
 * Visual form builders live in Inoyu Pro UI and are registered via
 * PluginRegistry ('rules/RuleBuilder').
 */
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Save, Code, Plus, Trash2, Workflow } from 'lucide-react';
import { UnomiRule, createRule, updateRule } from '@/services/client/UnomiClientService';
import { RuleBasicInfo } from './RuleBasicInfo';
import {
  ConditionBuilder,
  ActionBuilder,
  type ConditionBuilderProps,
  type ActionBuilderProps,
} from '@/components/conditions';
import { useRegisteredComponent } from '@/plugins/useRegisteredComponent';
import type { Action, Condition } from '@/services/shared/types';

export interface RuleBuilderProps {
  rule?: UnomiRule;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: UnomiRule) => void;
}

export default function RuleBuilder({ rule, isOpen, onClose, onSave }: RuleBuilderProps) {
  const { t } = useTranslation('common');
  const ResolvedConditionBuilder = useRegisteredComponent<ConditionBuilderProps>(
    'conditions/ConditionBuilder',
    ConditionBuilder
  );
  const ResolvedActionBuilder = useRegisteredComponent<ActionBuilderProps>(
    'conditions/ActionBuilder',
    ActionBuilder
  );
  const [ruleName, setRuleName] = useState(rule?.metadata?.name ?? '');
  const [ruleDescription, setRuleDescription] = useState(rule?.metadata?.description ?? '');
  const [ruleEnabled, setRuleEnabled] = useState(rule?.metadata?.enabled ?? true);
  const [rulePriority, setRulePriority] = useState(rule?.priority ?? 50);
  const [rawCondition, setRawCondition] = useState<Condition | undefined>(rule?.condition);
  const [rawActions, setActions] = useState<Action[]>(
    rule?.actions?.map((a) => ({
      type: a.actionTypeId ?? '',
      parameterValues: a.parameterValues ?? {},
    })) ?? []
  );

  useEffect(() => {
    if (rule) {
      setRuleName(rule.metadata?.name ?? '');
      setRuleDescription(rule.metadata?.description ?? '');
      setRuleEnabled(rule.metadata?.enabled ?? true);
      setRulePriority(rule.priority ?? 50);
      setRawCondition(rule.condition);
      setActions(
        rule.actions?.map((a) => ({
          type: a.actionTypeId ?? '',
          parameterValues: a.parameterValues ?? {},
        })) ?? []
      );
    } else {
      setRuleName('');
      setRuleDescription('');
      setRuleEnabled(true);
      setRulePriority(50);
      setRawCondition(undefined);
      setActions([]);
    }
  }, [rule, isOpen]);

  const handleRawConditionChange = useCallback((condition: Condition) => {
    setRawCondition(condition);
  }, []);

  const handleActionChange = useCallback((index: number, action: Action) => {
    setActions((prev) => prev.map((a, i) => (i === index ? action : a)));
  }, []);

  const addAction = useCallback(() => {
    setActions((prev) => [...prev, { type: '', parameterValues: {} }]);
  }, []);

  const removeAction = useCallback((index: number) => {
    setActions((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleSave = async () => {
    if (!ruleName.trim()) {
      toast({
        title: t('Missing Name'),
        description: t('Please enter a rule name.'),
        variant: 'destructive',
      });
      return;
    }

    if (!rawCondition) {
      toast({
        title: t('No Conditions'),
        description: t('Please add at least one condition to trigger the rule.'),
        variant: 'destructive',
      });
      return;
    }

    const actions = rawActions.filter((a) => a.type);
    if (actions.length === 0) {
      toast({
        title: t('No Actions'),
        description: t('Please add at least one action for the rule to perform.'),
        variant: 'destructive',
      });
      return;
    }

    try {
      const ruleData = {
        metadata: {
          id: rule?.metadata?.id ?? `rule-${Date.now()}`,
          name: ruleName,
          description: ruleDescription,
          enabled: ruleEnabled,
        },
        priority: rulePriority,
        condition: rawCondition,
        actions,
      };

      let savedRule: UnomiRule;
      if (rule) {
        savedRule = await updateRule(rule.metadata.id, ruleData);
      } else {
        savedRule = await createRule(ruleData);
      }

      toast({
        title: t('Rule Saved'),
        description: t('Rule saved successfully', { name: ruleName }),
      });

      onSave(savedRule);
      onClose();
    } catch {
      toast({
        title: t('Save Failed'),
        description: t('Could not save the rule.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] flex flex-col"
        data-testid="rule-builder-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Workflow className="w-5 h-5" />
            <span>{rule ? t('Edit Rule') : t('Create New Rule')}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 min-h-0">
          <RuleBasicInfo
            name={ruleName}
            description={ruleDescription}
            priority={rulePriority}
            enabled={ruleEnabled}
            onNameChange={setRuleName}
            onDescriptionChange={setRuleDescription}
            onPriorityChange={setRulePriority}
            onEnabledChange={setRuleEnabled}
          />

          <Card>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="w-4 h-4" />
                {t('Condition JSON')}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ResolvedConditionBuilder
                value={rawCondition}
                onChange={handleRawConditionChange}
                height={220}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Code className="w-4 h-4" />
                {t('Actions JSON')}
              </CardTitle>
              <Button variant="outline" size="sm" onClick={addAction}>
                <Plus className="w-3 h-3 mr-1" />
                {t('Add Action')}
              </Button>
            </CardHeader>
            <CardContent className="px-4 pb-4 space-y-3">
              {rawActions.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t('No actions defined')}</p>
              ) : (
                rawActions.map((action, index) => (
                  <div key={index} className="relative border rounded-md p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1"
                      onClick={() => removeAction(index)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    <ResolvedActionBuilder
                      value={action}
                      onChange={(next) =>
                        handleActionChange(index, next as Action)
                      }
                      height={160}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button onClick={handleSave} className="flex items-center space-x-2">
            <Save className="w-4 h-4" />
            <span>{rule ? t('Update Rule') : t('Create Rule')}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
