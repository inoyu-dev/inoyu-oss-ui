import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        setLoading(false);
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
        setLoading(false);
      }
    };

    checkAdmin();
  }, [user]);

  return { isAdmin: isAdmin === true, loading };
}
