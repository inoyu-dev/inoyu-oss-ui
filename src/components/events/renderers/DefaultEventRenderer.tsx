import { UnomiEvent } from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/utils/dateTime';

export function DefaultEventRenderer({ event, compact }: { event: UnomiEvent, compact: boolean }) {
  const { t } = useTranslation();

  if (compact) {
    const { date, time, timezone } = formatDateTime(event.timeStamp);
    return (
      <div className="flex items-center space-x-2 p-2 bg-muted">
        <div className="min-w-[100px] text-foreground">
          <div className="text-[10px] font-medium">{date}</div>
          <div className="text-[10px]">{time}</div>
          <div className="text-[8px] text-muted-foreground">{timezone}</div>
        </div>
        <div className="flex-1">
          <div className="text-xs font-medium text-foreground">{event.eventType}</div>
          <span className="text-[10px] text-muted-foreground truncate">
            {String(event.target?.itemId ?? '') || t('No target item')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <span className="font-semibold">{t('Event Type')}:</span>
        <span>{event.eventType}</span>
      </div>

      <div>
        <span className="font-semibold">{t('Event ID')}:</span>
        <span className="ml-2">{event.itemId}</span>
      </div>

      {event.target && (
        <div>
          <span className="font-semibold">{t('Target')}:</span>
          <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
            {JSON.stringify(event.target, null, 2)}
          </pre>
        </div>
      )}

      {event.source && (
        <div>
          <span className="font-semibold">{t('Source')}:</span>
          <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
            {JSON.stringify(event.source, null, 2)}
          </pre>
        </div>
      )}

      {event.properties && Object.keys(event.properties).length > 0 && (
        <div>
          <span className="font-semibold">{t('Properties')}:</span>
          <pre className="mt-2 p-2 bg-muted rounded-md overflow-x-auto">
            {JSON.stringify(event.properties, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <span className="font-semibold">{t('Timestamp')}:</span>
        <span className="ml-2">
          {new Date(event.timeStamp).toLocaleString()}
        </span>
      </div>
    </div>
  );
} 