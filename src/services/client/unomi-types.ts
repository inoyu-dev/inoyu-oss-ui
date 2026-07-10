import type { Condition } from '@/services/shared/types';

/**
 * Represents a customer profile in the Unomi CDP system.
 * Contains profile identification, properties, segments, and consent information.
 */
export interface UnomiProfile {
  /** Unique identifier for the profile */
  itemId: string;
  /** Profile properties including personal information and custom attributes */
  properties: {
    firstName: string;
    lastName: string;
    email: string;
    city?: string;
    firstVisit?: string;
    engagementScore?: number;
    lastActivityDate?: string;
    lifetimeValue?: number;
    [key: string]: unknown;
  };
  /** List of segment IDs that this profile belongs to */
  segments: string[];
  /** Consent information for GDPR compliance, keyed by consent type */
  consent?: {
    [consentType: string]: {
      status: 'granted' | 'denied' | 'pending' | 'withdrawn';
      lastUpdate: string;
      expiration?: string;
      purpose?: string;
      legalBasis?: string;
      [key: string]: unknown;
    };
  };
}

/**
 * Represents an event tracked in the Unomi CDP system.
 * Events capture user interactions and behaviors for analytics and personalization.
 */
export interface UnomiEvent {
  /** Unique identifier for the event */
  itemId: string;
  /** Type of event (e.g., 'pageView', 'click', 'purchase') */
  eventType: string;
  /** Scope identifier for multi-tenant systems */
  scope: string;
  /** ISO timestamp when the event occurred */
  timeStamp: string;
  /** Optional profile ID associated with this event */
  profileId?: string;
  /** Custom event properties */
  properties?: Record<string, unknown>;
  /** Source information (e.g., page URL, referrer) */
  source?: Record<string, unknown>;
  /** Target information (e.g., clicked element, destination) */
  target?: Record<string, unknown>;
}

/**
 * Metadata information for Unomi entities (segments, rules, actions, etc.).
 * Provides descriptive information and configuration flags.
 */
export interface UnomiMetadata {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Optional description */
  description?: string;
  /** Scope identifier for multi-tenant systems */
  scope: string;
  /** User-defined tags for categorization */
  tags?: string[];
  /** System-defined tags */
  systemTags?: string[];
  /** Whether the entity is currently enabled */
  enabled: boolean;
  /** Whether required plugins are missing */
  missingPlugins?: boolean;
  /** Whether the entity should be hidden in UI */
  hidden?: boolean;
  /** Whether the entity is read-only */
  readOnly?: boolean;
}

/**
 * Represents a customer segment definition in Unomi.
 * Segments group profiles based on conditions for targeting and personalization.
 */
export interface UnomiSegment {
  /** Unique identifier for the segment */
  itemId: string;
  /** Type of item (typically 'segment') */
  itemType: string;
  /** Scope identifier for multi-tenant systems */
  scope: string;
  /** Version number for optimistic locking */
  version: number;
  /** Metadata describing the segment */
  metadata: UnomiMetadata;
  /** Condition that defines which profiles belong to this segment */
  condition: Condition;
}

/**
 * Paginated list of metadata items.
 * Used for paginated API responses containing metadata arrays.
 */
export interface PartialListMetadata {
  /** Array of metadata items in this page */
  list: UnomiMetadata[];
  /** Total number of items across all pages */
  totalSize: number;
  /** Offset/index of the first item in this page */
  offset: number;
  /** Number of items in this page */
  size: number;
}

/**
 * Paginated list of profiles.
 * Used for paginated API responses containing profile arrays.
 */
export interface PartialListProfile {
  /** Array of profiles in this page */
  list: UnomiProfile[];
  /** Total number of profiles across all pages */
  totalSize: number;
  /** Offset/index of the first profile in this page */
  offset: number;
  /** Number of profiles in this page */
  size: number;
}

/**
 * Represents an action type definition in Unomi.
 * Action types define what actions can be executed when rules are triggered.
 */
