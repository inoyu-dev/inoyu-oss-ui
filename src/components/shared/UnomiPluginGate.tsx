/**
 * Gate page content on Unomi OSGi plugin presence.
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useUnomiPlugin } from '@/hooks/useUnomiPlugins';

export interface UnomiPluginGateProps {
  /** Registry id, e.g. `accounts` or `groovyActions` */
  pluginId: string;
  /** Optional display name for the unavailable message */
  pluginLabel?: string;
  children: React.ReactNode;
  /** Optional custom unavailable UI */
  fallback?: React.ReactNode;
}

const UnomiPluginGate: React.FC<UnomiPluginGateProps> = ({
  pluginId,
  pluginLabel,
  children,
  fallback,
}) => {
  const { t } = useTranslation();
  const { present, isLoading, refetch } = useUnomiPlugin(pluginId);
  const label = pluginLabel || pluginId;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40 text-muted-foreground">
        <RefreshCw className="h-5 w-5 animate-spin mr-2" />
        {t('Checking plugin availability...')}
      </div>
    );
  }

  if (!present) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <Alert>
        <AlertTitle>{t('Plugin unavailable')}</AlertTitle>
        <AlertDescription className="space-y-3">
          <p>
            {t(
              'The {{plugin}} Unomi plugin is not installed or not responding on this server.',
              { plugin: label }
            )}
          </p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('Retry')}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};

export default UnomiPluginGate;
