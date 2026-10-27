import { trackerClient } from './axiosInstance';
import { extractErrorMessage } from './authApi';

export { extractErrorMessage };

// ── Daily Summary ──────────────────────────────────────────

export const getDailyLog = async (date) => {
  const params = date ? { date } : {};
  const { data } = await trackerClient.get('/api/tracker/daily', { params });
  return data; // DailyLogResponse: { date, workouts, meals, hydrationMl, sleep, sleepHours, caloriesBurned, caloriesConsumed, netCalories }
};

// ── Workouts ───────────────────────────────────────────────

export const listWorkouts = async ({ from, to, page = 0, size = 50 } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  params.page = page;
  params.size = size;
  const { data } = await trackerClient.get('/api/tracker/workouts', { params });
  return data; // PageResponse<WorkoutResponse> { content, page, size, totalElements, totalPages, last }
};

export const createWorkout = async ({ date, type, durationMin, intensity, caloriesBurned, notes }) => {
  const payload = {
    date,
    type,
    durationMin: Number(durationMin),
    intensity: intensity || null,
    caloriesBurned: caloriesBurned !== '' && caloriesBurned != null ? Number(caloriesBurned) : null,
    notes: notes || null,
  };
  const { data } = await trackerClient.post('/api/tracker/workouts', payload);
  return data;
};

export const updateWorkout = async (id, { date, type, durationMin, intensity, caloriesBurned, notes }) => {
  const payload = {
    date,
    type,
    durationMin: Number(durationMin),
    intensity: intensity || null,
    caloriesBurned: caloriesBurned !== '' && caloriesBurned != null ? Number(caloriesBurned) : null,
    notes: notes || null,
  };
  const { data } = await trackerClient.put(`/api/tracker/workouts/${id}`, payload);
  return data;
};

export const deleteWorkout = async (id) => {
  await trackerClient.delete(`/api/tracker/workouts/${id}`);
};

// ── Meals ──────────────────────────────────────────────────

export const listMeals = async ({ mealType, from, to, page = 0, size = 50 } = {}) => {
  const params = {};
  if (mealType) params.mealType = mealType;
  if (from) params.from = from;
  if (to) params.to = to;
  params.page = page;
  params.size = size;
  const { data } = await trackerClient.get('/api/tracker/meals', { params });
  return data;
};

export const createMeal = async ({ date, mealType, name, calories, proteinG, carbsG, fatG }) => {
  const payload = {
    date,
    mealType,
    name: name?.trim(),
    calories: Number(calories),
    proteinG: proteinG !== '' && proteinG != null ? Number(proteinG) : null,
    carbsG: carbsG !== '' && carbsG != null ? Number(carbsG) : null,
    fatG: fatG !== '' && fatG != null ? Number(fatG) : null,
  };
  const { data } = await trackerClient.post('/api/tracker/meals', payload);
  return data;
};

export const updateMeal = async (id, { date, mealType, name, calories, proteinG, carbsG, fatG }) => {
  const payload = {
    date,
    mealType,
    name: name?.trim(),
    calories: Number(calories),
    proteinG: proteinG !== '' && proteinG != null ? Number(proteinG) : null,
    carbsG: carbsG !== '' && carbsG != null ? Number(carbsG) : null,
    fatG: fatG !== '' && fatG != null ? Number(fatG) : null,
  };
  const { data } = await trackerClient.put(`/api/tracker/meals/${id}`, payload);
  return data;
};

export const deleteMeal = async (id) => {
  await trackerClient.delete(`/api/tracker/meals/${id}`);
};

// ── Hydration ──────────────────────────────────────────────

export const listHydration = async ({ from, to, page = 0, size = 50 } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  params.page = page;
  params.size = size;
  const { data } = await trackerClient.get('/api/tracker/hydration', { params });
  return data;
};

export const createHydration = async ({ date, amountMl }) => {
  const payload = {
    date,
    amountMl: Number(amountMl),
  };
  const { data } = await trackerClient.post('/api/tracker/hydration', payload);
  return data;
};

export const deleteHydration = async (id) => {
  await trackerClient.delete(`/api/tracker/hydration/${id}`);
};

// ── Sleep ──────────────────────────────────────────────────

export const listSleep = async ({ from, to, page = 0, size = 50 } = {}) => {
  const params = {};
  if (from) params.from = from;
  if (to) params.to = to;
  params.page = page;
  params.size = size;
  const { data } = await trackerClient.get('/api/tracker/sleep', { params });
  return data;
};

export const createSleep = async ({ date, hours, quality }) => {
  const payload = {
    date,
    hours: Number(hours),
    quality: quality ? Number(quality) : null,
  };
  const { data } = await trackerClient.post('/api/tracker/sleep', payload);
  return data;
};

export const updateSleep = async (id, { date, hours, quality }) => {
  const payload = {
    date,
    hours: Number(hours),
    quality: quality ? Number(quality) : null,
  };
  const { data } = await trackerClient.put(`/api/tracker/sleep/${id}`, payload);
  return data;
};

export const deleteSleep = async (id) => {
  await trackerClient.delete(`/api/tracker/sleep/${id}`);
};
