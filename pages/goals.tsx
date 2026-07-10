import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import GoalList from '@/components/goals/GoalList';

const Goals: NextPage = () => (
  <RegistryPage route="/goals" defaultComponent={GoalList} />
);

export default Goals;
