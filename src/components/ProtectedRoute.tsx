import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next/pages';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { t } = useTranslation('common');
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && router.pathname !== '/login') {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Do not mount protected UI until authenticated — otherwise the page flashes
  // and fires API calls (e.g. /api/json-schemas) that 401 before redirect.
  if (loading || !user) {
    return <div>{t('Loading...')}</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
