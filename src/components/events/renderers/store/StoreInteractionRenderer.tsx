import { UnomiEvent } from '@/services/client/UnomiClientService';
import { formatDateTime } from '@/utils/dateTime';
import { useTranslation } from 'react-i18next';

export function StoreInteractionRenderer({ event, compact }: { event: UnomiEvent, compact: boolean }) {
  const { t } = useTranslation();

  if (compact) {
    const { date, time, timezone } = formatDateTime(event.timeStamp);
    return (
      <div className="flex items-center space-x-2 p-4 bg-muted">
        <div className="min-w-[140px] text-foreground">
          <div className="text-xs font-medium">{date}</div>
          <div className="text-xs">{time}</div>
          <div className="text-[10px] text-muted-foreground">{timezone}</div>
        </div>
        <div className="flex-1">
          <>
            <h4 className="text-lg font-semibold">{t('Store Interaction')}</h4>
            <p className="text-muted-foreground">{t(String(event.properties?.action ?? 'unknown'))}</p>
            <p className="text-muted-text">Store ID: {String(event.properties?.storeId ?? 'N/A')}</p>
            {event.properties?.amount && (
              <p className="text-muted-text">Amount: ${String(event.properties.amount)}</p>
            )}
          </>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-md bg-card">
      <h2 className="text-xl font-bold">{t('Event Type')}: {t('Store Interaction')}</h2>
      <div>
        <span className="font-semibold">{t('Store ID')}:</span>
        <span className="ml-2">{String(event.properties?.storeId ?? 'N/A')}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Action')}:</span>
        <span className="ml-2">{t(String(event.properties?.action ?? 'N/A'))}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Amount')}:</span>
        <span className="ml-2">${String(event.properties?.amount ?? 'N/A')}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Timestamp')}:</span>
        <span className="ml-2">{new Date(event.timeStamp).toLocaleString()}</span>
      </div>
      <div>
        <span className="font-semibold">{t('User ID')}:</span>
        <span className="ml-2">{String(event.properties?.userId ?? 'N/A')}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Location')}:</span>
        <span className="ml-2">{String(event.properties?.location ?? 'N/A')}</span>
      </div>
    </div>
  );
} 