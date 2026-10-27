import axios from 'axios';

// ── Single Gateway URL ─────────────────────────────────────────────────────────
// All traffic goes through the API gateway (port 8080).
// When running locally with Vite, the dev proxy forwards requests to the gateway
// so GATEWAY_URL can be left empty to use relative paths.
const GATEWAY_URL = import.meta.env.VITE_GATEWAY_URL || '';

// WebSocket base URL used by ChatContext.jsx
export const CHAT_WS_URL = (() => {
  if (import.meta.env.VITE_GATEWAY_WS_URL) return import.meta.env.VITE_GATEWAY_WS_URL;
  // Derive from GATEWAY_URL if available, otherwise use current host (Vite proxy handles it)
  if (GATEWAY_URL) return GATEWAY_URL.replace(/^http/, 'ws') + '/ws';
  return ''; // empty = relative ws:// via Vite proxy
})();

// ── In-memory token & user ID/Role store ──────────────────────────────────────────
let accessToken = null;
let currentUserId = null;
let currentUserRole = null;

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

export const setAuthUserRole = (role) => {
  currentUserRole = role || null;
  if (role) {
    localStorage.setItem('wellnest_user_role', String(role));
  } else {
    localStorage.removeItem('wellnest_user_role');
  }
};

export const getAuthUserRole = () => {
  if (currentUserRole) return currentUserRole;
  const stored = localStorage.getItem('wellnest_user_role');
  if (stored) {
    currentUserRole = stored;
    return currentUserRole;
  }
  return null;
};

// ── Refresh state (prevents concurrent refresh calls) ──────────────
let isRefreshing = false;
let failedQueue = [];
let refreshInFlightPromise = null;

/**
 * Deduplicated token refresher. If a refresh is already in flight, returns
 * the existing promise to prevent token rotation race conditions (e.g. React StrictMode).
 */
export const requestRefreshToken = () => {
  if (refreshInFlightPromise) {
    return refreshInFlightPromise;
  }

  refreshInFlightPromise = gatewayClient
    .post('/auth/refresh')
    .then((res) => {
      const newToken = res.data?.accessToken;
      if (newToken) {
        setAccessToken(newToken);
      }
      return res.data;
    })
    .finally(() => {
      // 1.5s window protects against duplicate calls from StrictMode or rapid 401s
      setTimeout(() => {
        refreshInFlightPromise = null;
      }, 1500);
    });

  return refreshInFlightPromise;
};

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
 * @param {import('axios').AxiosInstance} client
 * @param {boolean} isAuthService - if true, don't add X-User-Id/X-User-Role headers
 */
function setupInterceptors(client, isAuthService = false) {
  // Request interceptor: attach bearer token
  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token && !isPublicPath(config.url)) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      // The gateway will add X-User-Id and X-User-Role from the JWT.
      // We still send them for Vite dev proxy / direct fallback compatibility.
      if (!isAuthService) {
        const userId = getAuthUserId();
        if (userId) {
          config.headers['X-User-Id'] = userId;
        }
        const role = getAuthUserRole();
        if (role) {
          config.headers['X-UserRole'] = role;
          config.headers['X-User-Role'] = role;
        }
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
          const data = await requestRefreshToken();
          const newToken = data.accessToken;
          processQueue(null, newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          clearAccessToken();
          setAuthUserId(null);
          setAuthUserRole(null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}

// ── Single unified Axios instance pointing at the gateway ──────────────────────
// All service clients are now aliases of the same gatewayClient.
// The path prefix (e.g. /api/profile, /api/tracker) determines routing at the gateway.

export const gatewayClient = axios.create({
  baseURL: GATEWAY_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // required for refresh token cookie
});
setupInterceptors(gatewayClient, false);

// Auth client: same gateway, but doesn't add X-User-Id to avoid circular issues
export const authClient = axios.create({
  baseURL: GATEWAY_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});
setupInterceptors(authClient, true);

// All other service clients are the same gateway client — they differ only by URL prefix
export const profileClient = gatewayClient;
export const trackerClient = gatewayClient;
export const analyticsClient = gatewayClient;
export const trainerClient = gatewayClient;
export const chatClient = gatewayClient;

// Content client – same gateway, may send multipart
export const contentClient = axios.create({
  baseURL: GATEWAY_URL,
  withCredentials: true,
});
setupInterceptors(contentClient, false);

// Keep CONTENT_API_URL as an export for any files that reference it
export const CONTENT_API_URL = GATEWAY_URL;

// Default export is authClient for backwards compatibility
export default authClient;