export interface UnomiActionType {
  /** Unique identifier for the action type */
  itemId: string;
  /** Type of item (typically 'actionType') */
  itemType: string;
  /** Scope identifier for multi-tenant systems */
  scope: string;
  /** Version number for optimistic locking */
  version: number;
  /** Metadata describing the action type */
  metadata: UnomiMetadata;
  /** Executor class name that handles this action type */
  actionExecutor: string;
  /** Parameters that this action type accepts */
  parameters: Array<{
    id: string;
    type: string;
    multivalued: boolean;
    defaultValue?: unknown;
    [key: string]: unknown;
  }>;
}

/**
 * Represents a concrete action instance within a rule.
 * Contains the action type and parameter values for execution.
 */
export interface UnomiAction {
  /** The action type definition */
  actionType: UnomiActionType;
  /** ID of the action type */
  actionTypeId: string;
  /** Parameter values for this action instance */
  parameterValues: Record<string, unknown>;
}

/**
 * Represents a rule definition in Unomi.
 * Rules define when and what actions should be executed based on conditions.
 */
export interface UnomiRule {
  /** Unique identifier for the rule */
  itemId: string;
  /** Type of item (typically 'rule') */
  itemType: string;
  /** Scope identifier for multi-tenant systems */
  scope: string;
  /** Version number for optimistic locking */
  version: number;
  /** Metadata describing the rule */
  metadata: UnomiMetadata;
  /** Condition that must be met for the rule to trigger */
  condition: Condition;
  /** Actions to execute when the rule triggers */
  actions: UnomiAction[];
  /** IDs of linked items (segments, rules, etc.) */
  linkedItems?: string[];
  /** Whether to raise the event only once per profile */
  raiseEventOnlyOnceForProfile?: boolean;
  /** Whether to raise the event only once per session */
  raiseEventOnlyOnceForSession?: boolean;
  /** Whether to raise the event only once globally */
  raiseEventOnlyOnce?: boolean;
  /** Priority level (higher numbers execute first) */
  priority?: number;
}

/**
 * Statistics about rule execution performance.
 * Tracks execution counts and timing metrics for rule optimization.
 */
export interface UnomiRuleStatistics {
  /** Unique identifier for the rule */
  itemId: string;
  /** Type of item (typically 'rule') */
  itemType: string;
  /** Scope identifier for multi-tenant systems */
  scope: string;
  /** Version number for optimistic locking */
  version: number;
  /** Total number of times the rule has been executed */
  executionCount: number;
  /** Number of times executed on this node (in cluster) */
  localExecutionCount: number;
  /** Total time spent evaluating conditions (milliseconds) */
  conditionsTime: number;
  /** Time spent evaluating conditions on this node (milliseconds) */
  localConditionsTime: number;
  /** Total time spent executing actions (milliseconds) */
  actionsTime: number;
  /** Time spent executing actions on this node (milliseconds) */
  localActionsTime: number;
  /** Last synchronization date for cluster statistics */
  lastSyncDate?: string;
}

/**
 * Paginated list of rules.
 * Used for paginated API responses containing rule arrays.
 * Supports both offset-based and scroll-based pagination.
 */
export interface PartialListRule {
  /** Array of rules in this page */
  list: UnomiRule[];
  /** Offset/index of the first rule in this page */
  offset: number;
  /** Number of rules in this page */
  pageSize: number;
  /** Total number of rules across all pages */
  totalSize: number;
  /** Relationship indicator for total size (exact or minimum) */
  totalSizeRelation?: 'EQUAL' | 'GREATER_THAN_OR_EQUAL_TO';
  /** Scroll identifier for scroll-based pagination */
  scrollIdentifier?: string;
  /** Time validity for the scroll identifier */
  scrollTimeValidity?: string;
}

/**
 * Represents a Goal definition in Unomi.
 * Goals track conversion events and measure campaign effectiveness.
 */
export interface UnomiGoal {
  /** Unique identifier for the goal */
  itemId: string;
  /** Type of item (typically 'goal') */
  itemType: string;
  /** Scope identifier for multi-tenant systems */
  scope: string;
  /** Version number for optimistic locking */
  version: number;
  /** Metadata describing the goal */
  metadata: UnomiMetadata;
  /** Condition for goal start event */
  startEvent?: Condition;
  /** Condition for goal completion/target event */
  targetEvent?: Condition;
  /** Optional campaign ID this goal is associated with */
  campaignId?: string;
}

/**
 * Statistics for a goal report.
 */
