import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import UnomiProfileDashboard from '@/components/profiles/profile/Profile';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import Layout from '../../src/components/layout/Layout';
import ProtectedRoute from '../../src/components/ProtectedRoute';

export default function ProfilePage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Wait for the component to mount and router to be ready
  if (!mounted || !router.isReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  const { profileId } = router.query;
  console.log('ProfilePage: router.query:', router.query);
  console.log('ProfilePage: profileId:', profileId);

  if (!profileId || Array.isArray(profileId)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Invalid profile ID</div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <Layout>
        <UnomiProfileDashboard profileId={profileId} />
      </Layout>
    </ProtectedRoute>
  )
}