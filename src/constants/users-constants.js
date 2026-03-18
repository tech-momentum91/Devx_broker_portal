export const ROLE_KEYS = {
  SUPER_ADMIN: 'super_admin',
  HUB_MANAGER: 'hub_manager',
  FACILITY_MANAGER: 'facility_manager',
  CLIENT_ADMIN: 'client_admin',
  CLIENT_USER: 'client_user',
  VENDOR_ADMIN: 'vendor_admin',
  ADMIN: 'admin',
};

export const ROLE_KEYS_SETTINGS = {
  SUPER_ADMIN: 'Super Admin',
  HUB_MANAGER: 'Hub Manager',
  FACILITY_MANAGER: 'Facility Manager',
  CLIENT_ADMIN: 'Client Admin',
  CLIENT_USER: 'Client User',
  VENDOR_ADMIN: 'Vendor Admin',
  ADMIN: 'Admin',
};

// Normalize roles input to an array of normalized role keys
const normalizeRoles = (rolesInput) => {
  if (!rolesInput) return [];

  const rawRoles = Array.isArray(rolesInput)
    ? rolesInput
    : typeof rolesInput === 'object'
      ? Object.keys(rolesInput)
      : [rolesInput];

  return rawRoles
    .filter(Boolean)
    .map((role) => role.toString().trim().toLowerCase().replaceAll(/\s+/g, '_'));
};

// Accepts an array of role identifiers, a single role string, or a role map object
// and returns true when the user is a client (admin/user).
export const isClient = (rolesInput) => {
  const normalizedRoles = normalizeRoles(rolesInput);

  return (
    normalizedRoles.includes(ROLE_KEYS.CLIENT_USER) ||
    normalizedRoles.includes(ROLE_KEYS.CLIENT_ADMIN)
  );
};

export const isClientAdmin = (rolesInput) => {
  const normalizedRoles = normalizeRoles(rolesInput);
  return normalizedRoles.includes(ROLE_KEYS.CLIENT_ADMIN);
};

export const isClientUser = (rolesInput) => {
  const normalizedRoles = normalizeRoles(rolesInput);
  return normalizedRoles.includes(ROLE_KEYS.CLIENT_USER);
};

// Returns true when the user is a Facility Manager
export const isFacilityManager = (rolesInput) => {
  const normalizedRoles = normalizeRoles(rolesInput);
  return normalizedRoles.includes(ROLE_KEYS.FACILITY_MANAGER);
};

export const USER_ROLES = [
  'Hub Manager',
  'Facility Manager',
  'Client User',
  'Vendor Admin',
  'Admin',
  'Client Admin',
  'Super Admin',
];

export const EDIT_USER_ROLES = [
  'Hub Manager',
  'Facility Manager',
  'Client User',
  'Vendor',
  'Admin',
  'Client Admin',
  'Super Admin',
];
