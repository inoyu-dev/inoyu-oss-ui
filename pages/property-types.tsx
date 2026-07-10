import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import PropertyTypeList from '@/components/propertyTypes/PropertyTypeList';

const PropertyTypesPage: NextPage = () => (
  <RegistryPage
    route="/property-types"
    defaultComponent={PropertyTypeList}
    className="container mx-auto py-6"
  />
);

export default PropertyTypesPage;
