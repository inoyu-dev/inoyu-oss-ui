import axios from 'axios';
import type { AggregateQuery, AggregateResponse, Condition } from '@/services/shared/types';
import type { UnomiEvent, UnomiProfile } from './unomi-types';

export async function getAllProfiles(offset: number = 0, size: number = 50) {
  try {
    const response = await axios.post('/api/cxs/profiles/search', {
      // Match all profiles
      condition: {
        type: 'matchAllCondition'
      },
      // Pagination
      offset: offset,
      limit: size,
      // Sort by last visit date
      sortby: 'properties.lastVisit DESC',
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching profiles:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

export async function getUnomiProfile(profileId: string): Promise<UnomiProfile> {
  try {
    console.log('UnomiService: Fetching profile:', profileId);
    const response = await axios.get(`/api/cxs/profiles/${profileId}`);
    console.log('UnomiService: Received response:', response.data);

    if (!response.data) {
      throw new Error('No profile data received');
    }

    return response.data;
  } catch (error) {
    console.error('UnomiService: Error fetching profile:', error);
    throw error;
  }
}

export async function getProfileEvents(
  condition: Condition,
  size: number = 5
): Promise<UnomiEvent[]> {
  try {
    const response = await axios.post('/api/cxs/events/search', {
      condition,
      offset: 0,
      limit: size,
      sortby: 'timeStamp:desc'
    });
    return response.data.list || [];
  } catch (error) {
    console.error('Error fetching profile events:', error);
    throw error;
  }
}

export async function queryAggregate(
  query: AggregateQuery,
  optimized: boolean = true
): Promise<AggregateResponse> {
  try {
    let endpoint = `/api/cxs/query/${query.type}/${query.property}`;
    endpoint += optimized ? '?optimizedQuery=true' : '';

    const response = await axios.post(endpoint, {
      aggregate: query.aggregate,
      condition: query.condition
    });

    return response.data;
  } catch (error) {
    console.error('Error performing aggregate query:', error);
    throw error;
  }
}

export async function deleteProfile(profileId: string) {
  try {
    await axios.delete(`/api/cxs/profiles/${profileId}`);
  } catch (error) {
    console.error('Error deleting profile:', error);
    throw error;
  }
}

/** Persona list item with id for use in list hooks (id mirrors itemId). */
export interface UnomiPersonaListItem {
  id: string;
  itemId: string;
  properties?: Record<string, unknown>;
  segments?: string[];
  scores?: Record<string, number>;
  anonymousProfile?: boolean;
}

export async function getAllPersonas(): Promise<UnomiPersonaListItem[]> {
  try {
    const response = await axios.post<{ list?: Array<UnomiPersonaListItem & { itemId: string }> }>(
      '/api/cxs/profiles/personas/search',
      { condition: { type: 'matchAllCondition' }, offset: 0, limit: 100 }
    );
    const list = response.data?.list ?? [];
    return list.map((p) => ({ ...p, id: p.itemId }));
  } catch (error) {
    console.error('Error fetching personas:', error);
    throw error;
  }
}
