import axios from 'axios';
import type { CreateScopeData, UnomiScope } from './unomi-types';

export async function getAllScopes(): Promise<UnomiScope[]> {
  try {
    const response = await axios.get<UnomiScope[] | { list?: UnomiScope[]; error?: string } | UnomiScope>('/api/cxs/scopes');
    console.log('Scopes API response:', response);
    console.log('Scopes API response data:', response.data);
    console.log('Scopes API response status:', response.status);

    // Handle both array and object with list property
    if (Array.isArray(response.data)) {
      return response.data;
    } else if (response.data && typeof response.data === 'object' && 'list' in response.data && Array.isArray(response.data.list)) {
      return response.data.list;
    } else if (response.data && typeof response.data === 'object' && 'itemId' in response.data) {
      // If it's a single object, wrap it in an array
      return [response.data as UnomiScope];
    } else if (response.data && typeof response.data === 'object' && 'error' in response.data) {
      // If it's an object with error property, it's an error response
      const errorData = response.data as { error: string };
      throw new Error(errorData.error);
    }
    // Return empty array if no data
    return [];
  } catch (error) {
    console.error('Error fetching scopes:', error);
    if (axios.isAxiosError<{ error?: string }>(error)) {
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method
      };
      console.error('Axios error details:', errorDetails);

      // Create a more descriptive error message
      if (error.response?.data?.error) {
        throw new Error(`Failed to fetch scopes: ${error.response.data.error}`);
      } else if (error.response?.status === 404) {
        throw new Error('Scopes endpoint not found. Please check your Unomi server configuration.');
      } else if (error.response?.status === 401) {
        throw new Error('Authentication failed. Please check your Unomi credentials.');
      } else if (error.response?.status === 403) {
        throw new Error('Access forbidden. Please check your permissions.');
      } else {
        throw new Error(`Failed to fetch scopes: ${error.response?.statusText || error.message}`);
      }
    }
    throw error;
  }
}

export async function getScope(scopeId: string): Promise<UnomiScope> {
  try {
    const response = await axios.get<UnomiScope>(`/api/cxs/scopes/${scopeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching scope:', error);
    throw error;
  }
}

export async function createScope(scopeData: CreateScopeData): Promise<UnomiScope> {
  try {
    // Ensure itemType is always 'scope' and metadata.id matches itemId
    const payload: {
      itemId: string;
      itemType: 'scope';
      metadata?: {
        id: string;
        name?: string;
        description?: string;
        scope?: string;
        tags?: string[];
        enabled?: boolean;
      };
    } = {
      itemId: scopeData.itemId,
      itemType: 'scope' as const,
    };

    // Always include metadata with id set to itemId
    if (scopeData.metadata) {
      payload.metadata = {
        id: scopeData.itemId, // metadata.id must match itemId
        ...scopeData.metadata
      };
    } else {
      // Even if no metadata provided, we need to set the id
      payload.metadata = {
        id: scopeData.itemId
      };
    }

    const response = await axios.post<UnomiScope>('/api/cxs/scopes', payload);
    return response.data;
  } catch (error) {
    console.error('Error creating scope:', error);
    throw error;
  }
}

export async function deleteScope(scopeId: string): Promise<void> {
  try {
    await axios.delete(`/api/cxs/scopes/${scopeId}`);
  } catch (error) {
    console.error('Error deleting scope:', error);
    throw error;
  }
}
