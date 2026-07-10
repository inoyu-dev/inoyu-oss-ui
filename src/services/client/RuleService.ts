import axios from 'axios';
import type { UnomiMetadata, UnomiRule, UnomiRuleStatistics } from './unomi-types';

export async function getAllRules(): Promise<UnomiMetadata[]> {
  try {
    const response = await axios.get('/api/cxs/rules');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching rules:', error);
    throw error;
  }
}

export async function createRule(ruleData: Record<string, unknown>): Promise<UnomiRule> {
  try {
    const response = await axios.post('/api/cxs/rules', ruleData);
    return response.data;
  } catch (error) {
    console.error('Error creating rule:', error);
    throw error;
  }
}

export async function updateRule(ruleId: string, ruleData: Record<string, unknown>): Promise<UnomiRule> {
  try {
    const response = await axios.put(`/api/cxs/rules/${ruleId}`, ruleData);
    return response.data;
  } catch (error) {
    console.error('Error updating rule:', error);
    throw error;
  }
}

export async function getRuleDefinition(ruleId: string): Promise<UnomiRule> {
  try {
    const response = await axios.get(`/api/cxs/rules/${ruleId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rule definition:', error);
    throw error;
  }
}

export async function getRuleStatistics(ruleId: string): Promise<UnomiRuleStatistics> {
  try {
    const response = await axios.get(`/api/cxs/rules/${ruleId}/statistics`);
    return response.data;
  } catch (error) {
    console.error('Error fetching rule statistics:', error);
    throw error;
  }
}

export async function getAllRuleStatistics(): Promise<Record<string, UnomiRuleStatistics>> {
  try {
    const response = await axios.get('/api/cxs/rules/statistics');
    return response.data || {};
  } catch (error) {
    console.error('Error fetching all rule statistics:', error);
    throw error;
  }
}

export async function deleteRule(ruleId: string): Promise<void> {
  try {
    await axios.delete(`/api/cxs/rules/${ruleId}`);
  } catch (error) {
    console.error('Error deleting rule:', error);
    throw error;
  }
}

export async function resetAllRuleStatistics(): Promise<void> {
  try {
    await axios.delete('/api/cxs/rules/statistics');
  } catch (error) {
    console.error('Error resetting rule statistics:', error);
    throw error;
  }
}
