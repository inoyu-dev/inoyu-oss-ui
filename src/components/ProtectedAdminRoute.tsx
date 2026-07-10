import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
  const { t } = useTranslation('common');
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setCheckingAdmin(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/user');
        if (res.ok) {
          const userData = await res.json();
          setIsAdmin(userData.admin === true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Failed to check admin status', error);
        setIsAdmin(false);
      } finally {
        setCheckingAdmin(false);
      }
    };

    checkAdmin();
  }, [user]);

  useEffect(() => {
    if (!loading && !checkingAdmin && isAdmin === false) {
      router.push('/');
    }
  }, [loading, checkingAdmin, isAdmin, router]);

  if (loading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info mx-auto"></div>
          <p className="mt-4 text-foreground">{t('Checking permissions...')}</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
