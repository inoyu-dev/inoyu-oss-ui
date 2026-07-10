import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Code,
  Eye,
  RefreshCw,
  Search,
  ChevronRight,
  ChevronDown,
  Plus,
  Play,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import GroovyActionEditor from './GroovyActionEditor';

interface GroovyAction {
  id: string;
  name: string;
  version?: string;
  scope?: string;
  deployed?: boolean;
}

const GroovyActionList: React.FC = () => {
  const [actions, setActions] = useState<GroovyAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditor, setShowEditor] = useState(false);
  const [editingAction, setEditingAction] = useState<GroovyAction | null>(null);
  const { t } = useTranslation();
  const { featureFlags } = useFeatureFlags();
  const canUse = featureFlags.groovyActions;

  const fetchActions = useCallback(async () => {
    if (!canUse) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Note: Groovy actions may not have a standard list endpoint
      // This is a placeholder - actual implementation depends on Unomi API
      setActions([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch groovy actions');
      console.error('Error fetching groovy actions:', err);
    } finally {
      setLoading(false);
    }
  }, [canUse]);

  const toggleActionExpansion = (actionId: string) => {
    const newExpanded = new Set(expandedActions);
    if (newExpanded.has(actionId)) {
      newExpanded.delete(actionId);
    } else {
      newExpanded.add(actionId);
    }
    setExpandedActions(newExpanded);
  };

  const filteredActions = actions.filter(action => {
    return action.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           action.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  if (!canUse) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{t('Groovy Actions')}</h1>
        <Alert>
          <AlertTitle>{t('Feature Unavailable')}</AlertTitle>
          <AlertDescription>
            {t('Groovy actions are not available in this deployment type.')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading groovy actions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Groovy Actions')}</h1>
        <Button onClick={() => {
          setEditingAction(null);
          setShowEditor(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          {t('Deploy Action')}
        </Button>
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
            <CardTitle>{t('Groovy Actions')}</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-text" />
                <Input
                  placeholder={t('Search actions...')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button variant="outline" size="sm" onClick={fetchActions}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredActions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm
                ? t('No actions match your search')
                : t('No groovy actions found. Deploy your first action to get started.')}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredActions.map((action) => (
                <Card key={action.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActionExpansion(action.id)}
                        >
                          {expandedActions.has(action.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Code className="h-5 w-5 text-teal-600" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{action.name}</h3>
                            {action.deployed && (
                              <Badge variant="default">{t('Deployed')}</Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 mt-2 text-muted-foreground">
                            <span>ID: {action.id}</span>
                            {action.scope && <span>Scope: {action.scope}</span>}
                            {action.version && <span>Version: {action.version}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingAction(action);
                            setShowEditor(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('View')}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-2" />
                          {t('Test')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showEditor && (
        <GroovyActionEditor
          action={editingAction}
          isOpen={showEditor}
          onClose={() => {
            setShowEditor(false);
            setEditingAction(null);
          }}
          onSave={() => {
            fetchActions();
            setShowEditor(false);
            setEditingAction(null);
          }}
        />
      )}
    </div>
  );
};

export default GroovyActionList;
