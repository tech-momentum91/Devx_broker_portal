/**
 * Same rules as `isSessionExpired403Error` in `@/utils/auth-utils`, for a plain text
 * message (e.g. serialized Redux reject payload). Keeps parity with devx_frontend session detection.
 */
function isSessionExpired403MessageText(text) {
  if (typeof text !== 'string' || !text.trim()) return false;
  const lower = text.toLowerCase();
  const hasLoginToAccess = lower.includes('login to access');
  const hasNotWhitelisted = lower.includes('not whitelisted');
  const isPermissionErrorType = lower.includes('permissionerror');
  return hasLoginToAccess && (hasNotWhitelisted || isPermissionErrorType);
}

/**
 * Normalize a rejected RTK async thunk action to a string for `error` state.
 * @param {*} action
 * @param {string} [fallback]
 * @returns {string}
 */
export function rejectedErrorMessage(action, fallback = 'Failed to load') {
  const raw = action.payload ?? action.error?.message ?? fallback;
  if (typeof raw === 'string') {
    return raw.trim() ? raw : fallback;
  }
  if (raw && typeof raw === 'object') {
    const m = raw.message ?? raw.exc ?? raw.exception;
    if (typeof m === 'string' && m.trim()) return m;
    try {
      return JSON.stringify(raw);
    } catch {
      return fallback;
    }
  }
  return String(raw ?? fallback);
}

/**
 * After a failed list/summary fetch: whether to clear cached data.
 * Session-shaped errors keep prior data so the UI is not wiped before redirect/login.
 *
 * @param {*} action
 * @param {string} [fallback]
 * @returns {{ message: string, clearCachedData: boolean }}
 */
export function parseAsyncListReject(action, fallback = 'Failed to load') {
  const message = rejectedErrorMessage(action, fallback);
  return {
    message,
    clearCachedData: !isSessionExpired403MessageText(message),
  };
}
