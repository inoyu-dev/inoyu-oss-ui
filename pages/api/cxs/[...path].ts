import axios, { AxiosError } from 'axios';
import { DEFAULT_DEPLOYMENT_TYPE } from '@/config/env-defaults';
import { getUnomiConfig, getAuthHeaders, getAuthCredentials, isUnomiV3, hasV3Credentials } from '@/lib/unomi-config';
import { getDefaultFeatureFlags, DeploymentType } from '@/config/feature-flags';
import { createHandler, APIError } from '@/lib/api-middleware';

export default createHandler({
  // All HTTP methods allowed — proxied to Unomi
  handler: async (req, res) => {
    const { method, body } = req;
    const { path } = req.query;

    // Join the path segments to create the full path
    const fullPath = Array.isArray(path) ? path.join('/') : (path as string);
    const endpoint = `/cxs/${fullPath}`;

    // Check feature flags for restricted endpoints
    const deploymentType = (process.env.DEPLOYMENT_TYPE || DEFAULT_DEPLOYMENT_TYPE) as DeploymentType;
    const featureFlags = getDefaultFeatureFlags(deploymentType);

    if (endpoint.includes('/groovy-actions') && !featureFlags.groovyActions) {
      throw new APIError(403, 'Groovy Actions are not available in this deployment type');
    }

    // Get config with tenant context from request (for "login as tenant" support)
    const config = getUnomiConfig(req);

    // Determine authentication based on endpoint type and V3 configuration
    const isSystemEndpoint = endpoint.includes('/tenants') || endpoint.includes('/system');
    const isPublicEndpoint = endpoint.includes('/context.json') || endpoint.includes('/eventcollector');

    let auth: { username: string; password: string } | undefined;

    // Determine content type — preserve multipart/form-data for file uploads
    const contentType = req.headers['content-type'] || 'application/json';
    const headers: Record<string, string> = {
      'Content-Type': contentType,
    };

    // For multipart/form-data, don't set Content-Type header
    if (contentType.includes('multipart/form-data')) {
      delete headers['Content-Type'];
    }

    if (isSystemEndpoint) {
      auth = {
        username: config.systemUser,
        password: config.systemPassword
      };
    } else if (isUnomiV3() && hasV3Credentials(req)) {
      if (isPublicEndpoint) {
        const authHeaders = await getAuthHeaders(endpoint, req);
        Object.assign(headers, authHeaders);
      } else {
        const authCreds = await getAuthCredentials(endpoint, req);
        if (authCreds) {
          auth = authCreds;
        }
      }
    } else {
      auth = {
        username: config.systemUser,
        password: config.systemPassword
      };
    }

    try {
      const axiosConfig: {
        method: string;
        url: string;
        data?: unknown;
        headers: Record<string, string>;
        auth?: { username: string; password: string };
      } = {
        method: method ?? 'GET',
        url: `${config.baseUrl}${endpoint}`,
        headers,
      };

      if (method !== 'GET' && body) {
        axiosConfig.data = body;
      }

      if (auth) {
        axiosConfig.auth = auth;
      }

      const response = await axios(axiosConfig);

      // HTTP 204 (No Content) should not have a body
      if (response.status === 204) {
        return res.status(204).end();
      }

      return res.status(response.status).json(response.data);
    } catch (error: unknown) {
      const axiosError = error as AxiosError<{ error?: string }>;
      const status = axiosError.response?.status ?? 500;

      // HTTP 204 (No Content) should not have a body
      if (status === 204) {
        return res.status(204).end();
      }

      const errorData = axiosError.response?.data ?? { error: 'Internal server error' };
      return res.status(status).json(errorData);
    }
  }
});
