import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import RulesList from '@/components/rules/RulesList';

const Rules: NextPage = () => (
  <RegistryPage route="/rules" defaultComponent={RulesList} />
);

export default Rules;
