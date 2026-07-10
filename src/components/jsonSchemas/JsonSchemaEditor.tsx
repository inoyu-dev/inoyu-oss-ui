import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  Save, 
  X, 
  Code, 
  FileJson,
  AlertTriangle
} from 'lucide-react';
import { 
  saveJsonSchema,
  JsonSchema
} from '@/services/client/UnomiClientService';
import { JsonEditor, formatJson } from '@/components/json';

interface JsonSchemaEditorProps {
  schema?: JsonSchema;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const JsonSchemaEditor: React.FC<JsonSchemaEditorProps> = ({
  schema,
  isOpen,
  onClose,
  onSave
}) => {
  const { toast } = useToast();
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Memoised preview: only re-computed when jsonText changes
  const previewJson = useMemo(() => {
    const result = formatJson(jsonText);
    return result.ok ? result.formatted : '// Invalid JSON';
  }, [jsonText]);

  useEffect(() => {
    if (isOpen) {
      if (schema) {
        setJsonText(JSON.stringify(schema, null, 2));
      } else {
        // Default template for new schema
        const defaultSchema: JsonSchema = {
          $id: 'https://example.com/schemas/json/events/example/1-0-0',
          $schema: 'https://json-schema.org/draft/2019-09/schema',
          self: {
            vendor: 'example',
            target: 'events',
            name: 'example',
            format: 'jsonschema',
            version: '1-0-0'
          },
          title: 'ExampleEvent',
          type: 'object',
          allOf: [
            {
              $ref: 'https://unomi.apache.org/schemas/json/event/1-0-0'
            }
          ],
          properties: {
            properties: {
              type: 'object',
              properties: {},
              additionalProperties: false
            }
          },
          unevaluatedProperties: false
        };
        setJsonText(JSON.stringify(defaultSchema, null, 2));
      }
      setError(null);
    }
  }, [isOpen, schema]);

  const validateJson = (text: string): JsonSchema | null => {
    try {
      const parsed = JSON.parse(text);
      
      // Basic validation
      if (!parsed.self) {
        throw new Error('Schema must have a "self" property');
      }
      if (!parsed.self.name) {
        throw new Error('Schema "self.name" is required');
      }
      if (!parsed.self.version) {
        throw new Error('Schema "self.version" is required');
      }
      
      return parsed;
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError(`Invalid JSON: ${err.message}`);
      } else {
        setError(err instanceof Error ? err.message : 'Invalid schema');
      }
      return null;
    }
  };

  const handleSave = async () => {
    const validatedSchema = validateJson(jsonText);
    if (!validatedSchema) {
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await saveJsonSchema(validatedSchema);
      toast({
        title: 'Success',
        description: 'Schema saved successfully',
      });
      onSave();
    } catch (err) {
      console.error('Error saving schema:', err);
      setError(err instanceof Error ? err.message : 'Failed to save schema');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to save schema',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFormat = () => {
    const result = formatJson(jsonText);
    if (result.ok) {
      setJsonText(result.formatted);
      setError(null);
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-testid="json-schema-editor-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FileJson className="h-5 w-5" />
            <span>{schema ? 'Edit JSON Schema' : 'Create JSON Schema'}</span>
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

          <Tabs defaultValue="editor" className="w-full">
            <TabsList>
              <TabsTrigger value="editor">Editor</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Edit the JSON schema. The schema must include a &quot;self&quot; property with name and version.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleFormat}
                >
                  <Code className="h-4 w-4 mr-2" />
                  Format JSON
                </Button>
              </div>
              <JsonEditor
                value={jsonText}
                onChange={(val) => {
                  setJsonText(val);
                  setError(null);
                }}
                height={500}
              />
            </TabsContent>

            <TabsContent value="preview" className="space-y-4">
              <p className="text-sm text-muted-foreground mb-2">
                Read-only preview of the parsed schema:
              </p>
              <JsonEditor
                value={previewJson}
                readOnly
                height={500}
              />
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSaving}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || !!error}
              className="bg-secondary hover:bg-secondary-dark"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Schema'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JsonSchemaEditor;
