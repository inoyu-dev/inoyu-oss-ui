import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UnomiEvent, JsonSchema, getAllJsonSchemas, getJsonSchema, getAllPropertyTypes, PropertyType } from '@/services/client/UnomiClientService';
import { formatDateTime } from '@/utils/dateTime';
import { findSchemaForEvent, getSchemaProperties } from '@/utils/schemaMatcher';
import {
  findDisplayMapping,
  getDisplayTypeFromSchema,
  renderPropertyValue,
  PropertyDisplayMapping
} from '@/utils/propertyDisplayMappings';
import {
  createDisplayMappingsFromPropertyTypes,
  mergePropertyTypeMappings,
  getDisplayTypeFromPropertyType
} from '@/utils/propertyTypeDisplayMapper';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw } from 'lucide-react';

interface SchemaBasedEventRendererProps {
  event: UnomiEvent;
  compact?: boolean;
  customMappings?: PropertyDisplayMapping[];
  fallbackRenderer?: React.ComponentType<{ event: UnomiEvent; compact: boolean }>;
  usePropertyTypes?: boolean; // Whether to use property types for display mapping
}

export function SchemaBasedEventRenderer({
  event,
  compact = false,
  customMappings = [],
  fallbackRenderer,
  usePropertyTypes = true
}: SchemaBasedEventRendererProps) {
  const { t } = useTranslation();
  const [schema, setSchema] = useState<JsonSchema | null>(null);
  const [schemaId, setSchemaId] = useState<string | null>(null);
  const [propertyTypes, setPropertyTypes] = useState<PropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSchema() {
      try {
        setLoading(true);
        setError(null);

        // Fetch all schemas
        const schemaIds = await getAllJsonSchemas();
        const schemas = new Map<string, JsonSchema>();

        for (const id of schemaIds) {
          try {
            const s = await getJsonSchema(id);
            schemas.set(id, s);
          } catch (err) {
            console.error(`Error fetching schema ${id}:`, err);
          }
        }

        // Find matching schema
        const match = await findSchemaForEvent(event, schemas);
        if (match) {
          setSchema(match.schema);
          setSchemaId(match.schemaId);
        }

        // Fetch property types if enabled
        if (usePropertyTypes) {
          try {
            const allPropertyTypes = await getAllPropertyTypes();
            const allTypes: PropertyType[] = [
              ...(allPropertyTypes.profiles || []),
              ...(allPropertyTypes.sessions || [])
            ];
            setPropertyTypes(allTypes);
          } catch (err) {
            console.error('Error loading property types:', err);
            // Don't fail the whole render if property types fail to load
          }
        }
      } catch (err) {
        console.error('Error loading schema:', err);
        setError(err instanceof Error ? err.message : 'Failed to load schema');
      } finally {
        setLoading(false);
      }
    }

    loadSchema();
  }, [event, usePropertyTypes]);

  if (loading) {
    if (compact) {
      return (
        <div className="flex items-center space-x-2 p-2 bg-muted">
          <RefreshCw className="h-4 w-4 animate-spin text-muted-text" />
          <span className="text-xs text-muted-foreground">{t('Loading...')}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-text" />
        <span className="ml-2 text-muted-foreground">{t('Loading schema...')}</span>
      </div>
    );
  }

  if (error) {
    if (compact) {
      return (
        <div className="flex items-center space-x-2 p-2 bg-muted">
          <span className="text-xs text-destructive">{t('Error loading schema')}</span>
        </div>
      );
    }
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!schema) {
    // No schema found, use fallback renderer if provided
    if (fallbackRenderer) {
      const FallbackComponent = fallbackRenderer;
      return <FallbackComponent event={event} compact={compact} />;
    }
    // Otherwise return null (parent should handle fallback)
    return null;
  }

  // Merge property type mappings with custom mappings
  const effectiveMappings = usePropertyTypes && propertyTypes.length > 0
    ? mergePropertyTypeMappings(
        createDisplayMappingsFromPropertyTypes(propertyTypes),
        customMappings
      )
    : customMappings;

  if (compact) {
    return <CompactSchemaView event={event} schema={schema} formatDateTime={formatDateTime} />;
  }

  return (
    <FullSchemaView
      event={event}
      schema={schema}
      schemaId={schemaId}
      customMappings={effectiveMappings}
      propertyTypes={usePropertyTypes ? propertyTypes : []}
      t={t}
    />
  );
}

