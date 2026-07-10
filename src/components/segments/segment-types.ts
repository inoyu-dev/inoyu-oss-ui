import {
  Users,
  Activity,
  ShoppingCart,
  Mail,
  Smartphone,
  type LucideIcon,
} from 'lucide-react';

/** Condition operator type for segment conditions */
export type SegmentConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'notContains'
  | 'greaterThan'
  | 'lessThan'
  | 'greaterThanOrEqual'
  | 'lessThanOrEqual'
  | 'exists'
  | 'notExists'
  | 'startsWith'
  | 'endsWith'
  | 'in'
  | 'notIn'
  | 'between';

/** Condition type for segment conditions */
export type SegmentConditionType =
  | 'profileProperty'
  | 'sessionProperty'
  | 'eventProperty'
  | 'booleanCondition'
  | 'dateProperty';

export interface SegmentCondition {
  id: string;
  type: SegmentConditionType;
  field: string;
  operator: SegmentConditionOperator;
  value: string | number | string[] | { from: string; to: string };
  displayName?: string;
  group?: string;
}

export interface SegmentGroup {
  id: string;
  name: string;
  operator: 'and' | 'or';
  conditions: SegmentCondition[];
  groups?: SegmentGroup[];
}

export interface FieldCategory {
  label: string;
  icon: LucideIcon;
  fields: Array<{ key: string; label: string; type: string }>;
}

/** Predefined field categories for the condition builder */
export const FIELD_CATEGORIES: Record<string, FieldCategory> = {
  demographics: {
    label: 'Demographics',
    icon: Users,
    fields: [
      { key: 'properties.age', label: 'Age', type: 'number' },
      { key: 'properties.gender', label: 'Gender', type: 'string' },
      { key: 'properties.country', label: 'Country', type: 'string' },
      { key: 'properties.city', label: 'City', type: 'string' },
      { key: 'properties.language', label: 'Language', type: 'string' },
      { key: 'properties.timezone', label: 'Timezone', type: 'string' },
    ],
  },
  behavior: {
    label: 'Behavior',
    icon: Activity,
    fields: [
      { key: 'properties.pageViews', label: 'Page Views', type: 'number' },
      { key: 'properties.sessions', label: 'Total Sessions', type: 'number' },
      { key: 'properties.lastVisit', label: 'Last Visit', type: 'date' },
      { key: 'properties.firstVisit', label: 'First Visit', type: 'date' },
      { key: 'properties.totalTimeOnSite', label: 'Total Time on Site', type: 'number' },
      { key: 'properties.bounceRate', label: 'Bounce Rate', type: 'number' },
    ],
  },
  ecommerce: {
    label: 'E-commerce',
    icon: ShoppingCart,
    fields: [
      { key: 'properties.totalRevenue', label: 'Total Revenue', type: 'number' },
      { key: 'properties.totalOrders', label: 'Total Orders', type: 'number' },
      { key: 'properties.averageOrderValue', label: 'Average Order Value', type: 'number' },
      { key: 'properties.lastPurchase', label: 'Last Purchase', type: 'date' },
      { key: 'properties.favoriteCategory', label: 'Favorite Category', type: 'string' },
      { key: 'properties.loyaltyStatus', label: 'Loyalty Status', type: 'string' },
    ],
  },
  engagement: {
    label: 'Engagement',
    icon: Mail,
    fields: [
      { key: 'properties.emailOpens', label: 'Email Opens', type: 'number' },
      { key: 'properties.emailClicks', label: 'Email Clicks', type: 'number' },
      { key: 'properties.socialShares', label: 'Social Shares', type: 'number' },
      { key: 'properties.downloadCount', label: 'Downloads', type: 'number' },
      { key: 'properties.subscriptionStatus', label: 'Subscription Status', type: 'string' },
      { key: 'properties.engagementScore', label: 'Engagement Score', type: 'number' },
    ],
  },
  technical: {
    label: 'Technical',
    icon: Smartphone,
    fields: [
      { key: 'properties.device', label: 'Device Type', type: 'string' },
      { key: 'properties.browser', label: 'Browser', type: 'string' },
      { key: 'properties.operatingSystem', label: 'Operating System', type: 'string' },
      { key: 'properties.referrer', label: 'Referrer', type: 'string' },
      { key: 'properties.utmSource', label: 'UTM Source', type: 'string' },
      { key: 'properties.userAgent', label: 'User Agent', type: 'string' },
    ],
  },
};

/** Operators by field type */
export const OPERATORS: Record<
  string,
  Array<{ value: SegmentConditionOperator; label: string }>
> = {
  string: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'contains', label: 'Contains' },
    { value: 'notContains', label: 'Does Not Contain' },
    { value: 'startsWith', label: 'Starts With' },
    { value: 'endsWith', label: 'Ends With' },
    { value: 'exists', label: 'Exists' },
    { value: 'notExists', label: 'Does Not Exist' },
    { value: 'in', label: 'Is One Of' },
    { value: 'notIn', label: 'Is Not One Of' },
  ],
  number: [
    { value: 'equals', label: 'Equals' },
    { value: 'notEquals', label: 'Not Equals' },
    { value: 'greaterThan', label: 'Greater Than' },
    { value: 'lessThan', label: 'Less Than' },
    { value: 'greaterThanOrEqual', label: 'Greater Than or Equal' },
    { value: 'lessThanOrEqual', label: 'Less Than or Equal' },
    { value: 'between', label: 'Between' },
    { value: 'exists', label: 'Exists' },
    { value: 'notExists', label: 'Does Not Exist' },
  ],
  date: [
    { value: 'equals', label: 'Is Exactly' },
    { value: 'greaterThan', label: 'After' },
    { value: 'lessThan', label: 'Before' },
    { value: 'greaterThanOrEqual', label: 'On or After' },
    { value: 'lessThanOrEqual', label: 'On or Before' },
    { value: 'between', label: 'Between' },
    { value: 'exists', label: 'Exists' },
    { value: 'notExists', label: 'Does Not Exist' },
  ],
};

/** Get human-readable label for a field key */
export function getFieldLabel(fieldKey: string): string {
  for (const category of Object.values(FIELD_CATEGORIES)) {
    const field = category.fields.find((f) => f.key === fieldKey);
    if (field) return field.label;
  }
  return fieldKey;
}

/** Get field type (string, number, date) for a field key */
export function getFieldType(fieldKey: string): string {
  for (const category of Object.values(FIELD_CATEGORIES)) {
    const field = category.fields.find((f) => f.key === fieldKey);
    if (field) return field.type;
  }
  return 'string';
}
