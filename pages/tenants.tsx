import { serverSideTranslations } from 'next-i18next/pages/serverSideTranslations';
import type { GetServerSideProps } from 'next';

import TenantsPage from '@/components/tenants/TenantsPage';
import { isTenantAdminUiEnabled } from '@/lib/tenant-admin';

export default TenantsPage;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  if (!isTenantAdminUiEnabled()) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common'])),
    },
  };
};
