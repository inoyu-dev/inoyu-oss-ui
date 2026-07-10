import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import ActionTypeList from '@/components/action-types/ActionTypeList';

const ActionTypes: NextPage = () => (
  <RegistryPage route="/action-types" defaultComponent={ActionTypeList} />
);

export default ActionTypes;
