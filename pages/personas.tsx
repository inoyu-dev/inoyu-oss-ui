import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import PersonaList from '@/components/personas/PersonaList';

const Personas: NextPage = () => (
  <RegistryPage route="/personas" defaultComponent={PersonaList} />
);

export default Personas;
