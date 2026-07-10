import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { UnomiScoring, createScoring, updateScoring } from '@/services/client/UnomiClientService';
import { Condition } from '@/services/shared/types';
import { useTranslation } from 'react-i18next';
import { ConditionBuilder, type ConditionBuilderProps } from '@/components/conditions';
import { useRegisteredComponent } from '@/plugins/useRegisteredComponent';
import { EntityBuilderDialog } from '@/components/shared/EntityBuilderDialog';
import { UnomiEntityBasicFields } from '@/components/shared/UnomiEntityBasicFields';
import { useSaveEntity } from '@/hooks/useSaveEntity';

interface ScoringBuilderProps {
  scoring?: UnomiScoring | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function ScoringBuilder({ scoring, isOpen, onClose, onSave }: ScoringBuilderProps) {
  const { t } = useTranslation();
  const ResolvedConditionBuilder = useRegisteredComponent<ConditionBuilderProps>('conditions/ConditionBuilder', ConditionBuilder);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [scope, setScope] = useState('systemscope');
  const [elements, setElements] = useState<Array<{ condition: Condition; value: number }>>([]);

  const { save, saving } = useSaveEntity({
    entityName: 'Scoring',
    buildPayload: () => ({
      itemId: scoring?.itemId || name.toLowerCase().replace(/\s+/g, '-'),
      itemType: 'scoring',
      scope,
      metadata: {
        id: scoring?.metadata.id || name.toLowerCase().replace(/\s+/g, '-'),
        name,
        description: description || undefined,
        scope,
        enabled,
      },
      elements,
    }),
    validate: () => (!name.trim() ? t('Scoring name is required') : null),
    create: createScoring,
    update: updateScoring,
    isEditing: !!scoring,
    entityId: scoring?.itemId,
    onSuccess: onSave,
  });

  useEffect(() => {
    if (scoring) {
      setName(scoring.metadata.name || '');
      setDescription(scoring.metadata.description || '');
      setEnabled(scoring.metadata.enabled ?? true);
      setScope(scoring.scope || 'systemscope');
      setElements(scoring.elements || []);
    } else {
      setName('');
      setDescription('');
      setEnabled(true);
      setScope('systemscope');
      setElements([]);
    }
  }, [scoring, isOpen]);

  const addElement = () => {
    const newCondition = { type: 'matchAllCondition', parameterValues: {} };
    setElements([...elements, { condition: newCondition, value: 0 }]);
  };

  const removeElement = (index: number) => {
    setElements(elements.filter((_, i) => i !== index));
  };

  const updateElement = (index: number, updates: Partial<{ condition: Condition; value: number }>) => {
    setElements(elements.map((el, i) => i === index ? { ...el, ...updates } : el));
  };

  return (
    <EntityBuilderDialog
      open={isOpen}
      onOpenChange={(open) => { if (!open) onClose(); }}
      title={scoring ? t('Edit Scoring') : t('Create Scoring')}
      onSave={save}
      saving={saving}
      onCancel={onClose}
    >
      <div className="space-y-4">
        <UnomiEntityBasicFields
          name={name}
          onNameChange={setName}
          description={description}
          onDescriptionChange={setDescription}
          enabled={enabled}
          onEnabledChange={setEnabled}
          scope={scope}
          onScopeChange={setScope}
          entityLabel="Scoring"
        />

        <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{t('Scoring Elements')}</CardTitle>
                <Button onClick={addElement} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('Add Element')}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {elements.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  {t('No scoring elements. Add elements to define scoring rules.')}
                </div>
              ) : (
                <div className="space-y-4">
                  {elements.map((element, index) => (
                    <Card key={index} className="border">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{t('Element')} {index + 1}</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeElement(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <Label>{t('Score Value')}</Label>
                            <Input
                              type="number"
                              value={element.value}
                              onChange={(e) => updateElement(index, { value: parseInt(e.target.value) || 0 })}
                            />
                          </div>
                          <div>
                            <ResolvedConditionBuilder
                              value={element.condition}
                              onChange={(val) => updateElement(index, { condition: val })}
                              label={t('Condition')}
                              height={160}
                              compact
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </EntityBuilderDialog>
  );
}
