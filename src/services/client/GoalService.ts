import axios from 'axios';
import type { AggregateQuery } from '@/services/shared/types';
import type { GoalReport, UnomiGoal, UnomiMetadata } from './unomi-types';

export async function getAllGoals(): Promise<UnomiMetadata[]> {
  try {
    const response = await axios.get('/api/cxs/goals');
    return response.data || [];
  } catch (error) {
    console.error('Error fetching goals:', error);
    throw error;
  }
}

export async function getGoalDefinition(goalId: string): Promise<UnomiGoal> {
  try {
    const response = await axios.get(`/api/cxs/goals/${goalId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching goal definition:', error);
    throw error;
  }
}

export async function createGoal(goalData: Record<string, unknown>): Promise<UnomiGoal> {
  try {
    const response = await axios.post('/api/cxs/goals', goalData);
    return response.data;
  } catch (error) {
    console.error('Error creating goal:', error);
    throw error;
  }
}

export async function updateGoal(goalId: string, goalData: Record<string, unknown>): Promise<UnomiGoal> {
  try {
    const response = await axios.post('/api/cxs/goals', {
      ...goalData,
      itemId: goalId,
    });
    return response.data;
  } catch (error) {
    console.error('Error updating goal:', error);
    throw error;
  }
}

export async function deleteGoal(goalId: string): Promise<void> {
  try {
    await axios.delete(`/api/cxs/goals/${goalId}`);
  } catch (error) {
    console.error('Error deleting goal:', error);
    throw error;
  }
}

export async function getGoalReport(goalId: string, aggregateQuery?: AggregateQuery): Promise<GoalReport> {
  try {
    if (aggregateQuery) {
      const response = await axios.post(`/api/cxs/goals/${goalId}/report`, aggregateQuery);
      return response.data;
    } else {
      const response = await axios.get(`/api/cxs/goals/${goalId}/report`);
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching goal report:', error);
    throw error;
  }
}
