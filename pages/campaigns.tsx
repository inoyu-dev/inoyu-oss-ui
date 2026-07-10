import React from 'react';
import { NextPage } from 'next';
import RegistryPage from '@/components/shared/RegistryPage';
import CampaignList from '@/components/campaigns/CampaignList';

const Campaigns: NextPage = () => (
  <RegistryPage route="/campaigns" defaultComponent={CampaignList} />
);

export default Campaigns;
