import axios from 'axios';
import type { PropertyType, PropertyTypesByTarget } from './unomi-types';

/**
 * Get all property types grouped by target.
 */
export async function getAllPropertyTypes(): Promise<PropertyTypesByTarget> {
  try {
    const response = await axios.get<PropertyTypesByTarget>('/api/cxs/profiles/properties');
    return response.data || {};
  } catch (error) {
    console.error('Error fetching property types:', error);
    throw error;
  }
}

/**
 * Get all property types for a specific target (profiles or sessions).
 */
export async function getPropertyTypesByTarget(target: 'profiles' | 'sessions'): Promise<PropertyType[]> {
  try {
    const response = await axios.get<PropertyType[]>(`/api/cxs/profiles/properties/targets/${target}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching property types by target:', error);
    throw error;
  }
}

/**
 * Get a specific property type by ID.
 */
export async function getPropertyType(propertyTypeId: string): Promise<PropertyType> {
  try {
    const response = await axios.get<PropertyType>(`/api/cxs/profiles/properties/${propertyTypeId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching property type:', error);
    throw error;
  }
}

/**
 * Get property types filtered by tags.
 */
export async function getPropertyTypesByTags(tags: string[]): Promise<PropertyType[]> {
  try {
    const tagsParam = tags.join(',');
    const response = await axios.get<PropertyType[]>(`/api/cxs/profiles/properties/tags/${tagsParam}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching property types by tags:', error);
    throw error;
  }
}

/**
 * Get property types filtered by system tag.
 */
export async function getPropertyTypesBySystemTag(systemTag: string): Promise<PropertyType[]> {
  try {
    const response = await axios.get<PropertyType[]>(`/api/cxs/profiles/properties/systemTags/${systemTag}`);
    return response.data || [];
  } catch (error) {
    console.error('Error fetching property types by system tag:', error);
    throw error;
  }
}

/**
 * Create or update a property type.
 */
export async function savePropertyType(propertyType: PropertyType): Promise<PropertyType> {
  try {
    const response = await axios.post<PropertyType>('/api/cxs/profiles/properties', propertyType);
    return response.data;
  } catch (error) {
    console.error('Error saving property type:', error);
    throw error;
  }
}

/**
 * Delete a property type.
 */
export async function deletePropertyType(propertyTypeId: string): Promise<void> {
  try {
    await axios.delete(`/api/cxs/profiles/properties/${propertyTypeId}`);
  } catch (error) {
    console.error('Error deleting property type:', error);
    throw error;
  }
}
