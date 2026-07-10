import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { 
  X, 
  Code, 
  CheckCircle2,
  AlertTriangle,
  Play,
  FileJson
} from 'lucide-react';
import { 
  validateEvent,
  ValidationError
} from '@/services/client/UnomiClientService';
import { JsonEditor, formatJson } from '@/components/json';

interface EventValidatorProps {
  isOpen: boolean;
  onClose: () => void;
}

const EventValidator: React.FC<EventValidatorProps> = ({
  isOpen,
  onClose
}) => {
  const { toast } = useToast();
  const [eventJson, setEventJson] = useState('');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleValidate = async () => {
    // First validate JSON syntax
    let parsedEvent: Record<string, unknown>;
    try {
      parsedEvent = JSON.parse(eventJson);
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
      return;
    }

    setIsValidating(true);
    setValidationErrors([]);

    try {
      const errors = await validateEvent(parsedEvent);
      setValidationErrors(errors);
      
      if (errors.length === 0) {
        toast({
          title: 'Success',
          description: 'Event is valid according to the schemas',
        });
      } else {
        toast({
          title: 'Validation Failed',
          description: `Found ${errors.length} validation error(s)`,
          variant: 'destructive',
        });
      }
    } catch (err) {
      console.error('Error validating event:', err);
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to validate event',
        variant: 'destructive',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleFormat = () => {
    const result = formatJson(eventJson);
    if (result.ok) {
      setEventJson(result.formatted);
      setJsonError(null);
    } else {
      setJsonError(result.error);
    }
  };

  const loadExampleEvent = () => {
    const example = {
      itemId: 'event-123',
      eventType: 'view',
      scope: 'web',
      timeStamp: new Date().toISOString(),
      source: {
        itemId: 'site-1',
        itemType: 'site',
        scope: 'web'
      },
      properties: {
        pageId: '/home',
        pageTitle: 'Home Page'
      }
    };
    setEventJson(JSON.stringify(example, null, 2));
    setJsonError(null);
    setValidationErrors([]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-testid="event-validator-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5" />
            <span>Validate Event</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Enter an event JSON to validate against installed schemas
            </p>
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={loadExampleEvent}
              >
                <FileJson className="h-4 w-4 mr-2" />
                Load Example
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleFormat}
              >
                <Code className="h-4 w-4 mr-2" />
                Format JSON
              </Button>
            </div>
          </div>

          {jsonError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>JSON Error</AlertTitle>
              <AlertDescription>{jsonError}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="editor" className="w-full">
            <TabsList>
              <TabsTrigger value="editor">Event JSON</TabsTrigger>
              <TabsTrigger value="results">
                Results
                {validationErrors.length > 0 && (
                  <span className="ml-2 bg-destructive text-destructive-foreground rounded-full px-2 py-0.5 text-xs">
                    {validationErrors.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              <JsonEditor
                value={eventJson}
                onChange={(val) => {
                  setEventJson(val);
                  setJsonError(null);
                  setValidationErrors([]);
                }}
                height={400}
              />
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {validationErrors.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>No Validation Errors</AlertTitle>
                  <AlertDescription>
                    The event is valid according to all installed schemas.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Validation Errors</AlertTitle>
                    <AlertDescription>
                      Found {validationErrors.length} validation error(s)
                    </AlertDescription>
                  </Alert>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {validationErrors.map((error, index) => (
                      <Alert key={index} variant="destructive">
                        <AlertTitle className="text-sm font-semibold">
                          {error.path || 'Root'}
                        </AlertTitle>
                        <AlertDescription className="text-sm">
                          <div className="mt-1">
                            <div><strong>Message:</strong> {error.message}</div>
                            {error.schemaPath && (
                              <div><strong>Schema Path:</strong> {error.schemaPath}</div>
                            )}
                          </div>
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>

          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
            <Button
              onClick={handleValidate}
              disabled={isValidating || !eventJson.trim() || !!jsonError}
              className="bg-success hover:bg-success-dark"
            >
              <Play className="h-4 w-4 mr-2" />
              {isValidating ? 'Validating...' : 'Validate Event'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventValidator;
