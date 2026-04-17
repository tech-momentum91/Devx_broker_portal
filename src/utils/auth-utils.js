/**
 * Utility functions for handling authentication errors and session management
 */

export const SESSION_EXPIRED_TOAST_KEY = 'session_expired_toast';
export const POST_LOGIN_REDIRECT_KEY = 'post_login_redirect';

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

const isValidInternalRedirectPath = (path) => {
  if (typeof path !== 'string' || !path.startsWith('/')) return false;
  if (path.startsWith('//')) return false;
  return !isPublicRoutePath(path);
};

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
  const fullCurrentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (isValidInternalRedirectPath(fullCurrentPath)) {
    sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, fullCurrentPath);
  }
  sessionStorage.setItem(SESSION_EXPIRED_TOAST_KEY, '1');
  // Use window.location.href for a full page reload to reset all state
  window.location.href = '/login';
};

/**
 * Returns and clears post-login redirect path if valid.
 * @returns {string|null}
 */
export const popPostLoginRedirectPath = () => {
  const redirectPath = sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY);
  sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
  if (!isValidInternalRedirectPath(redirectPath)) return null;
  return redirectPath;
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
 * Detects whether a 403 response is actually an expired/unauthenticated session
 * from Frappe, not a regular permission-denied scenario.
 * @param {Object} error - The error object from axios
 * @returns {boolean}
 */
export const isSessionExpired403Error = (error) => {
  if (error.response?.status !== 403) return false;

  const data = error.response?.data || {};
  const messageSources = [
    data.exception,
    data.exc_type,
    data._server_messages,
    data.message,
    error.message,
  ]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());

  const hasLoginToAccess = messageSources.some((text) => text.includes('login to access'));
  const hasNotWhitelisted = messageSources.some((text) => text.includes('not whitelisted'));
  const isPermissionErrorType = messageSources.some((text) => text.includes('permissionerror'));

  // Session timeout shape from backend:
  // "PermissionError ... Login to access ... is not whitelisted"
  return hasLoginToAccess && (hasNotWhitelisted || isPermissionErrorType);
};

/**
 * Checks if an error is an authentication error
 * @param {Object} error - The error object from axios
 * @returns {boolean} - True if it's an auth error
 */
export const isAuthError = (error) => {
  const status = error.response?.status;
  return status === 401 || isSessionExpired403Error(error);
};
