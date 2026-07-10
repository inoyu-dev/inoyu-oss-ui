/**
 * Client-side Mapping Service
 * Provides functions for managing event mapping configurations.
 */

export interface StoredMapping {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  [key: string]: unknown;
}

/**
 * Save or update a mapping configuration
 */
export async function saveMappingConfiguration(mapping: Record<string, unknown>): Promise<StoredMapping> {
  const id = mapping.id as string | undefined;
  const url = id ? `/api/mappings/${id}` : '/api/mappings/deploy';
  const method = id ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mapping),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to save mapping' }));
    throw new Error(error.error || 'Failed to save mapping configuration');
  }

  const data = await response.json();
  return data.mapping || data;
}

/**
 * Get all mapping configurations
 */
export async function getMappingConfigurations(): Promise<StoredMapping[]> {
  const response = await fetch('/api/mappings/deploy');
  if (!response.ok) {
    throw new Error('Failed to fetch mapping configurations');
  }
  const data = await response.json();
  return data.mappings || data;
}

/**
 * Update the active status of a mapping configuration
 */
export async function updateMappingStatus(id: string, isActive: boolean): Promise<void> {
  const response = await fetch(`/api/mappings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isActive }),
  });
  if (!response.ok) {
    throw new Error('Failed to update mapping status');
  }
}

/**
 * Delete a mapping configuration
 */
export async function deleteMappingConfiguration(id: string): Promise<void> {
  const response = await fetch(`/api/mappings/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error('Failed to delete mapping configuration');
  }
}
