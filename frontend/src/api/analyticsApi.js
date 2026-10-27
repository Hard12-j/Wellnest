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

/**
 * Fetch real-time goal cards (Workouts, Water, Sleep) assigned by trainer or self.
 */
export const getGoalCards = async () => {
  const { data } = await analyticsClient.get('/api/analytics/goal-cards');
  return data; // GoalCardProgressResponse
};

// ── Client Analytics (Trainer Role) ──────────────────────────────────

/**
 * Fetch a specific client's weekly trends for the trainer.
 */
export const getClientWeeklyTrends = async (clientId, from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await analyticsClient.get(`/api/analytics/clients/${clientId}/weekly-trends`, { params });
  return data;
};

/**
 * Fetch a specific client's calories balance breakdown.
 */
export const getClientCaloriesBalance = async (clientId, from, to) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const { data } = await analyticsClient.get(`/api/analytics/clients/${clientId}/calories-balance`, { params });
  return data;
};

/**
 * Fetch a specific client's goal progress and weight tracker.
 */
export const getClientGoalProgress = async (clientId) => {
  const { data } = await analyticsClient.get(`/api/analytics/clients/${clientId}/goal-progress`);
  return data;
};

/**
 * Fetch smart insights and coaching alerts for a specific client.
 */
export const getClientInsights = async (clientId) => {
  const { data } = await analyticsClient.get(`/api/analytics/clients/${clientId}/insights`);
  return data;
};

/**
 * Fetch goal cards progress for a specific client.
 */
export const getClientGoalCards = async (clientId) => {
  const { data } = await analyticsClient.get(`/api/analytics/clients/${clientId}/goal-cards`);
  return data;
};

/**
 * Fetch assigned goals for a specific client.
 */
export const getClientGoals = async (clientId) => {
  const { data } = await analyticsClient.get(`/api/analytics/clients/${clientId}/goals`);
  return data;
};

/**
 * Trainer assigns custom target goals to a client.
 */
export const assignClientGoals = async (clientId, { workoutDaysPerWeek, waterLitresPerDay, sleepHoursPerNight, trainerName }) => {
  const payload = {
    workoutDaysPerWeek: Number(workoutDaysPerWeek),
    waterLitresPerDay: Number(waterLitresPerDay),
    sleepHoursPerNight: Number(sleepHoursPerNight),
    trainerName: trainerName || null,
  };
  const { data } = await analyticsClient.post(`/api/analytics/clients/${clientId}/goals`, payload);
  return data;
};
