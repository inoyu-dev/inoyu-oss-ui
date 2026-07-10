import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { UnomiCampaign, CampaignDetail } from '@/services/client/UnomiClientService';
import { Users, Eye, Target, TrendingUp, BarChart3, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CampaignStatsProps {
  campaign: UnomiCampaign;
  stats: CampaignDetail;
  isOpen: boolean;
  onClose: () => void;
}

export default function CampaignStats({ campaign, stats, isOpen, onClose }: CampaignStatsProps) {
  const { t } = useTranslation();

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(2)}%`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{t('Campaign Statistics')}: {campaign.metadata.name}</span>
            <button onClick={onClose} className="text-muted-text hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>{t('Overview')}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {formatNumber(stats.engagedProfiles || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center">
                    <Users className="h-4 w-4 mr-1" />
                    {t('Engaged Profiles')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-info">
                    {formatNumber(stats.campaignSessionViews || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center">
                    <Eye className="h-4 w-4 mr-1" />
                    {t('Session Views')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success">
                    {formatNumber(stats.campaignSessionSuccess || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center">
                    <Target className="h-4 w-4 mr-1" />
                    {t('Successful Sessions')}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary">
                    {formatPercentage(stats.conversionRate || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    {t('Conversion Rate')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('Campaign Details')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{t('Number of Goals')}:</span>
                  <span>{stats.numberOfGoals || 0}</span>
                </div>
                {campaign.startDate && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t('Start Date')}:</span>
                    <span>{new Date(campaign.startDate).toLocaleString()}</span>
                  </div>
                )}
                {campaign.endDate && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t('End Date')}:</span>
                    <span>{new Date(campaign.endDate).toLocaleString()}</span>
                  </div>
                )}
                {campaign.primaryGoal && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t('Primary Goal')}:</span>
                    <Badge variant="outline">{campaign.primaryGoal}</Badge>
                  </div>
                )}
                {campaign.cost !== undefined && (
                  <div className="flex justify-between">
                    <span className="font-medium">{t('Cost')}:</span>
                    <span>
                      {campaign.cost} {campaign.currency || 'USD'}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
