import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Save, X, Tag, AlertTriangle } from 'lucide-react';
import {
  savePropertyType,
  PropertyType,
  NumericRange,
  DateRange,
  IpRange,
} from '@/services/client/UnomiClientService';
import PropertyTypeBasicInfo from './PropertyTypeBasicInfo';
import PropertyTypeMetadata from './PropertyTypeMetadata';
import PropertyTypeRangesConfig from './PropertyTypeRangesConfig';
import PropertyTypeAdvancedConfig from './PropertyTypeAdvancedConfig';
import type { PropertyTypeEditorProps } from './property-type-types';

const DEFAULT_FORM_DATA: Partial<PropertyType> = {
  metadata: {
    id: '',
    name: '',
    description: '',
    scope: 'systemscope',
    tags: [],
    systemTags: [],
    enabled: true,
    hidden: false,
    readOnly: false,
  },
  target: 'profiles',
  type: 'string',
  defaultValue: '',
  multivalued: false,
  protected: false,
  rank: 100,
  mergeStrategy: 'defaultMergeStrategy',
  numericRanges: [],
  dateRanges: [],
  ipRanges: [],
  automaticMappingsFrom: [],
};

const PropertyTypeEditor: React.FC<PropertyTypeEditorProps> = ({
  propertyType,
  isOpen,
  onClose,
  onSave,
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Partial<PropertyType>>(DEFAULT_FORM_DATA);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [systemTagInput, setSystemTagInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData(propertyType ? { ...propertyType } : { ...DEFAULT_FORM_DATA });
      setError(null);
      setTagInput('');
      setSystemTagInput('');
    }
  }, [isOpen, propertyType]);

  const updateField = (field: string, value: unknown) => {
    setFormData((prev) => {
      if (field.startsWith('metadata.')) {
        const metadataField = field.replace('metadata.', '');
        return {
          ...prev,
          metadata: {
            ...prev.metadata!,
            [metadataField]: value,
          },
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.metadata?.tags?.includes(tagInput.trim())) {
      updateField('metadata.tags', [...(formData.metadata?.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    updateField('metadata.tags', formData.metadata?.tags?.filter((t) => t !== tag) || []);
  };

  const addSystemTag = () => {
    if (
      systemTagInput.trim() &&
      !formData.metadata?.systemTags?.includes(systemTagInput.trim())
    ) {
      updateField('metadata.systemTags', [
        ...(formData.metadata?.systemTags || []),
        systemTagInput.trim(),
      ]);
      setSystemTagInput('');
    }
  };

  const removeSystemTag = (tag: string) => {
    updateField(
      'metadata.systemTags',
      formData.metadata?.systemTags?.filter((t) => t !== tag) || []
    );
  };

  const addNumericRange = () => {
    const newRange: NumericRange = { key: '', from: undefined, to: undefined };
    updateField('numericRanges', [...(formData.numericRanges || []), newRange]);
  };

  const updateNumericRange = (
    index: number,
    field: keyof NumericRange,
    value: string | number | undefined
  ) => {
    const ranges = [...(formData.numericRanges || [])];
    ranges[index] = { ...ranges[index], [field]: value };
    updateField('numericRanges', ranges);
  };

  const removeNumericRange = (index: number) => {
    updateField('numericRanges', formData.numericRanges?.filter((_, i) => i !== index) || []);
  };

  const addDateRange = () => {
    const newRange: DateRange = { key: '', from: undefined, to: undefined };
    updateField('dateRanges', [...(formData.dateRanges || []), newRange]);
  };

  const updateDateRange = (index: number, field: keyof DateRange, value: string | undefined) => {
    const ranges = [...(formData.dateRanges || [])];
    ranges[index] = { ...ranges[index], [field]: value };
    updateField('dateRanges', ranges);
  };

  const removeDateRange = (index: number) => {
    updateField('dateRanges', formData.dateRanges?.filter((_, i) => i !== index) || []);
  };

  const addIpRange = () => {
    const newRange: IpRange = { key: '', from: undefined, to: undefined };
    updateField('ipRanges', [...(formData.ipRanges || []), newRange]);
  };

  const updateIpRange = (index: number, field: keyof IpRange, value: string | undefined) => {
    const ranges = [...(formData.ipRanges || [])];
    ranges[index] = { ...ranges[index], [field]: value };
    updateField('ipRanges', ranges);
  };

  const removeIpRange = (index: number) => {
    updateField('ipRanges', formData.ipRanges?.filter((_, i) => i !== index) || []);
  };

  const addAutomaticMapping = () => {
    updateField('automaticMappingsFrom', [...(formData.automaticMappingsFrom || []), '']);
  };

  const updateAutomaticMapping = (index: number, value: string) => {
    const mappings = [...(formData.automaticMappingsFrom || [])];
    mappings[index] = value;
    updateField('automaticMappingsFrom', mappings);
  };

  const removeAutomaticMapping = (index: number) => {
    updateField(
      'automaticMappingsFrom',
      formData.automaticMappingsFrom?.filter((_, i) => i !== index) || []
    );
  };

  const validateForm = (): boolean => {
    if (!formData.metadata?.id?.trim()) {
      setError('Property type ID is required');
      return false;
    }
    if (!formData.metadata?.name?.trim()) {
      setError('Property type name is required');
      return false;
    }
    if (!formData.type && !formData.valueTypeId) {
      setError('Property type (type or valueTypeId) is required');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    setError(null);

    try {
      const propertyTypeData: PropertyType = {
        ...formData,
        metadata: {
          ...formData.metadata!,
          id: formData.metadata!.id.trim(),
        },
      } as PropertyType;

      await savePropertyType(propertyTypeData);
      toast({
        title: 'Success',
        description: 'Property type saved successfully',
      });
      onSave();
    } catch (err) {
      console.error('Error saving property type:', err);
      setError(err instanceof Error ? err.message : 'Failed to save property type');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save property type',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        data-testid="property-type-editor-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Tag className="h-5 w-5" />
            <span>{propertyType ? 'Edit Property Type' : 'Create Property Type'}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="ranges">Ranges</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <PropertyTypeBasicInfo
                formData={formData}
                updateField={updateField}
                isEditing={!!propertyType}
              />
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              <PropertyTypeMetadata
                formData={formData}
                updateField={updateField}
                tagInput={tagInput}
                setTagInput={setTagInput}
                systemTagInput={systemTagInput}
                setSystemTagInput={setSystemTagInput}
                onAddTag={addTag}
                onRemoveTag={removeTag}
                onAddSystemTag={addSystemTag}
                onRemoveSystemTag={removeSystemTag}
              />
            </TabsContent>

            <TabsContent value="ranges" className="space-y-4">
              <PropertyTypeRangesConfig
                formData={formData}
                onAddNumericRange={addNumericRange}
                onUpdateNumericRange={updateNumericRange}
                onRemoveNumericRange={removeNumericRange}
                onAddDateRange={addDateRange}
                onUpdateDateRange={updateDateRange}
                onRemoveDateRange={removeDateRange}
                onAddIpRange={addIpRange}
                onUpdateIpRange={updateIpRange}
                onRemoveIpRange={removeIpRange}
              />
            </TabsContent>

            <TabsContent value="advanced" className="space-y-4">
              <PropertyTypeAdvancedConfig
                formData={formData}
                updateField={updateField}
                onAddAutomaticMapping={addAutomaticMapping}
                onUpdateAutomaticMapping={updateAutomaticMapping}
                onRemoveAutomaticMapping={removeAutomaticMapping}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PropertyTypeEditor;
