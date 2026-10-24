import api, { setAccessToken, clearAccessToken } from './axiosInstance';

/**
 * Extracts a user-friendly error message from an Axios error.
 */
export const extractErrorMessage = (error) => {
  if (!error.response) {
    return 'Unable to connect to the server. Please check your connection.';
  }

  const { data, status } = error.response;

  // Backend ApiError format: { status, message, errors, timestamp }
  if (data?.message) {
    return data.message;
  }

  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Authentication failed. Please log in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 409:
      return 'A conflict occurred. The resource may already exist.';
    case 429:
      return 'Too many requests. Please wait and try again.';
    case 500:
      return 'An internal server error occurred. Please try again later.';
    default:
      return 'An unexpected error occurred.';
  }
};

/**
 * Extracts field-level validation errors from the backend ApiError.errors map.
 */
export const extractFieldErrors = (error) => {
  if (error.response?.data?.errors) {
    return error.response.data.errors;
  }
  return null;
};

// ── Auth API Functions ─────────────────────────────────────────────

export const register = async ({ first, last, username, password, confirmPassword, role = 'USER' }) => {
  const { data } = await api.post('/auth/register', {
    first,
    last,
    username,
    password,
    confirmPassword,
    role,
  });
  return data; // MessageResponse { message }
};

export const login = async ({ username, password }) => {
  const { data } = await api.post('/auth/login', { username, password });
  // Store token in memory
  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }
  return data; // AuthResponse { accessToken, tokenType, expiresIn, user }
};

export const verifyEmail = async ({ username, otp }) => {
  const { data } = await api.post('/auth/verify-email', { username, otp });
  return data; // MessageResponse { message }
};

export const resendVerification = async ({ username }) => {
  const { data } = await api.post('/auth/resend-verification', { username });
  return data; // MessageResponse { message }
};

export const forgotPassword = async ({ username }) => {
  const { data } = await api.post('/auth/forgot-password', { username });
  return data; // MessageResponse { message }
};

export const resetPassword = async ({ username, otp, newPassword }) => {
  const { data } = await api.post('/auth/reset-password', { username, otp, newPassword });
  return data; // MessageResponse { message }
};

export const refreshToken = async () => {
  const { data } = await api.post('/auth/refresh');
  if (data.accessToken) {
    setAccessToken(data.accessToken);
  }
  return data; // AuthResponse { accessToken, tokenType, expiresIn, user }
};

export const getCurrentUser = async () => {
  const { data } = await api.get('/auth/me');
  return data; // UserResponse { id, first, last, username, role, verifiedUser }
};

export const logout = async () => {
  try {
    await api.post('/auth/logout');
  } finally {
    clearAccessToken();
  }
};
