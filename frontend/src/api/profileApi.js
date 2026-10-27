import { profileClient } from './axiosInstance';
import { extractErrorMessage } from './authApi';

export { extractErrorMessage };

/**
 * Fetch current user's fitness profile.
 * Creates an empty profile row if none exists yet.
 */
export const getProfile = async () => {
  const { data } = await profileClient.get('/api/profile/me');
  return data; // ProfileResponse: { userId, age, heightCm, weightKg, targetWeightKg, fitnessGoal, hasAvatar, updatedAt }
};

/**
 * Update current user's profile data.
 */
export const updateProfile = async ({ age, heightCm, weightKg, targetWeightKg, fitnessGoal }) => {
  const payload = {
    age: age ? Number(age) : null,
    heightCm: heightCm ? Number(heightCm) : null,
    weightKg: weightKg ? Number(weightKg) : null,
    targetWeightKg: targetWeightKg ? Number(targetWeightKg) : null,
    fitnessGoal: fitnessGoal || null,
  };
  const { data } = await profileClient.put('/api/profile/me', payload);
  return data;
};

/**
 * Fetch current BMI evaluation and guidance.
 */
export const getBmi = async () => {
  const { data } = await profileClient.get('/api/profile/bmi');
  return data; // BmiResponse: { bmi, category, guidance, kgToTarget }
};

/**
 * Upload avatar image.
 */
export const uploadAvatar = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  await profileClient.put('/api/profile/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

/**
 * Download avatar blob as object URL.
 */
export const fetchAvatarBlobUrl = async () => {
  try {
    const response = await profileClient.get('/api/profile/me/avatar', {
      responseType: 'blob',
    });
    return URL.createObjectURL(response.data);
  } catch {
    return null;
  }
};
