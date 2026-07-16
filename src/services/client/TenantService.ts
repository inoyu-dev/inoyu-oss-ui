/**
 * Client service for tenant management (Unomi 3.1+ on-prem).
 */

import axios from 'axios';

export interface Tenant {
  tenantId: string;
  itemId?: string;
  name?: string;
  description?: string;
  status?: string;
  properties?: Record<string, unknown>;
  publicApiKey?: string;
  privateApiKey?: string;
  apiKeys?: Array<{
    type: 'PUBLIC' | 'PRIVATE';
    key?: string;
    maskedKey?: string;
    createdAt?: string;
    revoked?: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Client-facing create/update payload.
 * `name` is a UI convenience; the API maps it to Unomi `properties.name`
 * (Unomi TenantRequest only accepts `requestedId` and `properties`).
 */
export interface TenantRequest {
  requestedId: string;
  name?: string;
  properties?: Record<string, unknown>;
}

export interface TenantKeys {
  publicApiKey: string;
  privateApiKey: string;
  saved?: boolean;
}

export interface LoginAsTenantResponse {
  tenantId: string;
  publicApiKey: string;
  privateApiKey: string;
  name?: string;
}

function unwrapError(error: unknown): Error {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: string } | undefined;
    if (data?.error) {
      return new Error(data.error);
    }
  }
  return error instanceof Error ? error : new Error('Unknown error');
}

export class TenantService {
  async listTenants(): Promise<Tenant[]> {
    try {
      const response = await axios.get<Tenant[]>('/api/tenants');
      return response.data;
    } catch (error) {
      throw unwrapError(error);
    }
  }

  async getTenant(tenantId: string): Promise<Tenant> {
    try {
      const response = await axios.get<Tenant>(`/api/tenants/${tenantId}`);
      return response.data;
    } catch (error) {
      throw unwrapError(error);
    }
  }

  async createTenant(tenantRequest: TenantRequest): Promise<Tenant> {
    try {
      const response = await axios.post<Tenant>('/api/tenants', tenantRequest);
      return response.data;
    } catch (error) {
      throw unwrapError(error);
    }
  }

  async updateTenant(tenantId: string, updates: Partial<TenantRequest>): Promise<Tenant> {
    try {
      const response = await axios.put<Tenant>(`/api/tenants/${tenantId}`, updates);
      return response.data;
    } catch (error) {
      throw unwrapError(error);
    }
  }

  async deleteTenant(tenantId: string): Promise<void> {
    try {
      await axios.delete(`/api/tenants/${tenantId}`);
    } catch (error) {
      throw unwrapError(error);
    }
  }

  async generateApiKeys(tenantId: string): Promise<TenantKeys> {
    try {
      const response = await axios.post<TenantKeys>(`/api/tenants/${tenantId}/keys`);
      return response.data;
    } catch (error) {
      throw unwrapError(error);
    }
  }

  async loginAsTenant(tenantId: string): Promise<LoginAsTenantResponse> {
    try {
      const response = await axios.post<LoginAsTenantResponse>(`/api/tenants/${tenantId}/login-as`);
      return response.data;
    } catch (error) {
      throw unwrapError(error);
    }
  }
}

export const tenantService = new TenantService();
