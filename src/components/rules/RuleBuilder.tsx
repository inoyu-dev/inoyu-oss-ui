import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import {
  Save,
  Eye,
  Code,
  Wand2,
  Filter,
  Zap,
  Play,
  ArrowRight,
  Workflow,
  CheckCircle2,
  Activity,
} from 'lucide-react';
import { UnomiRule, createRule, updateRule } from '@/services/client/UnomiClientService';
import type { RuleCondition, RuleAction } from './rule-types';
import { ACTION_TEMPLATES } from './rule-types';
import { RuleBasicInfo } from './RuleBasicInfo';
import { RuleConditionSection } from './RuleConditionSection';
import { RuleActionList } from './RuleActionList';
import { ConditionBuilder, ActionBuilder, type ConditionBuilderProps, type ActionBuilderProps } from '@/components/conditions';
import { useRegisteredComponent } from '@/plugins/useRegisteredComponent';
import type { Condition } from '@/services/shared/types';

export interface RuleBuilderProps {
  rule?: UnomiRule;
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: UnomiRule) => void;
}

/** Action in raw Unomi format (for advanced editor) */
interface RawAction {
  type: string;
  parameterValues: Record<string, unknown>;
}

export default function RuleBuilder({ rule, isOpen, onClose, onSave }: RuleBuilderProps) {
  const { t } = useTranslation('common');
  const ResolvedConditionBuilder = useRegisteredComponent<ConditionBuilderProps>('conditions/ConditionBuilder', ConditionBuilder);
  const ResolvedActionBuilder = useRegisteredComponent<ActionBuilderProps>('conditions/ActionBuilder', ActionBuilder);
  const [ruleName, setRuleName] = useState(rule?.metadata?.name ?? '');
  const [ruleDescription, setRuleDescription] = useState(rule?.metadata?.description ?? '');
  const [ruleEnabled, setRuleEnabled] = useState(rule?.metadata?.enabled ?? true);
  const [rulePriority, setRulePriority] = useState(rule?.priority ?? 50);
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [actions, setActions] = useState<RuleAction[]>([]);
  const [activeTab, setActiveTab] = useState('builder');
  /** Raw Unomi condition — used in the Advanced tab */
  const [rawCondition, setRawCondition] = useState<Condition | undefined>(rule?.condition);
  /** Raw Unomi actions — used in the Advanced tab */
  const [rawActions, setRawActions] = useState<RawAction[]>(
    rule?.actions?.map((a) => ({ type: a.actionTypeId ?? '', parameterValues: a.parameterValues ?? {} })) ?? []
  );
  /** Track which tab was last edited */
  const [lastEditedTab, setLastEditedTab] = useState<'builder' | 'advanced'>('builder');

  useEffect(() => {
    if (rule) {
      setRuleName(rule.metadata?.name ?? '');
      setRuleDescription(rule.metadata?.description ?? '');
      setRuleEnabled(rule.metadata?.enabled ?? true);
      setRulePriority(rule.priority ?? 50);
      setRawCondition(rule.condition);
      setRawActions(
        rule.actions?.map((a) => ({ type: a.actionTypeId ?? '', parameterValues: a.parameterValues ?? {} })) ?? []
      );

      if (rule.condition) {
        setConditions([
          {
            id: 'condition-1',
            type: 'eventCondition',
            field: 'eventType',
            operator: 'equals',
            value: 'view',
            displayName: 'Page View Event',
          },
        ]);
      }

      if (rule.actions != null && rule.actions.length > 0) {
        setActions(
          rule.actions.map((action, index) => ({
            id: `action-${index + 1}`,
            type: action.actionTypeId as RuleAction['type'],
            parameters: action.parameterValues ?? {},
            displayName: action.actionTypeId
              .replace('Action', '')
              .replace(/([A-Z])/g, ' $1')
              .trim(),
          }))
        );
      }
    }
  }, [rule]);

  const addCondition = useCallback(() => {
    const newCondition: RuleCondition = {
      id: `condition-${Date.now()}`,
      type: 'eventCondition',
      field: 'eventType',
      operator: 'equals',
      value: '',
    };
    setConditions((prev) => [...prev, newCondition]);
  }, []);

  const removeCondition = useCallback((conditionId: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== conditionId));
  }, []);

  const updateCondition = useCallback((conditionId: string, updates: Partial<RuleCondition>) => {
    setConditions((prev) =>
      prev.map((c) => (c.id === conditionId ? { ...c, ...updates } : c))
    );
  }, []);

  const addAction = useCallback((templateKey?: string) => {
    const template = templateKey
      ? ACTION_TEMPLATES[templateKey]
      : ACTION_TEMPLATES.setProperty;
    const newAction: RuleAction = {
      id: `action-${Date.now()}`,
      type: template.type,
      parameters: { ...template.parameters },
      displayName: template.label,
      description: template.description,
    };
    setActions((prev) => [...prev, newAction]);
  }, []);

  const removeAction = useCallback((actionId: string) => {
    setActions((prev) => prev.filter((a) => a.id !== actionId));
  }, []);

  const updateAction = useCallback((actionId: string, updates: Partial<RuleAction>) => {
    setActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, ...updates } : a))
    );
  }, []);

  const generateJson = useCallback(() => {
    const unomiRule = {
      metadata: {
        id: rule?.metadata?.id ?? `rule-${Date.now()}`,
        name: ruleName,
        description: ruleDescription,
        enabled: ruleEnabled,
      },
      priority: rulePriority,
      condition:
        conditions.length > 0
          ? {
              type:
                conditions.length === 1
                  ? conditions[0].type + 'Condition'
                  : 'booleanCondition',
              parameterValues:
                conditions.length === 1
                  ? {
                      propertyName: conditions[0].field,
                      comparisonOperator: conditions[0].operator,
                      propertyValue: conditions[0].value,
                    }
                  : {
                      operator: 'AND',
                      subConditions: conditions.map((condition) => ({
                        type: condition.type + 'Condition',
                        parameterValues: {
                          propertyName: condition.field,
                          comparisonOperator: condition.operator,
                          propertyValue: condition.value,
                        },
                      })),
                    },
            }
          : null,
      actions: actions.map((action) => ({
        type: action.type,
        parameterValues: action.parameters,
      })),
    };

    return JSON.stringify(unomiRule, null, 2);
  }, [ruleName, ruleDescription, ruleEnabled, rulePriority, conditions, actions, rule]);

  // Sync visual builder state to raw when switching to JSON tab
  useEffect(() => {
    if (activeTab === 'json' && lastEditedTab === 'builder') {
      try {
        const parsed = JSON.parse(generateJson());
        if (parsed.condition) setRawCondition(parsed.condition);
        if (parsed.actions) setRawActions(parsed.actions);
      } catch {
        // ignore parse errors
      }
    }
  }, [activeTab, lastEditedTab, generateJson]);

  const handleRawConditionChange = useCallback((condition: Condition) => {
    setLastEditedTab('advanced');
    setRawCondition(condition);
  }, []);

  const handleRawActionChange = useCallback((index: number, action: RawAction) => {
    setLastEditedTab('advanced');
    setRawActions((prev) => prev.map((a, i) => (i === index ? action : a)));
  }, []);

  const addRawAction = useCallback(() => {
    setLastEditedTab('advanced');
    setRawActions((prev) => [...prev, { type: '', parameterValues: {} }]);
  }, []);

  const removeRawAction = useCallback((index: number) => {
    setLastEditedTab('advanced');
    setRawActions((prev) => prev.filter((_, i) => i !== index));
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

    const useAdvanced = lastEditedTab === 'advanced';

    if (!useAdvanced && conditions.length === 0) {
      toast({
        title: t('No Conditions'),
        description: t('Please add at least one condition to trigger the rule.'),
        variant: 'destructive',
      });
      return;
    }

    if (!useAdvanced && actions.length === 0) {
      toast({
        title: t('No Actions'),
        description: t('Please add at least one action for the rule to perform.'),
        variant: 'destructive',
      });
      return;
    }

    try {
      let ruleData;
      if (useAdvanced) {
        ruleData = {
          metadata: {
            id: rule?.metadata?.id ?? `rule-${Date.now()}`,
            name: ruleName,
            description: ruleDescription,
            enabled: ruleEnabled,
          },
          priority: rulePriority,
          condition: rawCondition ?? null,
          actions: rawActions.filter((a) => a.type),
        };
      } else {
        ruleData = JSON.parse(generateJson());
      }

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
        className="max-w-6xl max-h-[90vh] flex flex-col"
        data-testid="rule-builder-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Workflow className="w-5 h-5" />
            <span>{rule ? t('Edit Rule') : t('Create New Rule')}</span>
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
                <Wand2 className="w-4 h-4" />
                <span>{t('Visual Builder')}</span>
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>{t('Flow Preview')}</span>
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

                <RuleConditionSection
                  conditions={conditions}
                  onAddCondition={addCondition}
                  onRemoveCondition={removeCondition}
                  onUpdateCondition={updateCondition}
                />

                <RuleActionList
                  actions={actions}
                  onAddAction={addAction}
                  onRemoveAction={removeAction}
                  onUpdateAction={updateAction}
                />
              </TabsContent>

              <TabsContent
                value="preview"
                className="flex-1 overflow-y-auto min-h-0"
              >
                <Card className="h-full flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Eye className="w-5 h-5" />
                      <span>{t('Rule Flow Preview')}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-info-light rounded-full mb-2">
                        <Play className="w-6 h-6 text-info" />
                      </div>
                      <h3 className="font-semibold">
                        Rule: {ruleName || 'Untitled Rule'}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Priority: {rulePriority}
                      </p>
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-muted-text" />
                    </div>

                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-success-light rounded-full mb-2">
                        <Filter className="w-6 h-6 text-success" />
                      </div>
                      <h3 className="font-semibold">{t('Trigger Conditions')}</h3>
                      {conditions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t('No conditions defined')}
                        </p>
                      ) : (
                        <div className="mt-2 space-y-1">
                          {conditions.map((condition, index) => (
                            <div
                              key={condition.id}
                              className="text-sm bg-success-lighter p-2 rounded"
                            >
                              {index > 0 && (
                                <span className="text-success font-medium">
                                  AND{' '}
                                </span>
                              )}
                              <span>
                                {condition.field} {condition.operator}{' '}
                                {condition.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center">
                      <ArrowRight className="w-6 h-6 text-muted-text" />
                    </div>

                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-light rounded-full mb-2">
                        <Zap className="w-6 h-6 text-secondary" />
                      </div>
                      <h3 className="font-semibold">{t('Actions Performed')}</h3>
                      {actions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          {t('No actions defined')}
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {actions.map((action, index) => (
                            <div
                              key={action.id}
                              className="text-sm bg-secondary-light p-3 rounded"
                            >
                              <div className="font-medium">
                                {index + 1}. {action.displayName}
                              </div>
                              {action.description != null &&
                                action.description !== '' && (
                                  <div className="text-muted-foreground mt-1">
                                    {action.description}
                                  </div>
                                )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-success" />
                    </div>

                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-muted rounded-full mb-2">
                        <Activity className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <h3 className="font-semibold">{t('Rule Complete')}</h3>
                      <p className="text-sm text-muted-foreground">
                        {t('Rule execution finished')}
                      </p>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent
                value="json"
                className="flex-1 overflow-y-auto min-h-0 space-y-4 p-1"
              >
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-sm">{t('Advanced Condition Editor')}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {t('Edit the raw Unomi condition with visual or JSON editing.')}
                    </p>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    <ResolvedConditionBuilder
                      value={rawCondition}
                      onChange={handleRawConditionChange}
                      height={250}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">{t('Advanced Action Editor')}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {t('Edit actions with visual or JSON editing.')}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={addRawAction} className="text-xs">
                        {t('Add Action')}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-3">
                    {rawActions.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No actions. Click &quot;Add Action&quot; to add one.
                      </p>
                    ) : (
                      rawActions.map((action, index) => (
                        <Card key={index} className="relative">
                          <CardHeader className="py-2 px-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-xs text-muted-foreground">
                                Action {index + 1}
                              </CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRawAction(index)}
                                className="h-6 w-6 p-0 text-destructive"
                              >
                                ×
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="py-2 px-3">
                            <ResolvedActionBuilder
                              value={action}
                              onChange={(updated) => handleRawActionChange(index, updated)}
                              compact
                              height={180}
                            />
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            {conditions.length > 0 && (
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-success" />
                <span>
                  {conditions.length} condition
                  {conditions.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
            {actions.length > 0 && (
              <div className="flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4 text-secondary" />
                <span>
                  {actions.length} action{actions.length !== 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              {t('Cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !ruleName.trim() ||
                conditions.length === 0 ||
                actions.length === 0
              }
              className="flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{rule ? t('Update Rule') : t('Create Rule')}</span>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
