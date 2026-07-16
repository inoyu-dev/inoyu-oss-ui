import { GetStaticProps, NextPage } from 'next';
import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import React from 'react';
import Layout from '../src/components/layout/Layout';
import ProtectedRoute from '../src/components/ProtectedRoute';
import Dashboard from '../src/components/dashboard/Dashboard';

const Home: NextPage = () => {
  return (
    <ProtectedRoute>
      <Layout>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
};

export default Home;