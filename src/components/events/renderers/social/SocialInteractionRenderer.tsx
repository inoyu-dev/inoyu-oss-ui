import { UnomiEvent } from '@/services/client/UnomiClientService';
import { formatDateTime } from '@/utils/dateTime';
import { useTranslation } from 'react-i18next';

export function SocialInteractionRenderer({ event, compact }: { event: UnomiEvent, compact: boolean }) {
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
          <h4 className="text-lg font-semibold">{t('Social Interaction')}</h4>
          <p className="text-muted-foreground">Platform: {String(event.properties?.platform ?? 'N/A')}</p>
          <p className="text-muted-foreground">Action: {t(String(event.properties?.action ?? 'unknown'))}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-md bg-card">
      <h2 className="text-xl font-bold">{t('Event Type')}: {t('Social Interaction')}</h2>
      <div>
        <span className="font-semibold">{t('Platform')}:</span>
        <span className="ml-2">{String(event.properties?.platform ?? 'N/A')}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Action')}:</span>
        <span className="ml-2">{t(String(event.properties?.action ?? 'unknown'))}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Username')}:</span>
        <span className="ml-2">{String(event.properties?.username ?? 'N/A')}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Content')}:</span>
        <span className="ml-2">{String(event.properties?.text ?? 'N/A')}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Content ID')}:</span>
        <span className="ml-2">{String(event.properties?.contentId ?? 'N/A')}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Timestamp')}:</span>
        <span className="ml-2">{new Date(event.timeStamp).toLocaleString()}</span>
      </div>
    </div>
  );
} 