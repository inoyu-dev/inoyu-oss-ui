import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import ScopeList from '@/components/scopes/ScopeList';

const Scopes: NextPage = () => (
  <RegistryPage route="/scopes" defaultComponent={ScopeList} />
);

export default Scopes;