function CompactSchemaView({
  event,
  schema,
  formatDateTime
}: {
  event: UnomiEvent;
  schema: JsonSchema;
  formatDateTime: (timestamp: string) => { date: string; time: string; timezone: string };
}) {
  const { date, time, timezone } = formatDateTime(event.timeStamp);
  
  // Find the most important property to display
  const schemaProps = getSchemaProperties(schema);
  const importantProp = schemaProps.find(p => 
    ['url', 'title', 'name', 'id', 'elementId'].includes(p.path)
  ) || schemaProps[0];

  const displayValue = importantProp
    ? getPropertyValue(event as unknown as Record<string, unknown>, importantProp.path)
    : event.eventType;

  return (
    <div className="flex items-center space-x-2 p-2 bg-muted">
      <div className="min-w-[100px] text-foreground">
        <div className="text-[10px] font-medium">{date}</div>
        <div className="text-[10px]">{time}</div>
        <div className="text-[8px] text-muted-foreground">{timezone}</div>
      </div>
      <div className="flex-1">
        <div className="text-xs font-medium text-foreground">
          {schema.title || schema.self?.name || event.eventType}
        </div>
        {displayValue !== null && displayValue !== undefined && (
          <p className="text-[10px] text-muted-foreground truncate">
            {importantProp?.metadata?.title || importantProp?.path}: {String(displayValue)}
          </p>
        )}
      </div>
    </div>
  );
}

