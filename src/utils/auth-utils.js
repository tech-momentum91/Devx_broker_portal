/**
 * Utility functions for handling authentication errors and session management
 */

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

/**
 * Clears all authentication data from localStorage
 */
export const clearAuthData = () => {
  localStorage.removeItem('email');
  localStorage.removeItem('user');
  localStorage.removeItem('authToken');
};

/**
 * Redirects user to login page
 * Prevents redirect if already on a public route to avoid infinite loops
 */
export const redirectToLogin = () => {
  const currentPath = window.location.pathname;
  // Don't redirect if already on a public route to prevent infinite loops
  if (isPublicRoutePath(currentPath)) {
    return;
  }
  // Use window.location.href for a full page reload to reset all state
  window.location.href = '/login';
};

/**
 * Handles authentication errors (401, 403) by clearing data and redirecting
 * @param {Object} error - The error object from axios
 */
export const handleAuthError = (error) => {
  const status = error.response?.status;

  if (status === 401 || status === 403) {
    console.log('Authentication failed. Session may have expired.');
    clearAuthData();
    redirectToLogin();
    return true; // Indicates that the error was handled
  }

  return false; // Error was not handled
};

/**
 * Checks if an error is an authentication error
 * @param {Object} error - The error object from axios
 * @returns {boolean} - True if it's an auth error
 */
export const isAuthError = (error) => {
  const status = error.response?.status;
  return status === 401 || status === 403;
};
