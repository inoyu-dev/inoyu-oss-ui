import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Target,
  Eye,
  Trash2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
} from 'lucide-react';
import {
  getAllScorings,
  getScoringDefinition,
  deleteScoring,
} from '@/services/client/UnomiClientService';
import type { UnomiScoring } from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';
import { useEntityList } from '@/hooks/useEntityList';
import SearchAndFilterBar from '@/components/shared/SearchAndFilterBar';
import ScoringBuilder from './ScoringBuilder';

const ScoringList: React.FC = () => {
  const { t } = useTranslation();

  const {
    filteredItems: filteredScorings,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    filterEnabled,
    cycleFilter,
    expandedItems: expandedScorings,
    toggleExpansion: toggleScoringExpansion,
    refresh,
    handleDelete: handleDeleteScoring,
  } = useEntityList({
    fetchFn: getAllScorings,
    deleteFn: deleteScoring,
    deleteConfirmMessage: t('Are you sure you want to delete this scoring? This action cannot be undone.'),
  });

  const [selectedScoring, setSelectedScoring] = useState<UnomiScoring | null>(null);
  const [showScoringBuilder, setShowScoringBuilder] = useState(false);
  const [editingScoring, setEditingScoring] = useState<UnomiScoring | null>(null);

  const fetchScoringDetails = useCallback(
    async (scoringId: string) => {
      try {
        const scoringDef = await getScoringDefinition(scoringId);
        setSelectedScoring(scoringDef);
      } catch (err) {
        console.error('Error fetching scoring details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch scoring details');
      }
    },
    [setError]
  );

  const handleCreateScoring = () => {
    setEditingScoring(null);
    setShowScoringBuilder(true);
  };

  const handleEditScoring = useCallback(
    async (scoringId: string) => {
      try {
        const scoringDef = await getScoringDefinition(scoringId);
        setEditingScoring(scoringDef);
        setShowScoringBuilder(true);
      } catch (err) {
        console.error('Error fetching scoring for editing:', err);
        setError(err instanceof Error ? err.message : 'Failed to load scoring for editing');
      }
    },
    [setError]
  );

  const handleScoringSaved = useCallback(() => {
    refresh();
    setShowScoringBuilder(false);
    setEditingScoring(null);
  }, [refresh]);

  const handleBuilderClose = useCallback(() => {
    setShowScoringBuilder(false);
    setEditingScoring(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading scorings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Scoring')}</h1>
        <Button onClick={handleCreateScoring}>
          <Plus className="h-4 w-4 mr-2" />
          {t('Create Scoring')}
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
            <CardTitle>{t('Scoring Definitions')}</CardTitle>
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterEnabled={filterEnabled}
              onCycleFilter={cycleFilter}
              onRefresh={refresh}
              searchPlaceholder={t('Search scorings...')}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredScorings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterEnabled !== null
                ? t('No scorings match your filters')
                : t('No scorings found. Create your first scoring definition to get started.')}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredScorings.map((scoring) => (
                <Card key={scoring.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleScoringExpansion(scoring.id)}
                        >
                          {expandedScorings.has(scoring.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Target className="h-5 w-5 text-teal-600" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{scoring.name}</h3>
                            <Badge variant={scoring.enabled ? 'default' : 'secondary'}>
                              {scoring.enabled ? t('Enabled') : t('Disabled')}
                            </Badge>
                          </div>
                          {scoring.description && (
                            <p className="text-sm text-muted-foreground mt-1">{scoring.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-muted-foreground">
                            <span>ID: {scoring.id}</span>
                            {scoring.scope && <span>Scope: {scoring.scope}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchScoringDetails(scoring.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('View')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditScoring(scoring.id)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteScoring(scoring.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {expandedScorings.has(scoring.id) && selectedScoring?.itemId === scoring.id && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">{t('Scope')}:</span> {selectedScoring.scope}
                          </div>
                          <div>
                            <span className="font-medium">{t('Elements')}:</span> {selectedScoring.elements?.length || 0}
                          </div>
                        </div>
                        {selectedScoring.elements && selectedScoring.elements.length > 0 && (
                          <div className="mt-2">
                            <span className="font-medium">{t('Scoring Elements')}:</span>
                            <div className="mt-1 space-y-2">
                              {selectedScoring.elements.map((element, index) => (
                                <div key={index} className="p-2 bg-muted rounded text-xs">
                                  <div className="font-medium">Value: {element.value}</div>
                                  <pre className="mt-1 overflow-auto">
                                    {JSON.stringify(element.condition, null, 2)}
                                  </pre>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showScoringBuilder && (
        <ScoringBuilder
          scoring={editingScoring}
          isOpen={showScoringBuilder}
          onClose={handleBuilderClose}
          onSave={handleScoringSaved}
        />
      )}
    </div>
  );
};

export default ScoringList;
