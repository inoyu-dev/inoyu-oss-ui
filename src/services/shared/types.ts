export enum ConditionTarget {
  EVENT = 'event',
  SESSION = 'session',
  PROFILE = 'profile',
  ALL = 'all'
}

export type ComparisonOperator = 
  | 'equals'
  | 'notEquals'
  | 'lessThan'
  | 'greaterThan'
  | 'lessThanOrEqualTo'
  | 'greaterThanOrEqualTo'
  | 'between'
  | 'exists'
  | 'missing'
  | 'contains'
  | 'notContains'
  | 'startsWith'
  | 'endsWith'
  | 'matchesRegex'
  | 'in'
  | 'notIn';

/**
 * Base interface for all condition types in Unomi.
 * Conditions are used to evaluate profiles, sessions, and events.
 */
export interface BaseCondition {
  /** Type of condition (e.g., 'profilePropertyCondition', 'booleanCondition') */
  type: string;
  /** Parameter values specific to this condition type */
  parameterValues: Record<string, unknown>;
}

/**
 * Condition that evaluates a property value against a comparison operator.
 * Can be used for profile, session, or event properties.
 */
export interface PropertyCondition extends BaseCondition {
  /** Type of property condition */
  type: 'profilePropertyCondition' | 'sessionPropertyCondition' | 'eventPropertyCondition';
  /** Parameters for the property condition */
  parameterValues: {
    /** Name of the property to evaluate */
    propertyName: string;
    /** Value to compare against */
    propertyValue: string | number | boolean | null | Array<string | number>;
    /** Comparison operator to use */
    comparisonOperator?: ComparisonOperator;
  };
}

/**
 * Logical condition that combines multiple sub-conditions with AND/OR operators.
 * Used to create complex condition logic.
 */
export interface BooleanCondition extends BaseCondition {
  /** Type identifier for boolean conditions */
  type: 'booleanCondition';
  /** Parameters for the boolean condition */
  parameterValues: {
    /** Logical operator to combine sub-conditions */
    operator: 'and' | 'or';
    /** Array of sub-conditions to evaluate */
    subConditions: Condition[];
  };
}

export type AggregationType = 
  | 'date'           // Date-based grouping
  | 'numeric'        // Numeric calculations
  | 'terms'          // Group by field values
  | 'ipRange'        // IP address ranges
  | 'dateRange'      // Custom date ranges
  | 'numericRange';  // Numeric value ranges

export type MetricType = 
  | 'count'          // Count occurrences
  | 'sum'            // Sum values
  | 'avg'            // Average value
  | 'min'            // Minimum value
  | 'max'            // Maximum value
  | 'cardinality';   // Count unique values

// Map condition types to their allowed targets
export const CONDITION_TARGET_MAP: Record<string, ConditionTarget[]> = {
  // Basic Property Conditions
  'profilePropertyCondition': [ConditionTarget.PROFILE],
  'sessionPropertyCondition': [ConditionTarget.SESSION],
  'eventPropertyCondition': [ConditionTarget.EVENT],
  
  // Logical Conditions
  'booleanCondition': [ConditionTarget.ALL],
  'matchAllCondition': [ConditionTarget.ALL],
  'notCondition': [ConditionTarget.ALL],
  
  // Profile-Specific Conditions
  'profileSegmentCondition': [ConditionTarget.PROFILE],
  'profileAliasesPropertyCondition': [ConditionTarget.PROFILE],
  'profileUserListCondition': [ConditionTarget.PROFILE],
  'pastEventCondition': [ConditionTarget.PROFILE],
  'scoringCondition': [ConditionTarget.PROFILE],
  'goalMatchCondition': [ConditionTarget.PROFILE],
  'pathCondition': [ConditionTarget.PROFILE],
  'eventOccurrenceCondition': [ConditionTarget.PROFILE],
  
  // Session-Specific Conditions
  'sessionDurationCondition': [ConditionTarget.SESSION],
  'geoLocationSessionCondition': [ConditionTarget.SESSION],
  'deviceTypeCondition': [ConditionTarget.SESSION],
  'userAgentCondition': [ConditionTarget.SESSION],
  
  // Event-Specific Conditions
  'eventTypeCondition': [ConditionTarget.EVENT],
  'formEventCondition': [ConditionTarget.EVENT],
  'pageViewEventCondition': [ConditionTarget.EVENT],
  'sessionCreatedEventCondition': [ConditionTarget.EVENT],
  'loginEventCondition': [ConditionTarget.EVENT],
  
  // Multi-Target Conditions
  'propertyCondition': [ConditionTarget.PROFILE, ConditionTarget.SESSION, ConditionTarget.EVENT],
  'scriptCondition': [ConditionTarget.PROFILE, ConditionTarget.SESSION, ConditionTarget.EVENT],
  'propertyComparisonCondition': [ConditionTarget.PROFILE, ConditionTarget.SESSION, ConditionTarget.EVENT]
};

export type Condition = BaseCondition | PropertyCondition | BooleanCondition;

/**
 * Unomi Action — used in rules and other automation.
 */
export interface Action {
  type: string;
  parameterValues: Record<string, unknown>;
}

/**
 * Base interface for aggregation operations.
 * Aggregations group and summarize data for analytics.
 */
export interface BaseAggregate {
  /** Type of aggregation to perform */
  type: AggregationType;
  /** Field name to aggregate on */
  field: string;
  /** Additional parameters for the aggregation */
  parameters?: Record<string, unknown>;
}

/**
 * Defines a date range for filtering or grouping data.
 * Used in date histogram aggregations and time-based queries.
 */
export interface DateRange {
  /** Key identifier for this range */
  key: string;
  /** Start date (ISO format) */
  from?: string;
  /** End date (ISO format) */
  to?: string;
}

/**
 * Defines a numeric range for filtering or grouping data.
 * Used in range aggregations and numeric queries.
 */
export interface NumericRange {
  /** Key identifier for this range */
  key: string;
  /** Minimum value (inclusive) */
  from?: number;
  /** Maximum value (inclusive) */
  to?: number;
}

/**
 * Defines an IP address range for filtering or grouping data.
 * Used in IP-based geolocation and network analysis.
 */
export interface IpRange {
  /** Key identifier for this range */
  key: string;
  /** Starting IP address */
  from?: string;
  /** Ending IP address */
  to?: string;
}

/**
 * Complete aggregation configuration with ranges.
 * Defines how to group and aggregate data across different dimensions.
 */
export interface Aggregate {
  /** Target object type to aggregate (profile, session, event) */
  type: ConditionTarget;
  /** Property name to aggregate on */
  property: string;
  /** Additional aggregation parameters */
  parameters: Record<string, unknown>;
  /** Date ranges for time-based grouping */
  dateRanges: DateRange[];
  /** Numeric ranges for value-based grouping */
  numericRanges: NumericRange[];
  /** IP ranges for network-based grouping */
  ipRanges: IpRange[];
}

/**
 * Query structure for performing aggregations.
 * Combines aggregation configuration with filtering conditions.
 */
export interface AggregateQuery {
  /** Target object type (profile, session, event) */
  type: ConditionTarget;
  /** Property name to aggregate */
  property: string;
  /** Type of aggregation to perform */
  aggregationType: AggregationType;
  /** Aggregation configuration with ranges */
  aggregate: Aggregate;
  /** Condition to filter data before aggregation */
  condition: Condition;
}

/**
 * Response from an aggregation query.
 * Contains aggregated values keyed by bucket/range identifiers.
 */
export interface AggregateResponse {
  [key: string]: number;
}

