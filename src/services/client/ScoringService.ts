import axios from 'axios';
import type { UnomiMetadata, UnomiScoring } from './unomi-types';

export async function getAllScorings(): Promise<UnomiMetadata[]> {
  try {
    const response = await axios.get('/api/cxs/scoring');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching scorings:', error);
    throw error;
  }
}

export async function getScoringDefinition(scoringId: string): Promise<UnomiScoring> {
  try {
    const response = await axios.get(`/api/cxs/scoring/${scoringId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scoring definition:', error);
    throw error;
  }
}

export async function createScoring(scoringData: Record<string, unknown>): Promise<UnomiScoring> {
  try {
    const response = await axios.post('/api/cxs/scoring', scoringData);
    return response.data;
  } catch (error) {
    console.error('Error creating scoring:', error);
    throw error;
  }
}

export async function updateScoring(scoringId: string, scoringData: Record<string, unknown>): Promise<UnomiScoring> {
  try {
    const response = await axios.post('/api/cxs/scoring', {
      ...scoringData,
      itemId: scoringId,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating scoring:', error);
    throw error;
  }
}

export async function deleteScoring(scoringId: string): Promise<void> {
  try {
    await axios.delete(`/api/cxs/scoring/${scoringId}`);
  } catch (error) {
    console.error('Error deleting scoring:', error);
    throw error;
  }
}
