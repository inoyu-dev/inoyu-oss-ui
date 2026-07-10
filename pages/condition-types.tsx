import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import ConditionTypeList from '@/components/condition-types/ConditionTypeList';

const ConditionTypes: NextPage = () => (
  <RegistryPage route="/condition-types" defaultComponent={ConditionTypeList} />
);

export default ConditionTypes;
