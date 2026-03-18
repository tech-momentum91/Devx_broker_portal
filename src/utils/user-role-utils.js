/**
 * Gets the user role object from userSideBarPerm data
 * @param {Object} userSideBarPerm - The userSideBarPerm object from Redux state
 * @returns {Object|null} - The role object for the first role key, or null if not found
 *
 * @example
 * // Usage in a component:
 * const { userSideBarPerm } = useSelector((state) => state.auth);
 * const userRole = getUserRole(userSideBarPerm);
 *
 * // Then access permissions:
 * if (userRole?.User) { ... }
 * if (userRole?.Company) { ... }
 */
export const getUserRole = (userSideBarPerm) => {
  if (!userSideBarPerm?.data?.message?.role) return null;

  const roleKeys = Object.keys(userSideBarPerm.data.message.role);
  if (roleKeys.length === 0) return null;

  // Get the first role key and return its value
  const firstRoleKey = roleKeys[0];
  return userSideBarPerm.data.message.role[firstRoleKey];
};

/**
 * Gets the role key (e.g., "Super Admin") from userSideBarPerm data
 * @param {Object} userSideBarPerm - The userSideBarPerm object from Redux state
 * @returns {string|null} - The first role key, or null if not found
 *
 * @example
 * const { userSideBarPerm } = useSelector((state) => state.auth);
 * const roleKey = getUserRoleKey(userSideBarPerm);
 * // roleKey will be "Super Admin" or whatever the first role is
 */
export const getUserRoleKey = (userSideBarPerm) => {
  if (!userSideBarPerm?.data?.message?.role) return null;

  const roleKeys = Object.keys(userSideBarPerm.data.message.role);
  return roleKeys.length > 0 ? roleKeys[0] : null;
};

/**
 * Gets the module permissions for a specific module from userSideBarPerm data
 * @param {Object} userSideBarPerm - The userSideBarPerm object from Redux state
 * @param {string} moduleName - The name of the module (e.g., "HD Ticket", "Center", "Space")
 * @returns {Object|null} - The module permissions object with read, write, delete, create, export, import, or null if not found
 *
 * @example
 * const { userSideBarPerm } = useSelector((state) => state.auth);
 * const ticketPermissions = getModulePermissions(userSideBarPerm, "HD Ticket");
 * // ticketPermissions will be { read: true, write: true, delete: false, create: true, export: true, import: false }
 */
export const getModulePermissions = (userSideBarPerm, moduleName) => {
  if (!userSideBarPerm?.data?.message?.role || !moduleName) return null;

  const roleKeys = Object.keys(userSideBarPerm.data.message.role);
  if (roleKeys.length === 0) return null;

  // Get the first role (primary role)
  const firstRoleKey = roleKeys[0];

  // console.log('firstRoleKey', firstRoleKey);
  // console.log('userSideBarPerm.data.message.role', userSideBarPerm.data.message.role);
  const role = userSideBarPerm.data.message.role[firstRoleKey];

  // Check if the module exists in this role
  if (!role || !role[moduleName]) return null;

  return role[moduleName];
};

export const getRole = (userSideBarPerm) => {
  if (!userSideBarPerm?.data?.message?.role) return null;

  const roleKeys = Object.keys(userSideBarPerm.data.message.role);

  return roleKeys[0];
};

/**
 * Checks if a specific permission is allowed for a module
 * @param {Object} userSideBarPerm - The userSideBarPerm object from Redux state
 * @param {string} moduleName - The name of the module (e.g., "HD Ticket", "Center", "Space")
 * @param {string} permission - The permission to check (e.g., "read", "write", "delete", "create", "export", "import")
 * @returns {boolean} - true if the permission is allowed, false otherwise
 *
 * @example
 * const { userSideBarPerm } = useSelector((state) => state.auth);
 * const canCreate = hasModulePermission(userSideBarPerm, "HD Ticket", "create");
 * const canDelete = hasModulePermission(userSideBarPerm, "HD Ticket", "delete");
 */
export const hasModulePermission = (userSideBarPerm, moduleName, permission) => {
  const modulePermissions = getModulePermissions(userSideBarPerm, moduleName);
  if (!modulePermissions) return false;

  return modulePermissions[permission] === true;
};
