import { UnomiEvent } from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/utils/dateTime';

export function PurchaseRenderer({ event, compact }: { event: UnomiEvent, compact: boolean }) {
  const { t } = useTranslation();

  interface EventProperties {
    orderId?: string;
    amount?: number;
    currency?: string;
    paymentMethod?: string;
    userId?: string;
  }
  
  const properties = event.properties as EventProperties;

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

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
          <h4 className="text-lg font-semibold">{t('Purchase')}</h4>
          <p className="text-muted-foreground">Order ID: {String(properties?.orderId ?? 'N/A')}</p>
          {properties?.amount && properties?.currency && (
            <p className="text-muted-text">Amount: {formatAmount(properties.amount, properties.currency)}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-md bg-card">
      <h2 className="text-xl font-bold">{t('Event Type')}: {t('Purchase')}</h2>
      <div>
        <span className="font-semibold">{t('Order ID')}:</span>
        <span className="ml-2">{String(properties?.orderId ?? 'N/A')}</span>
      </div>
      {properties?.amount && properties?.currency && (
        <div>
          <span className="font-semibold">{t('Amount')}:</span>
          <span className="ml-2">{formatAmount(properties.amount, properties.currency)}</span>
        </div>
      )}
      <div>
        <span className="font-semibold">{t('Timestamp')}:</span>
        <span className="ml-2">{new Date(event.timeStamp).toLocaleString()}</span>
      </div>
      <div>
        <span className="font-semibold">{t('Payment Method')}:</span>
        <span className="ml-2">{String(properties?.paymentMethod ?? 'N/A')}</span>
      </div>
      <div>
        <span className="font-semibold">{t('User ID')}:</span>
        <span className="ml-2">{String(properties?.userId ?? 'N/A')}</span>
      </div>
    </div>
  );
} 