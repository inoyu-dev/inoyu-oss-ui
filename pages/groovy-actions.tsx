import React from 'react';
import RegistryPage from '@/components/shared/RegistryPage';
import UnomiPluginGate from '@/components/shared/UnomiPluginGate';
import GroovyActionList from '@/components/groovy-actions/GroovyActionList';

const GroovyActionsPageContent: React.FC = () => (
  <UnomiPluginGate pluginId="groovyActions" pluginLabel="Groovy Actions">
    <GroovyActionList />
  </UnomiPluginGate>
);

const GroovyActionsPage: React.FC = () => (
  <RegistryPage route="/groovy-actions" defaultComponent={GroovyActionsPageContent} />
);

export default GroovyActionsPage;
