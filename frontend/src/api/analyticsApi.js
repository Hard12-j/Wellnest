import { analyticsClient } from './axiosInstance';
import { extractErrorMessage } from './authApi';

export { extractErrorMessage };

/**
 * Fetch weekly trends with daily stats (workouts, calories, water, sleep).
 */
export const getWeeklyTrends = async (from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await analyticsClient.get('/api/analytics/weekly-trends', { params });
  return data; // WeeklyTrendsResponse
};

/**
 * Fetch calorie balance breakdown for a date range.
 */
export const getCaloriesBalance = async (from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await analyticsClient.get('/api/analytics/calories-balance', { params });
  return data; // CaloriesBalanceResponse
};

/**
 * Fetch goal progress, streak days, and weight targets.
 */
export const getGoalProgress = async () => {
  const { data } = await analyticsClient.get('/api/analytics/goal-progress');
  return data; // GoalProgressResponse
};

/**
 * Fetch smart rule-based wellness insights and alerts.
 */
export const getInsights = async () => {
  const { data } = await analyticsClient.get('/api/analytics/insights');
  return data; // InsightsResponse
};
