import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import ScoringList from '@/components/scoring/ScoringList';

const Scoring: NextPage = () => (
  <RegistryPage route="/scoring" defaultComponent={ScoringList} />
);

export default Scoring;
