import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { getChartColors } from '@/lib/chartColors';

/**
 * Display types for property values that support fancy visualizations.
 */
export type PropertyDisplayType = 
  | 'text'
  | 'number'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'url'
  | 'email'
  | 'json'
  | 'chart-line'
  | 'chart-bar'
  | 'chart-pie'
  | 'chart-area'
  | 'location'
  | 'color'
  | 'badge'
  | 'code';

/**
 * Configuration for property display mappings.
 * Maps property paths to display types and custom renderers.
 */
export interface PropertyDisplayMapping {
  /** Property path (e.g., 'url', 'properties.price', 'target.elementId') */
  path: string;
  /** Display type for the property */
  displayType: PropertyDisplayType;
  /** Optional custom label override */
  label?: string;
  /** Optional format function */
  format?: (value: unknown) => string | React.ReactNode;
  /** Chart configuration for chart display types */
  chartConfig?: {
    xAxisKey?: string;
    yAxisKey?: string;
    dataKey?: string;
    colors?: string[];
  };
}

/**
 * Default display mappings for common property types and patterns.
 */
export const DEFAULT_PROPERTY_MAPPINGS: PropertyDisplayMapping[] = [
  {
    path: 'timeStamp',
    displayType: 'datetime',
    label: 'Timestamp'
  },
  {
    path: 'url',
    displayType: 'url',
    label: 'URL'
  },
  {
    path: 'pageUrl',
    displayType: 'url',
    label: 'Page URL'
  },
  {
    path: 'email',
    displayType: 'email',
    label: 'Email'
  },
  {
    path: 'emailId',
    displayType: 'text',
    label: 'Email ID'
  },
  {
    path: 'userId',
    displayType: 'text',
    label: 'User ID'
  },
  {
    path: 'profileId',
    displayType: 'text',
    label: 'Profile ID'
  },
  {
    path: 'price',
    displayType: 'number',
    label: 'Price',
    format: (value) => {
      if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
      return String(value);
    }
  },
  {
    path: 'amount',
    displayType: 'number',
    label: 'Amount',
    format: (value) => {
      if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(value);
      }
      return String(value);
    }
  },
  {
    path: 'quantity',
    displayType: 'number',
    label: 'Quantity'
  },
  {
    path: 'status',
    displayType: 'badge',
    label: 'Status'
  },
  {
    path: 'action',
    displayType: 'badge',
    label: 'Action'
  },
  {
    path: 'enabled',
    displayType: 'boolean',
    label: 'Enabled'
  },
  {
    path: 'active',
    displayType: 'boolean',
    label: 'Active'
  }
];

/**
 * Finds a display mapping for a property path.
 */
export function findDisplayMapping(
  propertyPath: string,
  customMappings: PropertyDisplayMapping[] = []
): PropertyDisplayMapping | null {
  // Check custom mappings first
  for (const mapping of customMappings) {
    if (mapping.path === propertyPath || propertyPath.endsWith(`.${mapping.path}`)) {
      return mapping;
    }
  }

  // Check default mappings
  for (const mapping of DEFAULT_PROPERTY_MAPPINGS) {
    if (mapping.path === propertyPath || propertyPath.endsWith(`.${mapping.path}`)) {
      return mapping;
    }
  }

  return null;
}

/**
 * Determines display type from schema metadata.
 */
export function getDisplayTypeFromSchema(
  metadata: {
    type?: string;
    format?: string;
    displayType?: string;
    [key: string]: unknown;
  }
): PropertyDisplayType {
  // If displayType is explicitly set, use it
  if (metadata.displayType && typeof metadata.displayType === 'string') {
    return metadata.displayType as PropertyDisplayType;
  }

  // Use format if available
  if (metadata.format) {
    const format = String(metadata.format).toLowerCase();
    if (format === 'date-time' || format === 'datetime') return 'datetime';
    if (format === 'date') return 'date';
    if (format === 'email') return 'email';
    if (format === 'uri' || format === 'url') return 'url';
    if (format === 'color') return 'color';
  }

  // Use type
  const type = String(metadata.type || '').toLowerCase();
  if (type === 'string') return 'text';
  if (type === 'number' || type === 'integer') return 'number';
  if (type === 'boolean') return 'boolean';
  if (type === 'object') return 'json';
  if (type === 'array') return 'json';

  return 'text';
}

/**
 * Renders a property value based on its display type.
 */
export function renderPropertyValue(
  value: unknown,
  displayType: PropertyDisplayType,
  mapping?: PropertyDisplayMapping
): React.ReactNode {
  // Use custom format function if available
  if (mapping?.format) {
    return mapping.format(value);
  }

  switch (displayType) {
    case 'text':
      return String(value ?? '');
    
    case 'number':
      if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US').format(value);
      }
      return String(value ?? '');
    
    case 'boolean':
      return value ? 'Yes' : 'No';
    
    case 'date':
    case 'datetime':
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      if (typeof value === 'string') {
        try {
          const date = new Date(value);
          return date.toLocaleString();
        } catch {
          return String(value);
        }
      }
      return String(value ?? '');
    
    case 'url':
      if (typeof value === 'string') {
        return (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            className="text-info hover:underline"
          >
            {value}
          </a>
        );
      }
      return String(value ?? '');
    
    case 'email':
      if (typeof value === 'string') {
        return (
          <a
            href={`mailto:${value}`}
            className="text-info hover:underline"
          >
            {value}
          </a>
        );
      }
      return String(value ?? '');
    
    case 'json':
      return (
        <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    
    case 'badge':
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-info-light text-info-dark">
          {String(value ?? '')}
        </span>
      );
    
    case 'color':
      if (typeof value === 'string') {
        return (
          <div className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded border border-border"
              style={{ backgroundColor: value }}
            />
            <span>{value}</span>
          </div>
        );
      }
      return String(value ?? '');
    
    case 'code':
      return (
        <code className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
          {String(value ?? '')}
        </code>
      );
    
    case 'chart-line':
    case 'chart-bar':
    case 'chart-pie':
    case 'chart-area':
      // Chart rendering is handled separately in the component
      return renderChartValue(value, displayType, mapping);
    
    default:
      return String(value ?? '');
  }
}

/**
 * Renders a chart value (for array data).
 */
function renderChartValue(
  value: unknown,
  displayType: PropertyDisplayType,
  mapping?: PropertyDisplayMapping
): React.ReactNode {
  if (!Array.isArray(value) || value.length === 0) {
    return <span className="text-muted-foreground">No data available</span>;
  }

  const config = mapping?.chartConfig || {};
  const xAxisKey = config.xAxisKey || 'name';
  const yAxisKey = config.yAxisKey || 'value';
  const dataKey = config.dataKey || yAxisKey;
  const colors = config.colors || getChartColors();

  const data = value.map((item, index) => {
    if (typeof item === 'object' && item !== null) {
      return item;
    }
    return { [xAxisKey]: `Item ${index + 1}`, [yAxisKey]: item };
  });

  switch (displayType) {
    case 'chart-line':
      return (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} />
          </LineChart>
        </ResponsiveContainer>
      );
    
    case 'chart-bar':
      return (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey={dataKey} fill={colors[0]} />
          </BarChart>
        </ResponsiveContainer>
      );
    
    case 'chart-pie':
      return (
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill={colors[0] || getChartColors()[0]}
              dataKey={dataKey}
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      );
    
    case 'chart-area':
      return (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey={xAxisKey} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} fill={colors[0]} />
          </LineChart>
        </ResponsiveContainer>
      );
    
    default:
      return <pre className="bg-muted p-2 rounded text-xs">{JSON.stringify(value, null, 2)}</pre>;
  }
}
