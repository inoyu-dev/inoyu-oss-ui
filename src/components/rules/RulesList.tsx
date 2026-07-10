import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings,
  Eye,
  Trash2,
  RefreshCw,
  Calendar,
  Tag,
  ChevronRight,
  ChevronDown,
  Activity,
  Clock,
  Zap,
  Target,
  BarChart3,
  RotateCcw,
  Plus,
  Edit3,
} from 'lucide-react';
import {
  getAllRules,
  getRuleDefinition,
  getRuleStatistics,
  getAllRuleStatistics,
  deleteRule,
  resetAllRuleStatistics,
  type UnomiMetadata,
  type UnomiRule,
  type UnomiRuleStatistics,
} from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';
import { useEntityList } from '@/hooks/useEntityList';
import SearchAndFilterBar from '@/components/shared/SearchAndFilterBar';
import RuleBuilder from './RuleBuilder';

interface RuleWithStats extends UnomiMetadata {
  statistics?: UnomiRuleStatistics;
}

const formatTime = (timeMs: number): string => {
  if (timeMs < 1000) return `${timeMs}ms`;
  if (timeMs < 60000) return `${(timeMs / 1000).toFixed(1)}s`;
  return `${(timeMs / 60000).toFixed(1)}m`;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const RulesList: React.FC = () => {
  const { t } = useTranslation();

  const fetchRulesWithStats = useCallback(async (): Promise<RuleWithStats[]> => {
    const rulesData = await getAllRules();
    const allStats = await getAllRuleStatistics();
    return rulesData.map((rule) => ({
      ...rule,
      statistics: allStats[rule.id],
    }));
  }, []);

  const {
    filteredItems: filteredRules,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    filterEnabled,
    cycleFilter,
    expandedItems: expandedRules,
    toggleExpansion: toggleRuleExpansion,
    refresh,
    handleDelete: handleDeleteRule,
  } = useEntityList({
    fetchFn: fetchRulesWithStats,
    deleteFn: deleteRule,
    deleteConfirmMessage: t('Are you sure you want to delete this rule? This action cannot be undone.'),
  });

  const [selectedRule, setSelectedRule] = useState<UnomiRule | null>(null);
  const [ruleStatistics, setRuleStatistics] = useState<UnomiRuleStatistics | null>(null);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<UnomiRule | null>(null);

  const fetchRuleDetails = useCallback(
    async (ruleId: string) => {
      try {
        setStatisticsLoading(true);
        const [ruleDef, stats] = await Promise.all([
          getRuleDefinition(ruleId),
          getRuleStatistics(ruleId),
        ]);
        setSelectedRule(ruleDef);
        setRuleStatistics(stats);
      } catch (err) {
        console.error('Error fetching rule details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch rule details');
      } finally {
        setStatisticsLoading(false);
      }
    },
    [setError]
  );

  const handleResetStatistics = useCallback(async () => {
    if (!confirm(t('Are you sure you want to reset all rule statistics? This action cannot be undone.'))) {
      return;
    }
    try {
      await resetAllRuleStatistics();
      await refresh();
    } catch (err) {
      console.error('Error resetting statistics:', err);
      setError(err instanceof Error ? err.message : 'Failed to reset statistics');
    }
  }, [refresh, setError, t]);

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowRuleBuilder(true);
  };

  const handleEditRule = useCallback(
    async (ruleId: string) => {
      try {
        const ruleDef = await getRuleDefinition(ruleId);
        setEditingRule(ruleDef);
        setShowRuleBuilder(true);
      } catch (err) {
        console.error('Error fetching rule for editing:', err);
        setError(err instanceof Error ? err.message : 'Failed to load rule for editing');
      }
    },
    [setError]
  );

  const handleRuleSaved = useCallback(() => {
    refresh();
    setShowRuleBuilder(false);
    setEditingRule(null);
  }, [refresh]);

  const handleBuilderClose = useCallback(() => {
    setShowRuleBuilder(false);
    setEditingRule(null);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">{t('Loading rules...')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('Rules')}</h1>
          <p className="text-muted-foreground">
            {t('Manage automation rules and view their execution statistics')}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={handleCreateRule}
            className="bg-secondary hover:bg-secondary-dark"
            data-testid="create-rule"
          >
            <Plus className="h-4 w-4 mr-2" />
            {t('Create Rule')}
          </Button>
          <Button onClick={handleResetStatistics} variant="outline" size="sm" data-testid="reset-rule-stats">
            <RotateCcw className="h-4 w-4 mr-2" />
            {t('Reset Stats')}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>{t('Error')}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('Rules')}</CardTitle>
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterEnabled={filterEnabled}
              onCycleFilter={cycleFilter}
              onRefresh={refresh}
              searchPlaceholder={t('Search rules by name, description, or ID...')}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredRules.length === 0 ? (
            <Card data-testid="rules-empty-state">
              <CardContent className="pt-6">
                <div className="text-center text-muted-foreground">
                  <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>
                    {searchTerm || filterEnabled !== null
                      ? t('No rules match your filters')
                      : t('No rules found')}
                  </p>
                  {searchTerm && <p className="text-sm">{t('Try adjusting your search criteria')}</p>}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4" data-testid="rules-list">
              {filteredRules.map((rule) => (
                <Card
                  key={rule.id}
                  className="hover:shadow-md transition-shadow"
                  data-testid={`rule-item-${rule.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRuleExpansion(rule.id)}
                          className="p-1"
                        >
                          {expandedRules.has(rule.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <div>
                          <CardTitle className="text-lg">{rule.name}</CardTitle>
                          <div className="flex items-center space-x-2 mt-1">
                            <Badge variant={rule.enabled ? 'default' : 'secondary'}>
                              {rule.enabled ? t('Enabled') : t('Disabled')}
                            </Badge>
                            {rule.statistics && (
                              <>
                                <Badge variant="outline">
                                  <Activity className="h-3 w-3 mr-1" />
                                  {formatNumber(rule.statistics.executionCount)} {t('executions')}
                                </Badge>
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatTime(rule.statistics.conditionsTime + rule.statistics.actionsTime)} avg
                                </Badge>
                              </>
                            )}
                            {rule.tags && rule.tags.length > 0 && (
                              <Badge variant="outline">
                                <Tag className="h-3 w-3 mr-1" />
                                {rule.tags.length} {t('tags')}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditRule(rule.id)}
                          data-testid={`edit-rule-${rule.id}`}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {t('Edit')}
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => fetchRuleDetails(rule.id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {t('View Details')}
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{rule.name}</DialogTitle>
                            </DialogHeader>
                            {selectedRule && (
                              <Tabs defaultValue="overview" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                  <TabsTrigger value="overview">{t('Overview')}</TabsTrigger>
                                  <TabsTrigger value="condition">{t('Condition')}</TabsTrigger>
                                  <TabsTrigger value="actions">{t('Actions')}</TabsTrigger>
                                  <TabsTrigger value="statistics">{t('Statistics')}</TabsTrigger>
                                </TabsList>
                                <TabsContent value="overview" className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <h3 className="font-semibold mb-2">{t('Basic Information')}</h3>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <strong>ID:</strong> {selectedRule.itemId}
                                        </div>
                                        <div>
                                          <strong>{t('Scope')}:</strong> {selectedRule.scope}
                                        </div>
                                        <div>
                                          <strong>{t('Version')}:</strong> {selectedRule.version}
                                        </div>
                                        <div>
                                          <strong>{t('Enabled')}:</strong>{' '}
                                          {selectedRule.metadata.enabled ? t('Yes') : t('No')}
                                        </div>
                                        <div>
                                          <strong>{t('Priority')}:</strong> {selectedRule.priority || t('Default')}
                                        </div>
                                        {selectedRule.metadata.description && (
                                          <div>
                                            <strong>{t('Description')}:</strong>{' '}
                                            {selectedRule.metadata.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <h3 className="font-semibold mb-2">{t('Rule Settings')}</h3>
                                      <div className="space-y-2 text-sm">
                                        <div>
                                          <strong>{t('Once per Profile')}:</strong>{' '}
                                          {selectedRule.raiseEventOnlyOnceForProfile ? t('Yes') : t('No')}
                                        </div>
                                        <div>
                                          <strong>{t('Once per Session')}:</strong>{' '}
                                          {selectedRule.raiseEventOnlyOnceForSession ? t('Yes') : t('No')}
                                        </div>
                                        <div>
                                          <strong>{t('Once Total')}:</strong>{' '}
                                          {selectedRule.raiseEventOnlyOnce ? t('Yes') : t('No')}
                                        </div>
                                        {selectedRule.linkedItems && selectedRule.linkedItems.length > 0 && (
                                          <div>
                                            <strong>{t('Linked Items')}:</strong>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              {selectedRule.linkedItems.map((item, index) => (
                                                <Badge key={index} variant="secondary" className="text-xs">
                                                  {item}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  {selectedRule.metadata.tags && selectedRule.metadata.tags.length > 0 && (
                                    <div>
                                      <h3 className="font-semibold mb-2">{t('Tags')}</h3>
                                      <div className="flex flex-wrap gap-1">
                                        {selectedRule.metadata.tags.map((tag, index) => (
                                          <Badge key={index} variant="secondary" className="text-xs">
                                            {tag}
                                          </Badge>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </TabsContent>
                                <TabsContent value="condition" className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">{t('Rule Condition')}</h3>
                                    <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto">
                                      {JSON.stringify(selectedRule.condition, null, 2)}
                                    </pre>
                                  </div>
                                </TabsContent>
                                <TabsContent value="actions" className="space-y-4">
                                  <div>
                                    <h3 className="font-semibold mb-2">
                                      {t('Rule Actions')} ({selectedRule.actions.length})
                                    </h3>
                                    {selectedRule.actions.length === 0 ? (
                                      <div className="text-center text-muted-foreground py-8">
                                        <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>{t('No actions configured for this rule')}</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-3">
                                        {selectedRule.actions.map((action, index) => (
                                          <Card key={index} className="p-4">
                                            <div className="flex items-center justify-between mb-2">
                                              <div className="flex items-center space-x-2">
                                                <Zap className="h-4 w-4 text-info" />
                                                <span className="font-medium">
                                                  {action.actionType?.metadata?.name ||
                                                    action.actionTypeId ||
                                                    t('Unknown Action')}
                                                </span>
                                              </div>
                                              <Badge variant="outline">
                                                {action.actionType?.itemType || action.actionTypeId}
                                              </Badge>
                                            </div>
                                            {action.actionType?.metadata?.description && (
                                              <p className="text-sm text-muted-foreground mb-2">
                                                {action.actionType.metadata.description}
                                              </p>
                                            )}
                                            {action.actionType?.actionExecutor && (
                                              <div className="text-xs text-muted-foreground mb-2">
                                                <strong>{t('Executor')}:</strong>{' '}
                                                {action.actionType.actionExecutor}
                                              </div>
                                            )}
                                            {Object.keys(action.parameterValues).length > 0 && (
                                              <div>
                                                <h4 className="text-sm font-medium mb-1">{t('Parameters')}:</h4>
                                                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                                                  {JSON.stringify(action.parameterValues, null, 2)}
                                                </pre>
                                              </div>
                                            )}
                                          </Card>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </TabsContent>
                                <TabsContent value="statistics" className="space-y-4">
                                  <div className="flex items-center justify-between">
                                    <h3 className="font-semibold">{t('Execution Statistics')}</h3>
                                    {statisticsLoading && <RefreshCw className="h-4 w-4 animate-spin" />}
                                  </div>
                                  {ruleStatistics ? (
                                    <div className="grid grid-cols-2 gap-4">
                                      <Card className="p-4">
                                        <h4 className="font-semibold mb-3 flex items-center">
                                          <Activity className="h-4 w-4 mr-2" />
                                          {t('Execution Counts')}
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span>{t('Total Executions')}:</span>
                                            <span className="font-medium">
                                              {formatNumber(ruleStatistics.executionCount)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>{t('Local Executions')}:</span>
                                            <span className="font-medium">
                                              {formatNumber(ruleStatistics.localExecutionCount)}
                                            </span>
                                          </div>
                                        </div>
                                      </Card>
                                      <Card className="p-4">
                                        <h4 className="font-semibold mb-3 flex items-center">
                                          <Clock className="h-4 w-4 mr-2" />
                                          {t('Execution Times')}
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span>{t('Conditions Time')}:</span>
                                            <span className="font-medium">
                                              {formatTime(ruleStatistics.conditionsTime)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>{t('Actions Time')}:</span>
                                            <span className="font-medium">
                                              {formatTime(ruleStatistics.actionsTime)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>{t('Total Time')}:</span>
                                            <span className="font-medium">
                                              {formatTime(
                                                ruleStatistics.conditionsTime + ruleStatistics.actionsTime
                                              )}
                                            </span>
                                          </div>
                                        </div>
                                      </Card>
                                      <Card className="p-4">
                                        <h4 className="font-semibold mb-3 flex items-center">
                                          <BarChart3 className="h-4 w-4 mr-2" />
                                          {t('Local Times')}
                                        </h4>
                                        <div className="space-y-2 text-sm">
                                          <div className="flex justify-between">
                                            <span>{t('Local Conditions')}:</span>
                                            <span className="font-medium">
                                              {formatTime(ruleStatistics.localConditionsTime)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>{t('Local Actions')}:</span>
                                            <span className="font-medium">
                                              {formatTime(ruleStatistics.localActionsTime)}
                                            </span>
                                          </div>
                                        </div>
                                      </Card>
                                      {ruleStatistics.lastSyncDate && (
                                        <Card className="p-4">
                                          <h4 className="font-semibold mb-3 flex items-center">
                                            <Calendar className="h-4 w-4 mr-2" />
                                            {t('Last Sync')}
                                          </h4>
                                          <div className="text-sm">
                                            <div className="font-medium">
                                              {new Date(ruleStatistics.lastSyncDate).toLocaleString()}
                                            </div>
                                          </div>
                                        </Card>
                                      )}
                                    </div>
                                  ) : (
                                    <div className="text-center text-muted-foreground py-8">
                                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                      <p>{t('No statistics available for this rule')}</p>
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
                          onClick={() => handleDeleteRule(rule.id)}
                          disabled={rule.readOnly}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('Delete')}
                        </Button>
                      </div>
                    </div>
                    {rule.description && (
                      <p className="text-sm text-muted-foreground ml-8">{rule.description}</p>
                    )}
                  </CardHeader>
                  {expandedRules.has(rule.id) && (
                    <CardContent className="pt-0">
                      <div className="ml-8 space-y-2 text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <Settings className="h-4 w-4 text-muted-foreground" />
                            <span>ID: {rule.id}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>{t('Scope')}: {rule.scope}</span>
                          </div>
                          {rule.statistics && (
                            <div className="flex items-center space-x-1">
                              <Activity className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {t('Executions')}: {formatNumber(rule.statistics.executionCount)}
                              </span>
                            </div>
                          )}
                        </div>
                        {rule.tags && rule.tags.length > 0 && (
                          <div className="flex items-center space-x-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {rule.tags.map((tag, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RuleBuilder
        rule={editingRule ?? undefined}
        isOpen={showRuleBuilder}
        onClose={handleBuilderClose}
        onSave={handleRuleSaved}
      />
    </div>
  );
};

export default RulesList;
