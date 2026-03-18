/**
 * Broker Portal: only users with the Broker role are allowed.
 * Role name must match the backend (e.g. devx cp_contact BROKER_ROLE).
 */
export const BROKER_ROLE = 'Broker';

/**
 * @param {object} userDoc - User doc or API response (may have .data)
 * @returns {boolean}
 */
export function hasBrokerRole(userDoc) {
  const data = userDoc?.data ?? userDoc ?? {};
  const userRole = data.user_role;
  if (userRole === BROKER_ROLE) return true;
  const roles = data.roles || [];
  return roles.some((r) => (typeof r === 'string' ? r : r?.role) === BROKER_ROLE);
}
