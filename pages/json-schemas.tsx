import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import JsonSchemaList from '@/components/jsonSchemas/JsonSchemaList';

const JsonSchemasPage: NextPage = () => (
  <RegistryPage
    route="/json-schemas"
    defaultComponent={JsonSchemaList}
    className="container mx-auto py-6"
  />
);

export default JsonSchemasPage;
