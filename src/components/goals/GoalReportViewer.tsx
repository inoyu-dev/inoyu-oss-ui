import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UnomiGoal, GoalReport, GoalStat } from '@/services/client/UnomiClientService';
import { TrendingUp, Target, BarChart3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GoalReportViewerProps {
  goal: UnomiGoal;
  report: GoalReport;
}

export default function GoalReportViewer({ goal, report }: GoalReportViewerProps) {
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>{t('Global Statistics')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {report.globalStats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">
                  {formatNumber(report.globalStats.startCount || 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{t('Starts')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">
                  {formatNumber(report.globalStats.targetCount || 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{t('Completions')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-info">
                  {formatPercentage(report.globalStats.conversionRate || 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{t('Conversion Rate')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">
                  {formatPercentage(report.globalStats.percentage || 0)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">{t('Percentage')}</div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">{t('No statistics available')}</p>
          )}
        </CardContent>
      </Card>

      {report.split && report.split.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>{t('Split Statistics')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {report.split.map((stat: GoalStat, index: number) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{stat.key}</div>
                    <Badge variant="outline">
                      {formatPercentage(stat.conversionRate)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('Starts')}:</span>
                      <span className="ml-2 font-medium">{formatNumber(stat.startCount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('Completions')}:</span>
                      <span className="ml-2 font-medium">{formatNumber(stat.targetCount)}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('Percentage')}:</span>
                      <span className="ml-2 font-medium">{formatPercentage(stat.percentage)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>{t('Goal Details')}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">{t('Goal ID')}:</span>
              <span className="ml-2">{goal.itemId}</span>
            </div>
            <div>
              <span className="font-medium">{t('Scope')}:</span>
              <span className="ml-2">{goal.scope}</span>
            </div>
            {goal.campaignId && (
              <div>
                <span className="font-medium">{t('Campaign ID')}:</span>
                <span className="ml-2">{goal.campaignId}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
