import type { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '@/lib/api-auth';
import type { DecodedToken } from '@/lib/api-auth';
import { APIError } from '@/middleware/error-handling';
import { getTenantId } from '@/utils/tenant';
import { logger } from '@/utils/logger';

export { APIError };

/**
 * Extended request type for authenticated routes.
 * Use with `withAuth` or `createHandler({ auth: true })`.
 */
export interface AuthenticatedRequest extends NextApiRequest {
  user: DecodedToken;
  tenant: string;
}

/**
 * Standard API handler receiving the raw request and response.
 */
export type ApiHandler = (
  req: NextApiRequest,
  res: NextApiResponse
) => Promise<void | NextApiResponse>;

/**
 * Handler for authenticated routes; receives request with `user` and `tenant` set.
 */
export type AuthenticatedHandler = (
  req: AuthenticatedRequest,
  res: NextApiResponse
) => Promise<void | NextApiResponse>;

/**
 * Validates the HTTP method and sets the Allow header on 405.
 * Use by wrapping a handler: `withMethod('GET', 'POST')(handler)`.
 *
 * @param methods - Allowed HTTP methods (e.g. 'GET', 'POST')
 * @returns A function that wraps a handler with method validation
 *
 * @example
 * export default withMethod('GET', 'POST')(async (req, res) => { ... });
 */
export function withMethod(
  ...methods: string[]
): (handler: ApiHandler) => ApiHandler {
  const allowed = methods.map((m) => m.toUpperCase());
  return function wrapMethod(handler: ApiHandler): ApiHandler {
    return async function methodWrapper(
      req: NextApiRequest,
      res: NextApiResponse
    ): Promise<void | NextApiResponse> {
      const method = req.method?.toUpperCase();
      if (!method || !allowed.includes(method)) {
        res.setHeader('Allow', allowed.join(', '));
        return res.status(405).json({
          error: `Method ${req.method ?? 'undefined'} Not Allowed`
        });
      }
      return handler(req, res);
    };
  };
}

/**
 * Requires authentication via `requireAuth`, attaches `user` and `tenant` to the request,
 * then calls the handler. If not authenticated, the response is already sent and the handler is not called.
 *
 * @param handler - Handler that receives AuthenticatedRequest (with req.user and req.tenant)
 * @returns An ApiHandler that performs auth and then calls the inner handler
 *
 * @example
 * export default withAuth(async (req, res) => {
 *   // req.user and req.tenant are available
 *   return res.status(200).json({ data: await fetchData(req.tenant) });
 * });
 */
export function withAuth(handler: AuthenticatedHandler): ApiHandler {
  return async function authWrapper(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<void | NextApiResponse> {
    const user = requireAuth(req, res);
    if (!user) {
      return; // Response already sent by requireAuth
    }
    const tenant = getTenantId(req);
    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = user;
    authenticatedReq.tenant = tenant;
    return handler(authenticatedReq, res);
  };
}

/**
 * Wraps a handler in try/catch, logs errors with `logger.error`, and returns a standardized
 * JSON error response: `{ error: string, details?: unknown }`.
 * If the thrown error is an `APIError`, its `statusCode` and `message` are used; otherwise 500 is returned.
 *
 * @param handler - The API handler to wrap
 * @returns An ApiHandler with centralized error handling
 */
export function withErrorHandling(handler: ApiHandler): ApiHandler {
  return async function errorHandlingWrapper(
    req: NextApiRequest,
    res: NextApiResponse
  ): Promise<void | NextApiResponse> {
    try {
      return await handler(req, res);
    } catch (error) {
      if (error instanceof APIError) {
        logger.error('API error:', error.message, error.details ?? '');
        return res.status(error.statusCode).json({
          error: error.message,
          ...(error.details !== undefined && { details: error.details })
        });
      }
      const message = error instanceof Error ? error.message : 'Internal server error';
      logger.error('API error:', error);
      return res.status(500).json({
        error: 'Internal server error',
        details: message
      });
    }
  };
}

/**
 * Options for createHandler — authenticated variant.
 */
interface CreateHandlerAuthOptions {
  methods?: string[];
  auth: true;
  handler: AuthenticatedHandler;
}

/**
 * Options for createHandler — unauthenticated variant.
 */
interface CreateHandlerPublicOptions {
  methods?: string[];
  auth?: false;
  handler: ApiHandler;
}

/**
 * Union of all createHandler option shapes.
 */
export type CreateHandlerOptions = CreateHandlerAuthOptions | CreateHandlerPublicOptions;

/**
 * Combines method validation, optional auth, and error handling in one call.
 * Order of execution: method check → auth (if enabled) → handler, all wrapped in error handling.
 *
 * @param options - Configuration for methods, auth, and the handler
 * @returns An ApiHandler ready to use as the default export of an API route
 *
 * @example
 * // Simple: method + auth + error handling
 * export default createHandler({
 *   methods: ['GET', 'POST'],
 *   auth: true,
 *   handler: async (req, res) => {
 *     const data = await fetchData(req.tenant);
 *     return res.status(200).json(data);
 *   }
 * });
 *
 * @example
 * // No auth, method + error handling only
 * export default createHandler({
 *   methods: ['GET', 'POST', 'PATCH'],
 *   handler: async (req, res) => {
 *     const tenant = getTenantId(req);
 *     // ...
 *   }
 * });
 */
export function createHandler(options: CreateHandlerOptions): ApiHandler {
  let handler: ApiHandler =
    options.auth === true
      ? withAuth(options.handler as AuthenticatedHandler)
      : (options.handler as ApiHandler);

  if (options.methods !== undefined && options.methods.length > 0) {
    handler = withMethod(...options.methods)(handler);
  }

  return withErrorHandling(handler);
}
