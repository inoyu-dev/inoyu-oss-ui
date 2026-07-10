import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import GroovyActionList from '@/components/groovy-actions/GroovyActionList';

const GroovyActions: NextPage = () => (
  <RegistryPage route="/groovy-actions" defaultComponent={GroovyActionList} />
);

export default GroovyActions;
