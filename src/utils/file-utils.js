// Utility functions related to files (size formatting, etc.)

/**
 * Formats a file size in bytes to a human-readable string.
 * Example: 1024 -> "1 KB"
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes === 0) return '0 Bytes';

  const kiloByte = 1024;
  const sizeUnits = ['Bytes', 'KB', 'MB', 'GB'];
  const unitIndex = Math.floor(Math.log(bytes) / Math.log(kiloByte));

  return `${Number.parseFloat((bytes / Math.pow(kiloByte, unitIndex)).toFixed(0))} ${
    sizeUnits[unitIndex]
  }`;
};

/**
 * Gets the file extension from a file name.
 * Example: "document.pdf" -> "PDF"
 */
export const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.at(-1).toUpperCase() : '';
};
