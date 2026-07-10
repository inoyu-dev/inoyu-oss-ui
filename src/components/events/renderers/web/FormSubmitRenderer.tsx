import { UnomiEvent } from '@/services/client/UnomiClientService';
import { useTranslation } from 'react-i18next';
import { formatDateTime } from '@/utils/dateTime';

interface FormSubmitProperties {
  formId?: string;
  fields?: Record<string, string>;
}
  

export function FormSubmitRenderer({ event, compact }: { event: UnomiEvent, compact: boolean }) {
  const { t } = useTranslation();

  const formSubmitProperties = event.properties as FormSubmitProperties;

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
          <div className="text-xs font-medium text-foreground">{t('Form Submit')}</div>
          <p className="text-[10px] text-muted-foreground truncate">Form ID: {String(event.properties?.formId ?? 'N/A')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg shadow-md bg-card">
      <h2 className="text-xl font-bold">
        {t('Event Type')} {': '} {t('Form Submit')}
      </h2>
      <div>
        <span className="font-semibold">{t('Form ID')}:</span>
        <span className="ml-2">{String(event.properties?.formId ?? '')}</span>
      </div>
      {formSubmitProperties?.fields && (
        <div>
          <span className="font-semibold">{t('Form Fields')}:</span>
          <div className="mt-2 space-y-2">
            {Object.entries(formSubmitProperties.fields).map(([key, value]) => (
              <div key={key} className="flex items-start">
                <span className="font-medium min-w-[120px]">{key}:</span>
                <span className="ml-2">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <span className="font-semibold">{t('Timestamp')}:</span>
        <span className="ml-2">{new Date(event.timeStamp).toLocaleString()}</span>
      </div>
    </div>
  );
} 