export interface GoalStat {
  /** Key identifier for the statistic */
  key: string;
  /** Number of goal starts */
  startCount: number;
  /** Number of goal completions */
  targetCount: number;
  /** Conversion rate (targetCount / startCount) */
  conversionRate: number;
  /** Percentage value */
  percentage: number;
}

/**
 * Goal report containing statistics.
 */
export interface GoalReport {
  /** Global statistics for the goal */
  globalStats: GoalStat;
  /** Split statistics (by date, segment, etc.) */
  split: GoalStat[];
}

/**
 * Represents a Campaign definition in Unomi.
 * Campaigns track marketing campaigns and their effectiveness.
 */
export interface UnomiCampaign {
  /** Unique identifier for the campaign */
  itemId: string;
  /** Type of item (typically 'campaign') */
  itemType: string;
  /** Scope identifier for multi-tenant systems */
  scope: string;
  /** Version number for optimistic locking */
  version: number;
  /** Metadata describing the campaign */
  metadata: UnomiMetadata;
  /** Campaign start date (ISO date-time) */
  startDate?: string;
  /** Campaign end date (ISO date-time) */
  endDate?: string;
  /** Condition for campaign entry */
  entryCondition?: Condition;
  /** Campaign cost */
  cost?: number;
  /** Currency for the cost */
  currency?: string;
  /** Primary goal ID reference */
  primaryGoal?: string;
  /** Timezone for date calculations */
  timezone?: string;
}

/**
 * Campaign detail with statistics.
 */
export interface CampaignDetail extends UnomiCampaign {
  /** Number of engaged profiles */
  engagedProfiles: number;
  /** Number of campaign session views */
  campaignSessionViews: number;
  /** Number of successful campaign sessions */
  campaignSessionSuccess: number;
  /** Number of goals in the campaign */
  numberOfGoals: number;
  /** Conversion rate */
  conversionRate: number;
}

/**
 * Represents a Scoring definition in Unomi.
 * Scoring assigns points to profiles based on conditions.
 */
export interface UnomiScoring {
  /** Unique identifier for the scoring */
  itemId: string;
  /** Type of item (typically 'scoring') */
  itemType: string;
  /** Scope identifier for multi-tenant systems */
  scope: string;
  /** Version number for optimistic locking */
  version: number;
  /** Metadata describing the scoring */
  metadata: UnomiMetadata;
  /** Scoring elements (condition-value pairs) */
  elements: Array<{
    condition: Condition;
    value: number;
  }>;
}

/**
 * Represents a User List in Unomi.
 */
export interface UnomiUserList {
  /** Unique identifier for the list */
  itemId: string;
  /** Type of item (typically 'userList') */
  itemType: string;
  /** Scope identifier for multi-tenant systems */
  scope: string;
  /** Version number for optimistic locking */
  version: number;
  /** Metadata describing the list */
  metadata: UnomiMetadata;
}

/**
 * Represents a scope definition in Unomi.
 * Scopes provide multi-tenancy and data isolation capabilities.
 */
export interface UnomiScope {
  /** Unique identifier for the scope */
  itemId: string;
  /** Type of item (typically 'scope') */
  itemType: string;
  /** Scope identifier string */
  scope: string;
  /** Version number for optimistic locking */
  version: number;
  /** Optional metadata describing the scope */
  metadata?: {
    id?: string;
    name?: string;
    description?: string;
    scope?: string;
    tags?: string[];
    systemTags?: string[];
    enabled?: boolean;
    [key: string]: unknown;
  };
}

/**
 * Data structure for creating a new scope in Unomi.
 * Used when creating scope definitions via the API.
 */
export interface CreateScopeData {
  /** Unique identifier for the new scope */
  itemId: string;
  /** Type of item (must be 'scope') */
  itemType: 'scope';
  /** Optional metadata for the new scope */
  metadata?: {
    name?: string;
    description?: string;
    scope?: string;
    tags?: string[];
    enabled?: boolean;
  };
}

/**
 * Represents a JSON Schema definition for event validation.
 * Used to validate event structure and properties before processing.
 */
