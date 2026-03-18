/**
 * Task-related utility functions
 */

/**
 * Get priority badge color variant
 */
export const getPriorityVariant = (priority) => {
  const priorityMap = {
    LOW: 'green',
    MEDIUM: 'yellow',
    HIGH: 'red',
  };
  return priorityMap[priority] || 'gray';
};

/**
 * Get status badge color variant
 */
export const getStatusVariant = (status) => {
  const statusMap = {
    ACTIVE: 'green',
    INACTIVE: 'gray',
    Active: 'green',
    Inactive: 'gray',
  };
  return statusMap[status] || 'gray';
};

/**
 * Check if file is an image
 */

export const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.at(-1).toUpperCase() : '';
};

export const isImageFile = (file) => {
  if (!file) return false;

  // For new uploads, check file.type
  if (file.type && file.type.startsWith('image/')) return true;

  // For existing files, check file extension
  if (file.name) {
    const extension = getFileExtension(file.name).toLowerCase();
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(extension);
  }

  return false;
};

/**
 * Get file extension from filename
 */

/**
 * Get preview URL for file
 */
export const getPreviewUrl = (file) => {
  // For existing files from API
  if (file.isExisting && file.file_url) {
    return file.file_url;
  }
  // For new file uploads
  if (file.file && file.file instanceof File) {
    return URL.createObjectURL(file.file);
  }
  return null;
};

/**
 * Map frequency values to API format
 */
export const mapFrequencyToAPI = (frequency) => {
  const frequencyMap = {
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    'half-yearly': 'Half-Yearly',
    yearly: 'Yearly',
  };
  return frequencyMap[frequency] || frequency;
};

/**
 * Map frequency values from API format
 */
export const mapFrequencyFromAPI = (frequency) => {
  const frequencyMap = {
    Weekly: 'weekly',
    Monthly: 'monthly',
    Quarterly: 'quarterly',
    'Half-Yearly': 'half-yearly',
    Yearly: 'yearly',
  };
  return frequencyMap[frequency] || frequency;
};

/**
 * Parse assignees to array format
 */
export const parseAssignees = (assignees) => {
  if (!assignees) return [];

  const assigneesArray = Array.isArray(assignees) ? assignees : [assignees];

  // Flatten and split comma-separated emails
  return assigneesArray.filter(Boolean).flatMap((item) => {
    // If item is a string and contains commas, split it
    if (typeof item === 'string' && item.includes(',')) {
      return item
        .split(',')
        .map((email) => email.trim())
        .filter(Boolean);
    }
    return item;
  });
};

/**
 * Parse tags to array format
 */
export const parseTags = (tags) => {
  if (!tags) return [];
  return Array.isArray(tags) ? tags : tags ? [tags] : [];
};

/**
 * Validate task form
 */
export const validateTaskForm = (formData) => {
  const errors = {};

  // Validate title
  if (!formData.taskTitle?.trim()) {
    errors.titleError = 'Task title is required';
  }

  // Validate assignee
  if (!formData.assignedTo || formData.assignedTo.length === 0) {
    errors.assigneeError = 'At least one assignee is required';
  }

  // Validate duration
  if (!formData.duration || formData.duration.trim() === '') {
    errors.durationError = 'Duration is required';
  } else if (Number.isNaN(Number(formData.duration)) || Number(formData.duration) <= 0) {
    errors.durationError = 'Duration must be a positive number';
  }

  // Validate priority
  if (!formData.priority || formData.priority.trim() === '') {
    errors.priorityError = 'Priority is required';
  }

  // Validate status
  if (!formData.status || formData.status.trim() === '') {
    errors.statusError = 'Status is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

/**
 * Get assignee initials from email or name
 */
export const getAssigneeInitials = (assigneeItem, getInitials) => {
  if (typeof assigneeItem === 'string' && assigneeItem.includes('@')) {
    // Extract part before @ and get initials
    const emailPart = assigneeItem.split('@')[0];
    const parts = emailPart.split(/[._-]/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return emailPart.charAt(0).toUpperCase();
  }

  const assigneeName =
    typeof assigneeItem === 'string'
      ? assigneeItem
      : assigneeItem.full_name || assigneeItem.name || assigneeItem.email || 'User';

  return getInitials(assigneeName);
};

/**
 * Max file size constant (50 MB)
 */
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

/**
 * Normalize assignees to extract only email strings
 * Converts assignee objects to email strings, prioritizing user property
 * @param {string|Array|Object} assignees - Assignees to normalize
 * @returns {Array<string>} Array of normalized email strings
 */
export const normalizeAssignees = (assignees) => {
  let normalizedAssignees = [];
  if (Array.isArray(assignees)) {
    normalizedAssignees = assignees
      .map((a) => {
        if (typeof a === 'string') return a;
        // Extract email from assignee object (prioritize user property which contains email)
        return a.user || a.email || a.value || a.name || '';
      })
      .filter(Boolean);
  } else if (assignees) {
    const assigneeValue =
      typeof assignees === 'string'
        ? assignees
        : assignees.user || assignees.email || assignees.value || assignees.name || '';
    if (assigneeValue) {
      normalizedAssignees = [assigneeValue];
    }
  }
  return normalizedAssignees;
};
