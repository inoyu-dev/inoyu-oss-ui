import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'next-i18next/pages';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Search,
  Eye,
  FileJson,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Download
} from 'lucide-react';
import { 
  getAllJsonSchemas,
  getJsonSchema,
  deleteJsonSchema,
  JsonSchema
} from '@/services/client/UnomiClientService';
import { useToast } from '@/components/ui/use-toast';
import JsonSchemaEditor from './JsonSchemaEditor';
import EventValidator from './EventValidator';

const JsonSchemaList: React.FC = () => {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const [schemaIds, setSchemaIds] = useState<string[]>([]);
  const [schemas, setSchemas] = useState<Map<string, JsonSchema>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchema, setSelectedSchema] = useState<JsonSchema | null>(null);
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [editingSchema, setEditingSchema] = useState<JsonSchema | null>(null);
  const [showValidator, setShowValidator] = useState(false);

  const fetchSchemas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const ids = await getAllJsonSchemas();
      setSchemaIds(ids);
      
      // Fetch all schema details
      const schemaMap = new Map<string, JsonSchema>();
      for (const id of ids) {
        try {
          const schema = await getJsonSchema(id);
          schemaMap.set(id, schema);
        } catch (err) {
          console.error(`Error fetching schema ${id}:`, err);
        }
      }
      setSchemas(schemaMap);
    } catch (err) {
      console.error('Error fetching schemas:', err);
      setError(err instanceof Error ? err.message : t('Failed to fetch schemas'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  const handleCreateSchema = () => {
    setEditingSchema(null);
    setShowEditor(true);
  };

  const handleEditSchema = async (schemaId: string) => {
    try {
      const schema = schemas.get(schemaId) || await getJsonSchema(schemaId);
      setEditingSchema(schema);
      setShowEditor(true);
    } catch (err) {
      console.error('Error fetching schema for editing:', err);
      toast({
        title: t('Error'),
        description: t('Failed to load schema for editing'),
        variant: 'destructive',
      });
    }
  };

  const handleViewSchema = async (schemaId: string) => {
    try {
      const schema = schemas.get(schemaId) || await getJsonSchema(schemaId);
      setSelectedSchema(schema);
      setSelectedSchemaId(schemaId);
    } catch (err) {
      console.error('Error fetching schema details:', err);
      toast({
        title: t('Error'),
        description: t('Failed to load schema details'),
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSchema = async (schemaId: string) => {
    if (!confirm(`Are you sure you want to delete schema "${schemaId}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deleteJsonSchema(schemaId);
      toast({
        title: t('Success'),
        description: t('Schema deleted successfully'),
      });
      await fetchSchemas();
    } catch (err) {
      console.error('Error deleting schema:', err);
      toast({
        title: t('Error'),
        description: err instanceof Error ? err.message : t('Failed to delete schema'),
        variant: 'destructive',
      });
    }
  };

  const handleSchemaSaved = () => {
    fetchSchemas();
    setShowEditor(false);
    setEditingSchema(null);
  };

  const handleCopySchema = (schema: JsonSchema) => {
    navigator.clipboard.writeText(JSON.stringify(schema, null, 2));
    toast({
      title: t('Copied'),
      description: t('Schema JSON copied to clipboard'),
    });
  };

  const handleDownloadSchema = (schema: JsonSchema, schemaId: string) => {
    const blob = new Blob([JSON.stringify(schema, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${schemaId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: t('Downloaded'),
      description: t('Schema downloaded successfully'),
    });
  };

  const filteredSchemaIds = schemaIds.filter(id => {
    const schema = schemas.get(id);
    const matchesSearch = !searchTerm || 
      id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schema?.self?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      schema?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('Loading schemas...')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>{t('Error')}</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button onClick={fetchSchemas} className="mt-2" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          {t('Retry')}
        </Button>
      </Alert>
    );
  }

  return (
    <div className="space-y-6" data-testid="schemas-list">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('JSON Schemas')}</h1>
          <p className="text-muted-foreground">
            Manage Apache Unomi JSON schemas for event validation
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => setShowValidator(true)}
            variant="outline"
            data-testid="validate-schema"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {t('Validate Event')}
          </Button>
          <Button 
            onClick={handleCreateSchema}
            className="bg-secondary hover:bg-secondary-dark"
            data-testid="create-schema"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('Create Schema')}
          </Button>
          <Button onClick={fetchSchemas} variant="outline" data-testid="refresh-schemas">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('Refresh')}
          </Button>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder={t('Search schemas...')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-info"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schemas List */}
      <div className="space-y-4">
        {filteredSchemaIds.length === 0 ? (
          <Card data-testid="schemas-empty-state">
            <CardContent className="pt-6">
              <div className="text-center text-muted-foreground">
                <FileJson className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{t('No schemas found')}</p>
                {searchTerm && (
                  <p className="text-sm">{t('Try adjusting your search criteria')}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredSchemaIds.map((schemaId) => {
            const schema = schemas.get(schemaId);
            return (
              <Card key={schemaId} className="hover:shadow-md transition-shadow" data-testid={`schema-item-${schemaId}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileJson className="h-5 w-5 text-secondary" />
                      <div>
                        <CardTitle className="text-lg">{schema?.title || schemaId}</CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline">
                            {schema?.self?.name || 'Unknown'}
                          </Badge>
                          {schema?.self?.version && (
                            <Badge variant="outline">
                              v{schema.self.version}
                            </Badge>
                          )}
                          {schema?.self?.target && (
                            <Badge variant="outline">
                              {schema.self.target}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditSchema(schemaId)}
                        data-testid={`edit-schema-${schemaId}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        {t('Edit')}
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewSchema(schemaId)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            {t('View')}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>{schema?.title || schemaId}</DialogTitle>
                          </DialogHeader>
                          {selectedSchema && (
                            <Tabs defaultValue="overview" className="w-full">
                              <TabsList className="grid w-full grid-cols-3">
                                <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
                                <TabsTrigger value="json">JSON</TabsTrigger>
                                <TabsTrigger value="properties">{t('Properties')}</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="overview" className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">{t('Schema Information')}</h3>
                                    <div className="space-y-2 text-sm">
                                      <div><strong>ID:</strong> {selectedSchemaId}</div>
                                      {selectedSchema.$id && (
                                        <div><strong>$id:</strong> {selectedSchema.$id}</div>
                                      )}
                                      {selectedSchema.$schema && (
                                        <div><strong>$schema:</strong> {selectedSchema.$schema}</div>
                                      )}
                                      {selectedSchema.title && (
                                        <div><strong>Title:</strong> {selectedSchema.title}</div>
                                      )}
                                      {selectedSchema.type && (
                                        <div><strong>Type:</strong> {selectedSchema.type}</div>
                                      )}
                                    </div>
                                  </div>
                                  <div>
                                    <h3 className="font-semibold mb-2">{t('Self Metadata')}</h3>
                                    {selectedSchema.self ? (
                                      <div className="space-y-2 text-sm">
                                        <div><strong>Vendor:</strong> {selectedSchema.self.vendor}</div>
                                        <div><strong>Target:</strong> {selectedSchema.self.target}</div>
                                        <div><strong>Name:</strong> {selectedSchema.self.name}</div>
                                        <div><strong>Format:</strong> {selectedSchema.self.format}</div>
                                        <div><strong>Version:</strong> {selectedSchema.self.version}</div>
                                      </div>
                                    ) : (
                                      <p className="text-sm text-muted-foreground">{t('No self metadata')}</p>
                                    )}
                                  </div>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="json" className="space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-semibold">{t('Schema JSON')}</h3>
                                  <div className="flex items-center space-x-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleCopySchema(selectedSchema)}
                                    >
                                      <Copy className="h-4 w-4 mr-2" />
                                      {t('Copy')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadSchema(selectedSchema, selectedSchemaId || 'schema')}
                                    >
                                      <Download className="h-4 w-4 mr-2" />
                                      {t('Download')}
                                    </Button>
                                  </div>
                                </div>
                                <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                  {JSON.stringify(selectedSchema, null, 2)}
                                </pre>
                              </TabsContent>
                              
                              <TabsContent value="properties" className="space-y-4">
                                <div>
                                  <h3 className="font-semibold mb-2">{t('Schema Properties')}</h3>
                                  {selectedSchema.properties ? (
                                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                      {JSON.stringify(selectedSchema.properties, null, 2)}
                                    </pre>
                                  ) : (
                                    <p className="text-sm text-muted-foreground">{t('No properties defined')}</p>
                                  )}
                                </div>
                                {selectedSchema.required && selectedSchema.required.length > 0 && (
                                  <div>
                                    <h3 className="font-semibold mb-2">{t('Required Fields')}</h3>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedSchema.required.map((field, index) => (
                                        <Badge key={index} variant="secondary">
                                          {field}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </TabsContent>
                            </Tabs>
                          )}
                        </DialogContent>
                      </Dialog>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteSchema(schemaId)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {t('Delete')}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })
        )}
      </div>

      {/* Schema Editor Dialog */}
      <JsonSchemaEditor
        schema={editingSchema ?? undefined}
        isOpen={showEditor}
        onClose={() => {
          setShowEditor(false);
          setEditingSchema(null);
        }}
        onSave={handleSchemaSaved}
      />

      {/* Event Validator Dialog */}
      <EventValidator
        isOpen={showValidator}
        onClose={() => setShowValidator(false)}
      />
    </div>
  );
};

export default JsonSchemaList;
