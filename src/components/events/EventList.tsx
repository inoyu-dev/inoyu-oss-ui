import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { getProfileEvents, UnomiEvent } from '@/services/client/UnomiClientService';
import { BaseCondition } from '@/services/shared/types';
import { EventRenderer } from './renderers/EventRenderer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useTranslation } from 'react-i18next';

const REFRESH_INTERVALS = [
  { value: '0', label: 'Manual' },
  { value: '5000', label: '5 seconds' },
  { value: '15000', label: '15 seconds' },
  { value: '30000', label: '30 seconds' },
  { value: '60000', label: '1 minute' },
  { value: '300000', label: '5 minutes' }
];

interface EventListProps {
  condition: {
    type: string;
    parameterValues?: {
      propertyName: string;
      comparisonOperator: string;
      propertyValue: string | number | boolean | null;
    };
  };
  title?: string;
  limit?: number;
  defaultRefreshInterval?: number;
  onEventsLoaded?: (events: UnomiEvent[]) => void;
}

export const EventList: React.FC<EventListProps> = ({
  condition,
  title = 'Recent Events',
  limit = 5,
  defaultRefreshInterval = 30000,
  onEventsLoaded
}) => {
  const [events, setEvents] = useState<UnomiEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(defaultRefreshInterval.toString());
  const [selectedEvent, setSelectedEvent] = useState<UnomiEvent | null>(null);
  const { t } = useTranslation();

  const fetchEvents = useCallback(async () => {
    try {
      const eventData = await getProfileEvents(condition as BaseCondition, limit);
      setEvents(eventData);
      setError(null);
      onEventsLoaded?.(eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      console.error('Error fetching events:', err);
    } finally {
    }
  }, [condition, limit, onEventsLoaded]);

  useEffect(() => {
    fetchEvents();
    
    const interval = parseInt(refreshInterval);
    if (interval > 0) {
      const timer = setInterval(fetchEvents, interval);
      return () => clearInterval(timer);
    }
  }, [condition, limit, refreshInterval, fetchEvents]);

  const handleManualRefresh = () => {
    fetchEvents();
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between flex-shrink-0">
        <CardTitle className="flex items-center justify-between">
          <span>{title}</span>
          <div className="flex items-center space-x-2">
            <Select
              value={refreshInterval}
              onValueChange={(value) => setRefreshInterval(value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('Select refresh interval')} />
              </SelectTrigger>
              <SelectContent>
                {REFRESH_INTERVALS.map((interval) => (
                  <SelectItem key={interval.value} value={interval.value}>
                    {t(interval.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleManualRefresh} size="sm">
              <RefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {error ? (
          <Alert variant="destructive">
            <AlertTitle>{t('Error')}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-1 flex-1 overflow-y-auto max-h-64">
            {events.map((event) => (
              <Card
                key={event.itemId}
                className="p-2 cursor-pointer hover:bg-muted/50"
                onClick={() => setSelectedEvent(event)}
              >
                <EventRenderer event={event} compact />
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('Event Details')}</DialogTitle>
            </DialogHeader>
            {selectedEvent && <EventRenderer event={selectedEvent} />}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
