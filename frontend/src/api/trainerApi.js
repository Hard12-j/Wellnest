import { trainerClient } from './axiosInstance';
import { extractErrorMessage } from './authApi';

export { extractErrorMessage };

/**
 * Fetch current trainer's own profile.
 */
export const getTrainerProfile = async () => {
  const { data } = await trainerClient.get('/api/trainers/me');
  return data; // TrainerProfileResponse: { userId, first, last, specialization, location, experienceYears, contactNo, availability, verified, requestStatus }
};

/**
 * Upsert current trainer's profile.
 */
export const updateTrainerProfile = async ({
  first,
  last,
  specialization,
  location,
  experienceYears,
  contactNo,
  availability,
}) => {
  const payload = {
    first,
    last,
    specialization,
    location: location || null,
    experienceYears: experienceYears !== '' && experienceYears !== null && experienceYears !== undefined ? Number(experienceYears) : null,
    contactNo: contactNo || null,
    availability: availability || null,
  };
  const { data } = await trainerClient.put('/api/trainers/me', payload);
  return data;
};

/**
 * Fetch all active clients for the current trainer.
 */
export const getClients = async () => {
  const { data } = await trainerClient.get('/api/trainers/me/clients');
  return data; // List<ClientResponse>: [{ userId, fitnessGoal, since }]
};

/**
 * Fetch pending client booking requests for the current trainer.
 */
export const getPendingRequests = async () => {
  const { data } = await trainerClient.get('/api/trainers/requests/pending');
  return data; // List<RequestResponse>: [{ id, userId, trainerId, status, userGoal, createdAt, respondedAt }]
};

/**
 * Accept a client's booking request.
 */
export const acceptRequest = async (requestId) => {
  const { data } = await trainerClient.put(`/api/trainers/requests/${requestId}/accept`);
  return data;
};

/**
 * Reject a client's booking request.
 */
export const rejectRequest = async (requestId) => {
  const { data } = await trainerClient.put(`/api/trainers/requests/${requestId}/reject`);
  return data;
};

/**
 * Assign a new workout or nutrition plan to a client.
 */
export const assignPlan = async ({ userId, title, details }) => {
  const payload = {
    userId: Number(userId),
    title: title.trim(),
    details: details.trim(),
  };
  const { data } = await trainerClient.post('/api/trainers/plans', payload);
  return data;
};

/**
 * Fetch all plans assigned by the current trainer.
 */
export const getGivenPlans = async () => {
  const { data } = await trainerClient.get('/api/trainers/plans/given');
  return data; // List<PlanResponse>: [{ id, trainerId, userId, title, details, createdAt }]
};

// ── Client / User Endpoints ──────────────────────────────────────────

/**
 * Fetch recommended trainers tailored to the current user's fitness goal.
 */
export const getRecommendedTrainers = async () => {
  const { data } = await trainerClient.get('/api/trainers/recommended');
  return data; // List<TrainerProfileResponse>
};

/**
 * Search trainers with query, specialization, location, and pagination.
 */
export const searchTrainers = async ({ q, specialization, location, page = 0, size = 10 } = {}) => {
  const params = {};
  if (q && q.trim()) params.q = q.trim();
  if (specialization && specialization.trim() && specialization !== 'ALL') {
    params.specialization = specialization.trim();
  }
  if (location && location.trim()) params.location = location.trim();
  params.page = page;
  params.size = size;

  const { data } = await trainerClient.get('/api/trainers/search', { params });
  return data; // PageResponse<TrainerProfileResponse>: { content, page, size, totalElements, totalPages }
};

/**
 * Fetch details of a specific trainer by their ID.
 */
export const getTrainerById = async (trainerId) => {
  const { data } = await trainerClient.get(`/api/trainers/${trainerId}`);
  return data; // TrainerProfileResponse
};

/**
 * Send a booking request to a trainer.
 */
export const sendTrainerRequest = async (trainerId) => {
  const { data } = await trainerClient.post('/api/trainers/requests', {
    trainerId: Number(trainerId),
  });
  return data; // RequestResponse
};

/**
 * Fetch user's own trainer booking requests.
 */
export const getMyRequests = async () => {
  const { data } = await trainerClient.get('/api/trainers/requests/mine');
  return data; // List<RequestResponse>
};

/**
 * Fetch workout / nutrition plans assigned to current user by their trainer.
 */
export const getMyPlans = async () => {
  const { data } = await trainerClient.get('/api/trainers/plans/mine');
  return data; // List<PlanResponse>
};

