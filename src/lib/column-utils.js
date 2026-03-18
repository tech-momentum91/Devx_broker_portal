/**
 * Simplified Column Management Utilities
 */

import { FIRST_COLUMN_NAME } from '@/constants/constants';

/**
 * Prepare column definitions for configuration
 * Extracts labels and creates config objects
 */
export const prepareColumnsForConfig = (columnDefs) => {
  const getLabel = (col) => {
    // Check for explicit label first (from API columns)
    if (col.label) return col.label;
    if (col.columnLabel) return col.columnLabel;
    if (typeof col.header === 'string') return col.header;
    if (col.id) {
      return col.id
        .replaceAll('_', ' ')
        .replaceAll(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    if (col.accessorKey) {
      return col.accessorKey
        .replaceAll('_', ' ')
        .replaceAll(/([A-Z])/g, ' $1')
        .trim()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
    return 'Unnamed Column';
  };

  return columnDefs.map((col, index) => ({
    id: col.id || col.accessorKey || `col_${index}`,
    label: getLabel(col),
    visible: col.visible !== false, // Default to true
    order: index,
    enableHiding: col.enableHiding !== false,
  }));
};

/**
 * Apply column configuration to column definitions
 * Returns visible columns in configured order
 */
export const applyColumnConfig = (columnDefs, columnConfig) => {
  if (!columnConfig?.length) return columnDefs;

  const defMap = new Map();
  columnDefs.forEach((def) => {
    const id = def.id || def.accessorKey;
    if (id) defMap.set(id, def);
  });

  // Filter to only visible columns
  let visibleConfigs = columnConfig.filter((config) => config.visible);

  // Ensure the pinned "first" column (if any) always appears first in the table,
  // so the rendered column order matches what the Column Manager shows.
  if (FIRST_COLUMN_NAME && Array.isArray(FIRST_COLUMN_NAME) && FIRST_COLUMN_NAME.length > 0) {
    // Find the first matching pinned column id that exists in the current config
    const pinnedId = FIRST_COLUMN_NAME.find((key) =>
      visibleConfigs.some((config) => config.id === key),
    );

    if (pinnedId) {
      const index = visibleConfigs.findIndex((config) => config.id === pinnedId);
      if (index > 0) {
        const reordered = [...visibleConfigs];
        const [pinnedConfig] = reordered.splice(index, 1);
        reordered.unshift(pinnedConfig);
        visibleConfigs = reordered;
      }
    }
  }

  return visibleConfigs.map((config) => defMap.get(config.id)).filter(Boolean);
};
