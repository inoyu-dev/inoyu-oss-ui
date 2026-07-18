import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  BarChart3,
} from 'lucide-react';
import type { UnomiGoal } from '@/services/client/UnomiClientService';
import {
  getAllGoals,
  getGoalDefinition,
  getGoalReport,
  deleteGoal,
  type GoalReport,
} from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';
import { useEntityList } from '@/hooks/useEntityList';
import SearchAndFilterBar from '@/components/shared/SearchAndFilterBar';
import GoalBuilder from './GoalBuilder';
import { useComponentRegistry } from '@/plugins/useComponentRegistry';

interface GoalReportViewerProps {
  goal: UnomiGoal;
  report: GoalReport;
}

const GoalList: React.FC = () => {
  const { t } = useTranslation();
  const { getComponent } = useComponentRegistry();
  const GoalReportViewer = getComponent<GoalReportViewerProps>('goals/GoalReportViewer');

  const {
    filteredItems: filteredGoals,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    filterEnabled,
    cycleFilter,
    expandedItems: expandedGoals,
    toggleExpansion: toggleGoalExpansion,
    refresh,
    handleDelete: handleDeleteGoal,
  } = useEntityList({
    fetchFn: getAllGoals,
    deleteFn: deleteGoal,
    deleteConfirmMessage: t('Are you sure you want to delete this goal? This action cannot be undone.'),
  });

  const [selectedGoal, setSelectedGoal] = useState<UnomiGoal | null>(null);
  const [goalReport, setGoalReport] = useState<GoalReport | null>(null);
  const [showGoalBuilder, setShowGoalBuilder] = useState(false);
  const [showGoalReport, setShowGoalReport] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UnomiGoal | null>(null);

  const fetchGoalDetails = useCallback(async (goalId: string) => {
    try {
      const goalDef = await getGoalDefinition(goalId);
      setSelectedGoal(goalDef);

      try {
        const report = await getGoalReport(goalId);
        setGoalReport(report);
      } catch (reportError) {
        console.warn('Could not fetch goal report:', reportError);
        setGoalReport(null);
      }
    } catch (err) {
      console.error('Error fetching goal details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch goal details');
    }
  }, [setError]);

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setShowGoalBuilder(true);
  };

  const handleEditGoal = useCallback(async (goalId: string) => {
    try {
      const goalDef = await getGoalDefinition(goalId);
      setEditingGoal(goalDef);
      setShowGoalBuilder(true);
    } catch (err) {
      console.error('Error fetching goal for editing:', err);
      setError(err instanceof Error ? err.message : 'Failed to load goal for editing');
    }
  }, [setError]);

  const handleViewReport = useCallback(async (goalId: string) => {
    try {
      const report = await getGoalReport(goalId);
      setGoalReport(report);
      setSelectedGoal(await getGoalDefinition(goalId));
      setShowGoalReport(true);
    } catch (err) {
      console.error('Error fetching goal report:', err);
      setError(err instanceof Error ? err.message : 'Failed to load goal report');
    }
  }, [setError]);

  const handleGoalSaved = useCallback(() => {
    refresh();
    setShowGoalBuilder(false);
    setEditingGoal(null);
  }, [refresh]);

  const handleBuilderClose = useCallback(() => {
    setShowGoalBuilder(false);
    setEditingGoal(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading goals...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Goals')}</h1>
        <Button onClick={handleCreateGoal}>
          <Plus className="h-4 w-4 mr-2" />
          {t('Create Goal')}
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
            <CardTitle>{t('Goals')}</CardTitle>
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterEnabled={filterEnabled}
              onCycleFilter={cycleFilter}
              onRefresh={refresh}
              searchPlaceholder={t('Search goals...')}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredGoals.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterEnabled !== null
                ? t('No goals match your filters')
                : t('No goals found. Create your first goal to get started.')}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredGoals.map((goal) => (
                <Card key={goal.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleGoalExpansion(goal.id)}
                        >
                          {expandedGoals.has(goal.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Target className="h-5 w-5 text-teal-600" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{goal.name}</h3>
                            <Badge variant={goal.enabled ? 'default' : 'secondary'}>
                              {goal.enabled ? t('Enabled') : t('Disabled')}
                            </Badge>
                          </div>
                          {goal.description && (
                            <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-muted-foreground">
                            <span>ID: {goal.id}</span>
                            {goal.scope && <span>Scope: {goal.scope}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {GoalReportViewer && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewReport(goal.id)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            {t('Report')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchGoalDetails(goal.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('View')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditGoal(goal.id)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {expandedGoals.has(goal.id) && selectedGoal?.itemId === goal.id && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">{t('Scope')}:</span> {selectedGoal.scope}
                          </div>
                          {selectedGoal.campaignId && (
                            <div>
                              <span className="font-medium">{t('Campaign')}:</span> {selectedGoal.campaignId}
                            </div>
                          )}
                        </div>
                        {selectedGoal.startEvent && (
                          <div className="mt-2">
                            <span className="font-medium">{t('Start Event')}:</span>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(selectedGoal.startEvent, null, 2)}
                            </pre>
                          </div>
                        )}
                        {selectedGoal.targetEvent && (
                          <div className="mt-2">
                            <span className="font-medium">{t('Target Event')}:</span>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(selectedGoal.targetEvent, null, 2)}
                            </pre>
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

      {showGoalBuilder && (
        <GoalBuilder
          goal={editingGoal}
          isOpen={showGoalBuilder}
          onClose={handleBuilderClose}
          onSave={handleGoalSaved}
        />
      )}

      {GoalReportViewer && showGoalReport && goalReport && selectedGoal && (
        <Dialog open={showGoalReport} onOpenChange={setShowGoalReport}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('Goal Report')}: {selectedGoal.metadata.name}</DialogTitle>
            </DialogHeader>
            <GoalReportViewer goal={selectedGoal} report={goalReport} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default GoalList;
