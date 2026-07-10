import axios from 'axios';
import type { UnomiMetadata, UnomiUserList } from './unomi-types';

export async function getAllUserLists(): Promise<UnomiMetadata[]> {
  try {
    const response = await axios.get('/api/cxs/lists');
    const data = response.data;
    // Handle both array and object with list property
    if (Array.isArray(data)) {
      return data;
    }
    return data?.list || [];
  } catch (error) {
    console.error('Error fetching user lists:', error);
    throw error;
  }
}

export async function getUserListDefinition(listId: string): Promise<UnomiUserList> {
  try {
    const response = await axios.get(`/api/cxs/lists/${listId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user list definition:', error);
    throw error;
  }
}
