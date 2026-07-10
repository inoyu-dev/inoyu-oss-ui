import { JsonSchema, UnomiEvent } from '@/services/client/UnomiClientService';

/**
 * Matches an event to a JSON schema based on event type and schema metadata.
 * Returns the best matching schema or null if none found.
 */
export async function findSchemaForEvent(
  event: UnomiEvent,
  schemas: Map<string, JsonSchema>
): Promise<{ schemaId: string; schema: JsonSchema } | null> {
  // First, try to find a schema that matches the event type
  // Schemas typically have self.target or self.name that matches event types
  for (const [schemaId, schema] of Array.from(schemas.entries())) {
    const self = schema.self;
    if (!self) continue;

    // Check if schema target or name matches event type
    if (
      self.target === event.eventType ||
      self.name === event.eventType ||
      self.name?.toLowerCase().replace(/\s+/g, '_') === event.eventType.toLowerCase()
    ) {
      return { schemaId, schema };
    }

    // Check if schema ID matches event type
    if (schemaId.toLowerCase() === event.eventType.toLowerCase()) {
      return { schemaId, schema };
    }
  }

  // If no exact match, try to find a schema that has properties matching the event
  // This is a fallback for more generic schemas
  for (const [schemaId, schema] of Array.from(schemas.entries())) {
    if (schema.properties && event.properties) {
      const schemaProps = Object.keys(schema.properties);
      const eventProps = Object.keys(event.properties);
      
      // If at least 50% of schema properties exist in event, consider it a match
      const matchingProps = schemaProps.filter(prop => eventProps.includes(prop));
      if (matchingProps.length > 0 && matchingProps.length / schemaProps.length >= 0.5) {
        return { schemaId, schema };
      }
    }
  }

  return null;
}

/**
 * Extracts property metadata from a JSON schema property definition.
 */
export function getPropertyMetadata(
  schema: JsonSchema,
  propertyPath: string
): {
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  enum?: unknown[];
  displayType?: string;
  [key: string]: unknown;
} | null {
  if (!schema.properties) return null;

  // Handle nested paths like "properties.url" or "target.elementId"
  const pathParts = propertyPath.split('.');
  let current: unknown = schema.properties;

  for (const part of pathParts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return null;
    }
  }

  if (typeof current === 'object' && current !== null) {
    return current as {
      type?: string;
      format?: string;
      title?: string;
      description?: string;
      enum?: unknown[];
      displayType?: string;
      [key: string]: unknown;
    };
  }

  return null;
}

/**
 * Gets all properties from a schema with their metadata.
 */
export function getSchemaProperties(schema: JsonSchema): Array<{
  path: string;
  metadata: {
    type?: string;
    format?: string;
    title?: string;
    description?: string;
    enum?: unknown[];
    displayType?: string;
    [key: string]: unknown;
  };
}> {
  const properties: Array<{
    path: string;
    metadata: {
      type?: string;
      format?: string;
      title?: string;
      description?: string;
      enum?: unknown[];
      displayType?: string;
      [key: string]: unknown;
    };
  }> = [];

  if (!schema.properties) return properties;

  // Extract top-level properties
  for (const [key, value] of Object.entries(schema.properties)) {
    if (typeof value === 'object' && value !== null) {
      properties.push({
        path: key,
        metadata: value as {
          type?: string;
          format?: string;
          title?: string;
          description?: string;
          enum?: unknown[];
          displayType?: string;
          [key: string]: unknown;
        }
      });
    }
  }

  return properties;
}
