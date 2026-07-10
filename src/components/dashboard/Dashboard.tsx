import React, { useRef, useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import RealtimeData from './RealtimeData';
import { EventList } from '../events/EventList';

/**
 * Open-source Dashboard — shows basic Unomi-native metrics only.
 * No custom storage, no AI, no advanced visualizations.
 */
const Dashboard: React.FC = () => {
  const { t } = useTranslation('common');
  const [isLoading, setIsLoading] = useState(true);
  const dashboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Small delay so child components can initialise
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('Loading dashboard...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div ref={dashboardRef} className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4" data-testid="dashboard">
      {/* Real-time metrics from Unomi */}
      <div className="h-96" data-testid="dashboard-realtime-data">
        <RealtimeData />
      </div>

      {/* Recent events from Unomi */}
      <div className="h-96">
        <EventList
          condition={{ type: 'matchAllCondition' }}
          limit={5}
          defaultRefreshInterval={30000}
        />
      </div>
    </div>
  );
};

export default Dashboard;
