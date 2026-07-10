import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
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

  if (loading) {
    return <div>{t('Loading...')}</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
