import axios from 'axios';
import type { PartialListProfile, UnomiMetadata, UnomiSegment } from './unomi-types';

export async function getAllSegments(offset: number = 0, size: number = 50, sort?: string): Promise<UnomiMetadata[]> {
  try {
    const params = new URLSearchParams({
      offset: offset.toString(),
      size: size.toString(),
    });

    if (sort) {
      params.append('sort', sort);
    }

    const response = await axios.get(`/api/cxs/segments?${params.toString()}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching segments:', error);
    throw error;
  }
}

export async function getSegmentDefinition(segmentId: string): Promise<UnomiSegment> {
  try {
    const response = await axios.get(`/api/cxs/segments/${segmentId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching segment definition:', error);
    throw error;
  }
}

export async function getSegmentProfiles(
  segmentId: string,
  offset: number = 0,
  size: number = 50,
  sort?: string
): Promise<PartialListProfile> {
  try {
    const params = new URLSearchParams({
      offset: offset.toString(),
      size: size.toString(),
    });

    if (sort) {
      params.append('sort', sort);
    }

    const response = await axios.get(`/api/cxs/segments/${segmentId}/match?${params.toString()}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching segment profiles:', error);
    throw error;
  }
}

export async function getSegmentProfileCount(segmentId: string): Promise<number> {
  try {
    const response = await axios.get(`/api/cxs/segments/${segmentId}/count`);
    return response.data;
  } catch (error) {
    console.error('Error fetching segment profile count:', error);
    throw error;
  }
}

export async function deleteSegment(segmentId: string, validate: boolean = true): Promise<void> {
  try {
    const params = new URLSearchParams();
    if (validate) {
      params.append('validate', 'true');
    }

    await axios.delete(`/api/cxs/segments/${segmentId}?${params.toString()}`);
  } catch (error) {
    console.error('Error deleting segment:', error);
    throw error;
  }
}

export async function createSegment(segmentData: Record<string, unknown>): Promise<UnomiSegment> {
  try {
    const response = await axios.post('/api/cxs/segments', segmentData);
    return response.data;
  } catch (error) {
    console.error('Error creating segment:', error);
    throw error;
  }
}

export async function updateSegment(segmentId: string, segmentData: Record<string, unknown>): Promise<UnomiSegment> {
  try {
    const response = await axios.put(`/api/cxs/segments/${segmentId}`, segmentData);
    return response.data;
  } catch (error) {
    console.error('Error updating segment:', error);
    throw error;
  }
}
