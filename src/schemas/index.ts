/**
 * Unomi JSON Schemas for Monaco Editor validation.
 *
 * These schemas provide autocomplete and validation hints
 * when editing JSON in the Monaco-based JsonEditor component.
 *
 * Entity schemas (rule, segment, goal, campaign) use `$ref` to
 * the shared metadata and condition/action schemas — eliminating
 * the previous copy-paste duplication.
 */

import metadataSchema from './unomi-metadata.schema.json';
import conditionSchema from './unomi-condition.schema.json';
import actionSchema from './unomi-action.schema.json';
import ruleSchema from './unomi-rule.schema.json';
import segmentSchema from './unomi-segment.schema.json';
import goalSchema from './unomi-goal.schema.json';
import campaignSchema from './unomi-campaign.schema.json';

export const UNOMI_METADATA_SCHEMA = metadataSchema as Record<string, unknown>;
export const UNOMI_CONDITION_SCHEMA = conditionSchema as Record<string, unknown>;
export const UNOMI_ACTION_SCHEMA = actionSchema as Record<string, unknown>;
export const UNOMI_RULE_SCHEMA = ruleSchema as Record<string, unknown>;
export const UNOMI_SEGMENT_SCHEMA = segmentSchema as Record<string, unknown>;
export const UNOMI_GOAL_SCHEMA = goalSchema as Record<string, unknown>;
export const UNOMI_CAMPAIGN_SCHEMA = campaignSchema as Record<string, unknown>;
