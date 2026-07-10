import React from 'react';
import { NextPage } from 'next';
import Layout from '../../src/components/layout/Layout';
import ProtectedRoute from '../../src/components/ProtectedRoute';
import { ProfileList } from '../../src/components/profiles/ProfileList';

const Profiles: NextPage = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <ProfileList />
      </Layout>
    </ProtectedRoute>
  );
};

export default Profiles;
