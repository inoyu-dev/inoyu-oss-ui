import React, { useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Megaphone,
  Eye,
  Trash2,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  Plus,
  Edit3,
  BarChart3,
  Target,
} from 'lucide-react';
import type {
  UnomiMetadata,
  UnomiCampaign,
  CampaignDetail,
} from '@/services/client/UnomiClientService';
import {
  getAllCampaigns,
  getCampaignDefinition,
  getCampaignDetail,
  deleteCampaign,
} from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';
import { useEntityList } from '@/hooks/useEntityList';
import SearchAndFilterBar from '@/components/shared/SearchAndFilterBar';
import CampaignBuilder from './CampaignBuilder';
import CampaignStats from './CampaignStats';

interface CampaignWithStats extends UnomiMetadata {
  stats?: CampaignDetail;
  status?: 'active' | 'upcoming' | 'ended';
}

const CampaignList: React.FC = () => {
  const { t } = useTranslation();

  const getCampaignStatus = useCallback((campaign: UnomiCampaign): 'active' | 'upcoming' | 'ended' => {
    const now = new Date();
    if (campaign.startDate && new Date(campaign.startDate) > now) {
      return 'upcoming';
    }
    if (campaign.endDate && new Date(campaign.endDate) < now) {
      return 'ended';
    }
    return 'active';
  }, []);

  const fetchCampaignsWithStats = useCallback(async (): Promise<CampaignWithStats[]> => {
    const campaignsData = await getAllCampaigns();
    return Promise.all(
      campaignsData.map(async (campaign) => {
        try {
          const detail = await getCampaignDetail(campaign.id);
          const campaignDef = await getCampaignDefinition(campaign.id);
          return {
            ...campaign,
            stats: detail,
            status: getCampaignStatus(campaignDef),
          };
        } catch {
          const campaignDef = await getCampaignDefinition(campaign.id);
          return {
            ...campaign,
            status: getCampaignStatus(campaignDef),
          };
        }
      })
    );
  }, [getCampaignStatus]);

  const {
    filteredItems: filteredCampaigns,
    loading,
    error,
    setError,
    searchTerm,
    setSearchTerm,
    filterEnabled,
    cycleFilter,
    expandedItems: expandedCampaigns,
    toggleExpansion: toggleCampaignExpansion,
    refresh,
    handleDelete: handleDeleteCampaign,
  } = useEntityList<CampaignWithStats>({
    fetchFn: fetchCampaignsWithStats,
    deleteFn: deleteCampaign,
    deleteConfirmMessage: t('Are you sure you want to delete this campaign? This action cannot be undone.'),
  });

  const [selectedCampaign, setSelectedCampaign] = useState<UnomiCampaign | null>(null);
  const [campaignStats, setCampaignStats] = useState<CampaignDetail | null>(null);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [showCampaignStats, setShowCampaignStats] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<UnomiCampaign | null>(null);

  const fetchCampaignDetails = useCallback(async (campaignId: string) => {
    try {
      const [campaignDef, detail] = await Promise.all([
        getCampaignDefinition(campaignId),
        getCampaignDetail(campaignId).catch(() => null),
      ]);
      setSelectedCampaign(campaignDef);
      if (detail) {
        setCampaignStats(detail);
      }
    } catch (err) {
      console.error('Error fetching campaign details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch campaign details');
    }
  }, [setError]);

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setShowCampaignBuilder(true);
  };

  const handleEditCampaign = useCallback(async (campaignId: string) => {
    try {
      const campaignDef = await getCampaignDefinition(campaignId);
      setEditingCampaign(campaignDef);
      setShowCampaignBuilder(true);
    } catch (err) {
      console.error('Error fetching campaign for editing:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign for editing');
    }
  }, [setError]);

  const handleViewStats = useCallback(async (campaignId: string) => {
    try {
      const detail = await getCampaignDetail(campaignId);
      const campaignDef = await getCampaignDefinition(campaignId);
      setCampaignStats(detail);
      setSelectedCampaign(campaignDef);
      setShowCampaignStats(true);
    } catch (err) {
      console.error('Error fetching campaign stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load campaign statistics');
    }
  }, [setError]);

  const handleCampaignSaved = useCallback(() => {
    refresh();
    setShowCampaignBuilder(false);
    setEditingCampaign(null);
  }, [refresh]);

  const handleBuilderClose = useCallback(() => {
    setShowCampaignBuilder(false);
    setEditingCampaign(null);
  }, []);

  const getStatusColor = (status: 'active' | 'upcoming' | 'ended') => {
    switch (status) {
      case 'active':
        return 'bg-success-light text-success-dark';
      case 'upcoming':
        return 'bg-info-light text-info-dark';
      case 'ended':
        return 'bg-muted text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading campaigns...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t('Campaigns')}</h1>
        <Button onClick={handleCreateCampaign}>
          <Plus className="h-4 w-4 mr-2" />
          {t('Create Campaign')}
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
            <CardTitle>{t('Campaigns')}</CardTitle>
            <SearchAndFilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filterEnabled={filterEnabled}
              onCycleFilter={cycleFilter}
              onRefresh={refresh}
              searchPlaceholder={t('Search campaigns...')}
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm || filterEnabled !== null
                ? t('No campaigns match your filters')
                : t('No campaigns found. Create your first campaign to get started.')}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredCampaigns.map((campaign) => (
                <Card key={campaign.id} className="border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleCampaignExpansion(campaign.id)}
                        >
                          {expandedCampaigns.has(campaign.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                        <Megaphone className="h-5 w-5 text-teal-600" />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{campaign.name}</h3>
                            <Badge variant={campaign.enabled ? 'default' : 'secondary'}>
                              {campaign.enabled ? t('Enabled') : t('Disabled')}
                            </Badge>
                            {campaign.status && (
                              <Badge className={getStatusColor(campaign.status)}>
                                {t(campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1))}
                              </Badge>
                            )}
                          </div>
                          {campaign.description && (
                            <p className="text-sm text-muted-foreground mt-1">{campaign.description}</p>
                          )}
                          <div className="flex items-center space-x-4 mt-2 text-muted-foreground">
                            <span>ID: {campaign.id}</span>
                            {campaign.scope && <span>Scope: {campaign.scope}</span>}
                            {campaign.stats && (
                              <>
                                <span className="flex items-center">
                                  <Target className="h-3 w-3 mr-1" />
                                  {campaign.stats.engagedProfiles} {t('profiles')}
                                </span>
                                <span className="flex items-center">
                                  <BarChart3 className="h-3 w-3 mr-1" />
                                  {campaign.stats.conversionRate.toFixed(2)}% {t('conversion')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {campaign.stats && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewStats(campaign.id)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            {t('Stats')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchCampaignDetails(campaign.id)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          {t('View')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditCampaign(campaign.id)}
                        >
                          <Edit3 className="h-4 w-4 mr-2" />
                          {t('Edit')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteCampaign(campaign.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {expandedCampaigns.has(campaign.id) && selectedCampaign?.itemId === campaign.id && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium">{t('Scope')}:</span> {selectedCampaign.scope}
                          </div>
                          {selectedCampaign.primaryGoal && (
                            <div>
                              <span className="font-medium">{t('Primary Goal')}:</span> {selectedCampaign.primaryGoal}
                            </div>
                          )}
                          {selectedCampaign.startDate && (
                            <div>
                              <span className="font-medium">{t('Start Date')}:</span>{' '}
                              {new Date(selectedCampaign.startDate).toLocaleDateString()}
                            </div>
                          )}
                          {selectedCampaign.endDate && (
                            <div>
                              <span className="font-medium">{t('End Date')}:</span>{' '}
                              {new Date(selectedCampaign.endDate).toLocaleDateString()}
                            </div>
                          )}
                          {selectedCampaign.cost !== undefined && (
                            <div>
                              <span className="font-medium">{t('Cost')}:</span>{' '}
                              {selectedCampaign.cost} {selectedCampaign.currency || 'USD'}
                            </div>
                          )}
                        </div>
                        {selectedCampaign.entryCondition && (
                          <div className="mt-2">
                            <span className="font-medium">{t('Entry Condition')}:</span>
                            <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                              {JSON.stringify(selectedCampaign.entryCondition, null, 2)}
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

      {showCampaignBuilder && (
        <CampaignBuilder
          campaign={editingCampaign}
          isOpen={showCampaignBuilder}
          onClose={handleBuilderClose}
          onSave={handleCampaignSaved}
        />
      )}

      {showCampaignStats && campaignStats && selectedCampaign && (
        <CampaignStats
          campaign={selectedCampaign}
          stats={campaignStats}
          isOpen={showCampaignStats}
          onClose={() => setShowCampaignStats(false)}
        />
      )}
    </div>
  );
};

export default CampaignList;
