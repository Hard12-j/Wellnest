import axios from 'axios';

const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8081';
const PROFILE_API_URL = import.meta.env.VITE_PROFILE_API_URL || 'http://localhost:8082';
const TRACKER_API_URL = import.meta.env.VITE_TRACKER_API_URL || 'http://localhost:8083';
const ANALYTICS_API_URL = import.meta.env.VITE_ANALYTICS_API_URL || 'http://localhost:8084';

// ── In-memory token & user ID store ──────────────────────────────────────────
let accessToken = null;
let currentUserId = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

export const setAuthUserId = (id) => {
  currentUserId = id ? Number(id) : null;
  if (id) {
    localStorage.setItem('wellnest_user_id', String(id));
  } else {
    localStorage.removeItem('wellnest_user_id');
  }
};

export const getAuthUserId = () => {
  if (currentUserId) return currentUserId;
  const stored = localStorage.getItem('wellnest_user_id');
  if (stored) {
    currentUserId = Number(stored);
    return currentUserId;
  }
  return null;
};

// ── Refresh state (prevents concurrent refresh calls) ──────────────
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
};

// Endpoints that should never trigger a token refresh
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/verify-email',
  '/auth/resend-verification',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/refresh',
];

const isPublicPath = (url) => PUBLIC_PATHS.some((path) => url?.includes(path));

/**
 * Configure request and response interceptors on an Axios instance.
 */
function setupInterceptors(client, isAuthService = false) {
  // Request interceptor: attach bearer token and X-User-Id
  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token && !isPublicPath(config.url)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const userId = getAuthUserId();
      if (userId) {
        config.headers['X-User-Id'] = userId;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor: refresh token on 401
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isPublicPath(originalRequest.url)
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return client(originalRequest);
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const { data } = await authClient.post('/auth/refresh');
          const newToken = data.accessToken;
          setAccessToken(newToken);
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearAccessToken();
          setAuthUserId(null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}

// ── Service Axios Instances ──────────────────────────────────────────

export const authClient = axios.create({
  baseURL: AUTH_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
setupInterceptors(authClient, true);

export const profileClient = axios.create({
  baseURL: PROFILE_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
setupInterceptors(profileClient);

export const trackerClient = axios.create({
  baseURL: TRACKER_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
setupInterceptors(trackerClient);

export const analyticsClient = axios.create({
  baseURL: ANALYTICS_API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
setupInterceptors(analyticsClient);

// Default export is authClient for backwards compatibility
export default authClient;
