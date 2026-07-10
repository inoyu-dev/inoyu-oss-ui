import axios from 'axios';
import type { JsonSchema, ValidationError } from './unomi-types';

export async function getAllJsonSchemas(): Promise<string[]> {
  try {
    const response = await axios.get<string[]>('/api/json-schemas');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching JSON schemas:', error);
    throw error;
  }
}

export async function getJsonSchema(schemaId: string): Promise<JsonSchema> {
  try {
    const response = await axios.get<JsonSchema>(`/api/json-schemas/${schemaId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching JSON schema:', error);
    throw error;
  }
}

export async function saveJsonSchema(schema: JsonSchema): Promise<void> {
  try {
    await axios.post('/api/json-schemas', schema);
  } catch (error) {
    console.error('Error saving JSON schema:', error);
    throw error;
  }
}

export async function deleteJsonSchema(schemaId: string): Promise<void> {
  try {
    await axios.delete(`/api/json-schemas/${schemaId}`);
  } catch (error) {
    console.error('Error deleting JSON schema:', error);
    throw error;
  }
}

export async function validateEvent(event: Record<string, unknown> | string): Promise<ValidationError[]> {
  try {
    const response = await axios.post<ValidationError[]>('/api/json-schemas/validate', event);
    return response.data || [];
  } catch (error) {
    console.error('Error validating event:', error);
    throw error;
  }
}
