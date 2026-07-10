import axios from 'axios';
import type { CampaignDetail, UnomiCampaign, UnomiMetadata } from './unomi-types';

export async function getAllCampaigns(): Promise<UnomiMetadata[]> {
  try {
    const response = await axios.get('/api/cxs/campaigns');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
}

export async function getCampaignDefinition(campaignId: string): Promise<UnomiCampaign> {
  try {
    const response = await axios.get(`/api/cxs/campaigns/${campaignId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching campaign definition:', error);
    throw error;
  }
}

export async function getCampaignDetail(campaignId: string): Promise<CampaignDetail> {
  try {
    const response = await axios.get(`/api/cxs/campaigns/${campaignId}/detailed`);
    return response.data;
  } catch (error) {
    console.error('Error fetching campaign detail:', error);
    throw error;
  }
}

export async function createCampaign(campaignData: Record<string, unknown>): Promise<UnomiCampaign> {
  try {
    const response = await axios.post('/api/cxs/campaigns', campaignData);
    return response.data;
  } catch (error) {
    console.error('Error creating campaign:', error);
    throw error;
  }
}

export async function updateCampaign(campaignId: string, campaignData: Record<string, unknown>): Promise<UnomiCampaign> {
  try {
    const response = await axios.post('/api/cxs/campaigns', {
      ...campaignData,
      itemId: campaignId,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating campaign:', error);
    throw error;
  }
}

export async function deleteCampaign(campaignId: string): Promise<void> {
  try {
    await axios.delete(`/api/cxs/campaigns/${campaignId}`);
  } catch (error) {
    console.error('Error deleting campaign:', error);
    throw error;
  }
}
