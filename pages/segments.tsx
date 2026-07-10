import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import SegmentList from '@/components/segments/SegmentList';

const Segments: NextPage = () => (
  <RegistryPage route="/segments" defaultComponent={SegmentList} title="Segments" />
);

export default Segments;
