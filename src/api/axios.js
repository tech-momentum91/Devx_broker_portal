import axios from 'axios';
import { handleAuthError } from '../utils/auth-utils';
import { serializeError } from '../utils/error-utils';

// Create axios instance with default configuration
const apiUrl = import.meta.env.VITE_API_URL;
const apiClient = axios.create({
  baseURL: `${apiUrl}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

if (!import.meta.env.VITE_API_URL) {
  console.warn('VITE_API_URL is not set.');
}

// Request interceptor - add auth token to requests
apiClient.interceptors.request.use(
  async (config) => {
    // Don't set Content-Type for FormData - let axios/browser set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Public routes that should be accessible without authentication
const PUBLIC_ROUTES = [
  '/login',
  '/reset-password',
  '/update-password',
  '/password-success',
  '/email-sent',
  '/public/csi',
];

const isPublicRoutePath = (path) =>
  PUBLIC_ROUTES.some((route) => path === route || path.startsWith(`${route}/`));

// Response interceptor - handle common errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Serialize error for Redux compatibility
    // Attach serialized version to error object so thunks can use it
    const serialized = serializeError(error);
    error.serialized = serialized;

    // Handle 500 errors
    if (error.response?.status === 500) {
      console.error('500 error detected:', error);
      if (window.__handle500Error) {
        window.__handle500Error();
      }
      return Promise.reject(error);
    }

    // Handle authentication errors selectively
    const status = error.response?.status;
    const isLoginEndpoint = error.config?.url?.includes('/method/login');
    const isSessionCheck = error.config?.url?.includes('/method/frappe.auth.get_logged_user');
    const currentPath = window.location.pathname;
    const isPublicRoute = isPublicRoutePath(currentPath);

    // Handle 403 for session check endpoint - redirect to login
    if (status === 403 && isSessionCheck) {
      // Only redirect if not already on a public route to prevent infinite loops
      if (!isPublicRoute && handleAuthError(error)) {
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }

    // Handle 403 for other endpoints (not session check) - just reject, no redirect
    if (status === 403 && !isSessionCheck) {
      // Don't redirect for permission errors on other APIs
      return Promise.reject(error);
    }

    // Keep 401 handling for non-login endpoints
    if (status === 401 && !isLoginEndpoint && !isSessionCheck) {
      // Only redirect if not already on a public route to prevent infinite loops
      if (!isPublicRoute && handleAuthError(error)) {
        return Promise.reject(error);
      }
      return Promise.reject(error);
    }

    // For other errors, just reject normally
    return Promise.reject(error);
  },
);

export default apiClient;