export interface JsonSchema {
  /** JSON Schema identifier */
  $id?: string;
  /** JSON Schema specification version */
  $schema?: string;
  /** Self-description metadata */
  self?: {
    vendor: string;
    target: string;
    name: string;
    format: string;
    version: string;
  };
  /** Human-readable title */
  title?: string;
  /** Schema type (e.g., 'object', 'array') */
  type?: string;
  /** Property definitions */
  properties?: Record<string, unknown>;
  /** List of required property names */
  required?: string[];
  /** Additional schema properties */
  [key: string]: unknown;
}

/**
 * Represents a validation error from JSON Schema validation.
 * Contains information about what failed validation and where.
 */
export interface ValidationError {
  /** Human-readable error message */
  message: string;
  /** JSON path to the property that failed validation */
  path: string;
  /** JSON path to the schema rule that failed */
  schemaPath: string;
}

/**
 * Represents a numeric range for property type categorization.
 * Used to define ranges for numeric properties (e.g., age groups).
 */
export interface NumericRange {
  /** Key identifier for the range */
  key: string;
  /** Optional minimum value (inclusive) */
  from?: number;
  /** Optional maximum value (inclusive) */
  to?: number;
}

/**
 * Represents a date range for property type categorization.
 * Used to define ranges for date properties.
 */
export interface DateRange {
  /** Key identifier for the range */
  key: string;
  /** Optional start date (ISO format) */
  from?: string;
  /** Optional end date (ISO format) */
  to?: string;
}

/**
 * Represents an IP range for property type categorization.
 * Used to define ranges for IP address properties.
 */
export interface IpRange {
  /** Key identifier for the range */
  key: string;
  /** Optional start IP address */
  from?: string;
  /** Optional end IP address */
  to?: string;
}

/**
 * Represents a child property type for nested/complex properties.
 * Used to define the structure of nested properties.
 */
export interface ChildPropertyType {
  /** Metadata for the child property type */
  metadata: {
    id: string;
    name: string;
    description?: string;
    scope?: string;
    tags?: string[];
    systemTags?: string[];
    enabled?: boolean;
    hidden?: boolean;
    readOnly?: boolean;
  };
  /** Value type identifier (e.g., "string", "integer", "date") */
  type: string;
  /** Default value */
  defaultValue?: string;
  /** Whether the property is multi-valued */
  multivalued?: boolean;
  /** Whether the property is protected (read-only) */
  protected?: boolean;
  /** Display rank for ordering */
  rank?: number;
  /** Optional child property types for nested structures */
  childPropertyTypes?: ChildPropertyType[];
}

/**
 * Represents a property type definition in Unomi.
 * Property types define the structure and metadata for properties used in profiles and sessions.
 */
export interface PropertyType {
  /** Metadata describing the property type */
  metadata: {
    id: string;
    name: string;
    description?: string;
    scope?: string;
    tags?: string[];
    systemTags?: string[];
    enabled?: boolean;
    hidden?: boolean;
    readOnly?: boolean;
  };
  /** Target type (e.g., "profiles", "sessions") */
  target?: string;
  /** Value type identifier (e.g., "string", "integer", "date", "boolean", "set") */
  type?: string;
  /** Alternative field name for value type */
  valueTypeId?: string;
  /** Default value for properties using this type */
  defaultValue?: string;
  /** Whether properties using this type are multi-valued */
  multivalued?: boolean;
  /** Whether properties with this type are protected (read-only) */
  protected?: boolean;
  /** Alternative field name for protected (Java uses "protekted") */
  protekted?: boolean;
  /** Display rank for ordering in UIs */
  rank?: number | string;
  /** Merge strategy identifier for profile merging */
  mergeStrategy?: string;
  /** Optional numeric ranges for categorization */
  numericRanges?: NumericRange[];
  /** Optional date ranges for categorization */
  dateRanges?: DateRange[];
  /** Optional IP ranges for categorization */
  ipRanges?: IpRange[];
  /** Set of property names for automatic mappings (legacy) */
  automaticMappingsFrom?: string[];
  /** Child property types for nested/complex properties */
  childPropertyTypes?: ChildPropertyType[];
}

/**
 * Response structure for property types grouped by target.
 */
export interface PropertyTypesByTarget {
  profiles?: PropertyType[];
  sessions?: PropertyType[];
}
