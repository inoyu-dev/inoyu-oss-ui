import React, { useEffect, useState } from 'react';
import { useTranslation } from 'next-i18next';
import { useRouter } from 'next/router';
import { useAuth } from '../../contexts/AuthContext';

const TopBar: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [tenantId, setTenantId] = useState<string | null>(null);

  useEffect(() => {
    // Fetch tenant information if using Unomi V3
    fetch('/api/config/tenant')
      .then(res => res.json())
      .then(data => {
        if (data.tenantId) {
          setTenantId(data.tenantId);
        }
      })
      .catch(() => {
        // Silently fail - tenant info is optional
      });
  }, []);

  const changeLanguage = (lng: string) => {
    router.push(router.pathname, router.asPath, { locale: lng });
  };

  // Get display name: prefer name, fall back to email (or username part of email)
  const getDisplayName = () => {
    if (user?.name) {
      // If name contains a space, show first name only
      const nameParts = user.name.split(' ');
      return nameParts[0] || user.name;
    }
    if (user?.email) {
      // Extract username part before @
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const displayName = getDisplayName();

  return (
    <header className="bg-card shadow-lg h-16 flex items-center justify-between border-b border-border" data-testid="topbar">
      <div className="flex items-center px-6">
        <h1 className="text-xl font-bold text-foreground">
          {t('Welcome')}, {displayName}
        </h1>
      </div>
      <div className="flex items-center px-6 gap-4">
        {tenantId && (
          <div className="px-3 py-1 bg-info-lighter text-info-dark rounded-md text-sm font-medium">
            Tenant: {tenantId}
          </div>
        )}
        <select
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => changeLanguage(e.target.value)}
          value={router.locale}
          className="p-2 border border-input bg-card text-foreground rounded text-sm"
        >
          <option value="en">English</option>
          <option value="fr">Français</option>
          <option value="es">Español</option>
          <option value="de">Deutsch</option>
        </select>
        {user?.trialDaysLeft !== undefined && (
          <span className="text-sm text-muted-foreground">
            {t('Trial Days Left')}: {user.trialDaysLeft}
          </span>
        )}
        <button 
          onClick={logout} 
          className="bg-destructive hover:bg-destructive-dark text-destructive-foreground px-4 py-2 rounded text-sm font-medium transition-colors"
          data-testid="logout-button"
        >
          {t('Logout')}
        </button>
      </div>
    </header>
  );
};

export default TopBar;
