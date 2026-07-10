import { UnomiEvent } from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/utils/dateTime';

export function PageViewRenderer({ event, compact }: { event: UnomiEvent, compact: boolean }) {
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
          <div className="text-xs font-medium text-foreground">{t('Page View')}</div>
          <p className="text-[10px] text-muted-foreground truncate">URL: {String(event.properties?.url ?? '')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-md bg-card">
      <h2 className="text-xl font-bold">{t('Event Type')}: {t('Page View')}</h2>
      <div>
        <span className="font-semibold">{t('URL')}:</span>
        <span className="ml-2">{String(event.properties?.url ?? '')}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Page Title')}:</span>
        <span className="ml-2">{String(event.properties?.title ?? '')}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Timestamp')}:</span>
        <span className="ml-2">{new Date(event.timeStamp).toLocaleString()}</span>
      </div>
      <div>
        <span className="font-semibold">{t('User ID')}:</span>
        <span className="ml-2">{String(event.properties?.userId ?? 'N/A')}</span>
      </div>
    </div>
  );
} 