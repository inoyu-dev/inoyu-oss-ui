import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Code,
  Eye,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronDown,
  Lock,
} from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface ActionType {
  itemId: string;
  itemType?: string;
  scope: string;
  version?: number;
  metadata?: {
    id: string;
    name: string;
    description?: string;
    scope: string;
    tags?: string[];
    systemTags?: string[];
    enabled?: boolean;
    readOnly?: boolean;
  };
  // Support for flat RESTActionType structure from API
  id?: string;
  name?: string;
  description?: string;
  tags?: string[];
  systemTags?: string[];
  enabled?: boolean;
  actionExecutor: string;
  parameters?: Array<{
    id: string;
    type: string;
    multivalued?: boolean;
    required?: boolean;
    defaultValue?: unknown;
    [key: string]: unknown;
  }>;
}

const ActionTypeList: React.FC = () => {
  const [actionTypes, setActionTypes] = useState<ActionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<ActionType | null>(null);
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useTranslation();
  const { featureFlags } = useFeatureFlags();
  const canDeploy = featureFlags.actionTypeDeployment;

  // Normalize action type from API (handles both flat and nested structures)
  const normalizeActionType = useCallback((type: Partial<ActionType> & Record<string, unknown>): ActionType => {
    // If it already has metadata, return as-is
    if (type.metadata) {
      return {
        ...type,
        itemId: type.itemId || type.metadata.id || type.id || '',
        scope: type.scope || type.metadata.scope || '',
        actionExecutor: type.actionExecutor || '',
        parameters: type.parameters || [],
      } as ActionType;
    }
    
    // Handle flat RESTActionType structure
    return {
      itemId: type.itemId || type.id || '',
      itemType: type.itemType,
      scope: type.scope || '',
      version: type.version,
      metadata: {
        id: type.id || type.itemId || '',
        name: type.name || type.id || 'Unknown',
        description: type.description,
        scope: type.scope || '',
        tags: type.tags,
        systemTags: type.systemTags,
        enabled: type.enabled !== undefined ? Boolean(type.enabled) : true,
        readOnly: type.readOnly !== undefined ? Boolean(type.readOnly) : undefined,
      },
      actionExecutor: type.actionExecutor || '',
      parameters: type.parameters || [],
    };
  }, []);

  const fetchActionTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/cxs/definitions/actions', {
        headers: {
          'Accept-Language': 'en',
        },
      });
      const rawData = response.data || [];
      const normalized = rawData.map(normalizeActionType);
      setActionTypes(normalized);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch action types');
      console.error('Error fetching action types:', err);
    } finally {
      setLoading(false);
    }
  }, [normalizeActionType]);

  const toggleTypeExpansion = (typeId: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeId)) {
      newExpanded.delete(typeId);
    } else {
      newExpanded.add(typeId);
    }
    setExpandedTypes(newExpanded);
  };

  const filteredTypes = actionTypes.filter(type => {
    const metadata = type.metadata;
    const name = metadata?.name || type.name || '';
    const description = metadata?.description || type.description || '';
    const itemId = type.itemId || '';
    
    return !searchTerm || 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      itemId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    fetchActionTypes();
  }, [fetchActionTypes]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading action types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('Action Types')}</h1>
          {!canDeploy && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              {t('Read-only mode. Deployment is disabled in this environment.')}
            </p>
          )}
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('Action Types')}</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-text" />
                <Input
                  placeholder={t('Search action types...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchActionTypes}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredTypes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? t('No action types match your search') : t('No action types found')}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredTypes.map((type) => (
                <Card key={type.itemId} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleTypeExpansion(type.itemId)}
                        >
                          {expandedTypes.has(type.itemId) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Code className="h-5 w-5 text-secondary" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{type.metadata?.name || type.name || type.itemId || 'Unknown'}</h3>
                            {type.metadata?.readOnly && (
                              <Badge variant="secondary">{t('Read-only')}</Badge>
                            )}
                            {(type.metadata?.enabled !== false && type.enabled !== false) ? (
                              <Badge variant="default">{t('Enabled')}</Badge>
                            ) : (
                              <Badge variant="secondary">{t('Disabled')}</Badge>
                            )}
                          </div>
                          {(type.metadata?.description || type.description) && (
                            <p className="text-sm text-muted-foreground mt-1">{type.metadata?.description || type.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                            <span>ID: {type.itemId}</span>
                            <span>Scope: {type.scope}</span>
                            <span>Executor: {type.actionExecutor}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedType(type)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('View')}
                        </Button>
                      </div>
                    </div>
                    {expandedTypes.has(type.itemId) && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="space-y-2">
                          <div>
                            <span className="font-medium">{t('Parameters')}:</span>
                            {!type.parameters || type.parameters.length === 0 ? (
                              <p className="text-sm text-muted-foreground mt-1">{t('No parameters')}</p>
                            ) : (
                              <div className="mt-2 space-y-2">
                                {(type.parameters || []).map((param, index) => (
                                  <div key={index} className="p-2 bg-muted rounded text-sm">
                                    <div className="font-medium">{param.id}</div>
                                    <div className="text-xs text-muted-foreground">
                                      Type: {param.type}
                                      {param.required && ' • Required'}
                                      {param.multivalued && ' • Multivalued'}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedType && (
        <Dialog open={!!selectedType} onOpenChange={() => setSelectedType(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedType.metadata?.name || selectedType.name || selectedType.itemId || 'Unknown'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">{t('Description')}</h3>
                <p className="text-sm text-foreground">
                  {selectedType.metadata?.description || selectedType.description || t('No description available')}
                </p>
              </div>
              <div>
                <h3 className="font-medium mb-2">{t('Executor')}</h3>
                <p className="text-sm text-foreground font-mono">{selectedType.actionExecutor}</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">{t('Parameters')}</h3>
                {!selectedType.parameters || selectedType.parameters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('No parameters')}</p>
                ) : (
                  <div className="space-y-2">
                    {(selectedType.parameters || []).map((param, index) => (
                      <Card key={index} className="border">
                        <CardContent className="p-3">
                          <div className="font-medium">{param.id}</div>
                          <div className="text-sm text-muted-foreground mt-1">
                            <div>Type: {param.type}</div>
                            {param.required && <div>Required: Yes</div>}
                            {param.multivalued && <div>Multivalued: Yes</div>}
                            {param.defaultValue !== undefined && (
                              <div>Default: {JSON.stringify(param.defaultValue)}</div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ActionTypeList;