function FullSchemaView({
  event,
  schema,
  schemaId,
  customMappings,
  propertyTypes,
  t
}: {
  event: UnomiEvent;
  schema: JsonSchema;
  schemaId: string | null;
  customMappings: PropertyDisplayMapping[];
  propertyTypes: PropertyType[];
  t: (key: string) => string;
}) {
  const schemaProps = getSchemaProperties(schema);
  const requiredFields = schema.required || [];

  // Group properties by location (properties, target, source, root)
  const rootProps: typeof schemaProps = [];
  const propertiesProps: typeof schemaProps = [];
  const targetProps: typeof schemaProps = [];
  const sourceProps: typeof schemaProps = [];

  for (const prop of schemaProps) {
    if (prop.path.startsWith('properties.')) {
      propertiesProps.push({ ...prop, path: prop.path.replace('properties.', '') });
    } else if (prop.path.startsWith('target.')) {
      targetProps.push({ ...prop, path: prop.path.replace('target.', '') });
    } else if (prop.path.startsWith('source.')) {
      sourceProps.push({ ...prop, path: prop.path.replace('source.', '') });
    } else {
      rootProps.push(prop);
    }
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-md bg-white">
      {/* Header */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">
              {schema.title || schema.self?.name || event.eventType}
            </h2>
            {schema.self && (
              <div className="flex items-center space-x-2 mt-2">
                <Badge variant="outline">{schema.self.name}</Badge>
                {schema.self.version && (
                  <Badge variant="outline">v{schema.self.version}</Badge>
                )}
                {schema.self.target && (
                  <Badge variant="outline">{schema.self.target}</Badge>
                )}
              </div>
            )}
          </div>
          {schemaId && (
            <Badge variant="secondary" className="text-xs">
              Schema: {schemaId}
            </Badge>
          )}
        </div>
        {(schema.self as { description?: string })?.description && (
          <p className="text-sm text-muted-foreground mt-2">{(schema.self as { description?: string }).description}</p>
        )}
      </div>

      {/* Root-level properties */}
      {rootProps.length > 0 && (
        <PropertySection
          title={t('Event Information')}
          properties={rootProps}
          event={event}
          customMappings={customMappings}
          propertyTypes={propertyTypes}
          requiredFields={requiredFields}
          t={t}
        />
      )}

      {/* Event properties */}
      {propertiesProps.length > 0 && event.properties && (
        <PropertySection
          title={t('Properties')}
          properties={propertiesProps}
          event={event}
          dataSource={event.properties}
          customMappings={customMappings}
          propertyTypes={propertyTypes}
          requiredFields={requiredFields}
          t={t}
        />
      )}

      {/* Target properties */}
      {targetProps.length > 0 && event.target && (
        <PropertySection
          title={t('Target')}
          properties={targetProps}
          event={event}
          dataSource={typeof event.target === 'object' ? event.target : {}}
          customMappings={customMappings}
          propertyTypes={propertyTypes}
          requiredFields={requiredFields}
          t={t}
        />
      )}

      {/* Source properties */}
      {sourceProps.length > 0 && event.source && (
        <PropertySection
          title={t('Source')}
          properties={sourceProps}
          event={event}
          dataSource={typeof event.source === 'object' ? event.source : {}}
          customMappings={customMappings}
          propertyTypes={propertyTypes}
          requiredFields={requiredFields}
          t={t}
        />
      )}

      {/* Timestamp (always shown) */}
      <div className="border-t pt-4">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm">{t('Timestamp')}:</span>
          <span className="text-sm">
            {new Date(event.timeStamp).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Show any properties not in schema */}
      {event.properties && Object.keys(event.properties).length > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-semibold text-sm mb-2">{t('Additional Properties')}</h3>
          <div className="space-y-2">
            {Object.entries(event.properties).map(([key, value]) => {
              // Skip if already shown in schema
              if (propertiesProps.some(p => p.path === key)) return null;
              
              return (
                <div key={key} className="flex items-start space-x-2 text-sm">
                  <span className="font-medium text-muted-foreground">{key}:</span>
                  <span className="flex-1">
                    {typeof value === 'object' ? (
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PropertySection({
  title,
  properties,
  event,
  dataSource,
  customMappings,
  propertyTypes,
  requiredFields,
  t
}: {
  title: string;
  properties: Array<{ path: string; metadata: Record<string, unknown> }>;
  event: UnomiEvent;
  dataSource?: Record<string, unknown>;
  customMappings: PropertyDisplayMapping[];
  propertyTypes: PropertyType[];
  requiredFields: string[];
  t: (key: string) => string;
}) {
  const source = (dataSource || event) as Record<string, unknown>;

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="font-semibold text-lg mb-4">{title}</h3>
        <div className="space-y-4">
          {properties.map((prop) => {
            const value = getPropertyValue(source, prop.path);
            const isRequired = requiredFields.includes(prop.path);
            const mapping = findDisplayMapping(prop.path, customMappings);
            
            // Try to get display type from property types first, then schema, then default
            const displayType = mapping?.displayType || 
              (propertyTypes.length > 0 
                ? getDisplayTypeFromPropertyType(propertyTypes, prop.path, getDisplayTypeFromSchema(prop.metadata))
                : getDisplayTypeFromSchema(prop.metadata));
            
            const label = String(mapping?.label || prop.metadata.title || prop.path || '');

            // Don't show if value is null/undefined and not required
            if (value === null || value === undefined) {
              if (!isRequired) return null;
            }

            const description = prop.metadata.description ? String(prop.metadata.description) : null;

            return (
              <div key={prop.path} className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm">{label}:</span>
                  {isRequired && (
                    <Badge variant="destructive" className="text-xs">{t('Required')}</Badge>
                  )}
                  {description && (
                    <span className="text-xs text-muted-foreground">
                      ({description})
                    </span>
                  )}
                </div>
                <div className="pl-2">
                  {value !== null && value !== undefined ? (
                    renderPropertyValue(value, displayType, mapping || undefined)
                  ) : (
                    <span className="text-muted-foreground italic">{t('Not set')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Gets a property value from an event object, supporting nested paths.
 */
function getPropertyValue(
  obj: Record<string, unknown>,
  path: string
): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (typeof current === 'object' && current !== null && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return current;
}
